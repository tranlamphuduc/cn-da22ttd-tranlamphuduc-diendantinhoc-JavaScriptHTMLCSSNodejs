const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

// Hàm xóa thông báo cũ (quá 30 ngày)
const cleanupOldNotifications = async () => {
  try {
    const [result] = await db.execute(
      'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    if (result.affectedRows > 0) {
      console.log(`Đã xóa ${result.affectedRows} thông báo cũ (quá 30 ngày)`);
    }
    return result.affectedRows;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    return 0;
  }
};

// Lấy danh sách thông báo của user
router.get('/', auth, async (req, res) => {
  try {
    // Tự động xóa thông báo cũ của user này (quá 30 ngày)
    await db.execute(
      'DELETE FROM notifications WHERE user_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)',
      [req.user.id]
    );

    const [notifications] = await db.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông báo'
    });
  }
});

// Đếm số thông báo chưa đọc
router.get('/unread-count', auth, async (req, res) => {
  try {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      count: result[0].count
    });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đếm thông báo'
    });
  }
});

// Đánh dấu thông báo đã đọc
router.put('/:id/read', auth, async (req, res) => {
  try {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu thông báo đã đọc'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông báo'
    });
  }
});

// Đánh dấu tất cả thông báo đã đọc
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo đã đọc'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông báo'
    });
  }
});

// Tạo thông báo test (chỉ dùng để test)
router.post('/create-test', auth, async (req, res) => {
  try {
    const { type, title, message, related_id } = req.body;
    
    await db.execute(
      'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, type, title, message, related_id]
    );

    res.json({
      success: true,
      message: 'Tạo thông báo test thành công'
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo thông báo test'
    });
  }
});

// Tạo thông báo mới (helper function)
const createNotification = async (userId, type, title, message, relatedId = null) => {
  try {
    await db.execute(
      'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, relatedId]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Admin: Gửi thông báo cho tất cả người dùng hoặc cá nhân
router.post('/admin/send', auth, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền gửi thông báo' });
    }

    const { title, message, target_type, target_user_id } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Tiêu đề và nội dung không được để trống' });
    }

    if (target_type === 'individual' && !target_user_id) {
      return res.status(400).json({ message: 'Vui lòng chọn người dùng để gửi thông báo' });
    }

    if (target_type === 'all') {
      // Gửi cho tất cả người dùng
      const [users] = await db.execute('SELECT id FROM users WHERE is_active = TRUE');
      
      for (const user of users) {
        await db.execute(
          'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
          [user.id, 'admin_message', title, message]
        );
      }

      res.json({ 
        success: true, 
        message: `Đã gửi thông báo đến ${users.length} người dùng` 
      });
    } else {
      // Gửi cho cá nhân
      const [users] = await db.execute('SELECT id, full_name FROM users WHERE id = ?', [target_user_id]);
      
      if (users.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      await db.execute(
        'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
        [target_user_id, 'admin_message', title, message]
      );

      res.json({ 
        success: true, 
        message: `Đã gửi thông báo đến ${users[0].full_name}` 
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi thông báo' });
  }
});

// Admin: Lấy danh sách người dùng để chọn gửi thông báo
router.get('/admin/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
    }

    const [users] = await db.execute(
      'SELECT id, username, full_name, email FROM users WHERE is_active = TRUE ORDER BY full_name ASC'
    );

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = { router, createNotification, cleanupOldNotifications };