const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.execute('SELECT * FROM users WHERE id = ? AND is_active = TRUE', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ message: 'Không có quyền truy cập' });
  }
};

// Middleware kiểm tra cấm theo loại
const checkBan = (banType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next();
      }

      const [bans] = await db.execute(`
        SELECT ban_type, ban_until, reason
        FROM user_bans 
        WHERE user_id = ? AND ban_type = ? AND is_active = TRUE
      `, [req.user.id, banType]);

      if (bans.length > 0) {
        const ban = bans[0];
        
        // Kiểm tra xem lệnh cấm còn hiệu lực không
        if (!ban.ban_until || new Date(ban.ban_until) > new Date()) {
          const banTypeName = {
            'account': 'tài khoản',
            'comment': 'bình luận',
            'post': 'đăng bài viết',
            'document': 'đăng tài liệu',
            'report': 'báo cáo'
          }[banType] || banType;

          const banUntilStr = ban.ban_until 
            ? `đến ${new Date(ban.ban_until).toLocaleString('vi-VN')}`
            : 'vĩnh viễn';

          return res.status(403).json({ 
            message: `Bạn đã bị cấm ${banTypeName} ${banUntilStr}.${ban.reason ? ` Lý do: ${ban.reason}` : ''}`,
            banned: true,
            ban_type: banType,
            ban_until: ban.ban_until
          });
        } else {
          // Lệnh cấm đã hết hạn, cập nhật trạng thái
          await db.execute(
            'UPDATE user_bans SET is_active = FALSE WHERE user_id = ? AND ban_type = ?',
            [req.user.id, banType]
          );
        }
      }

      next();
    } catch (error) {
      console.error('Check ban error:', error);
      next();
    }
  };
};

// Lấy trạng thái cấm của user
const getUserBanStatus = async (userId) => {
  try {
    const [bans] = await db.execute(`
      SELECT ban_type, ban_until, reason
      FROM user_bans 
      WHERE user_id = ? AND is_active = TRUE
    `, [userId]);

    const activeBans = {};
    for (const ban of bans) {
      if (!ban.ban_until || new Date(ban.ban_until) > new Date()) {
        activeBans[ban.ban_type] = {
          ban_until: ban.ban_until,
          reason: ban.reason
        };
      }
    }

    return activeBans;
  } catch (error) {
    console.error('Get ban status error:', error);
    return {};
  }
};

module.exports = { auth, adminAuth, checkBan, getUserBanStatus };