const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Cấu hình multer cho upload avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Lấy thông tin hồ sơ người dùng
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.execute(`
      SELECT id, username, email, full_name, avatar, created_at,
             (SELECT COUNT(*) FROM posts WHERE user_id = users.id AND is_approved = TRUE) as post_count,
             (SELECT COUNT(*) FROM comments WHERE user_id = users.id AND is_approved = TRUE) as comment_count,
             (SELECT COUNT(*) FROM documents WHERE user_id = users.id AND is_approved = TRUE) as document_count
      FROM users 
      WHERE id = ? AND is_active = TRUE
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật thông tin cá nhân
router.put('/profile/:id', auth, upload.single('avatar'), [
  body('full_name').notEmpty().withMessage('Họ tên không được để trống'),
  body('username').isLength({ min: 3 }).withMessage('Tên người dùng phải có ít nhất 3 ký tự')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { full_name, username } = req.body;
    const user_id = req.user.id;

    // Kiểm tra quyền (chỉ được sửa profile của chính mình)
    if (parseInt(id) !== user_id) {
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa profile này' });
    }

    // Kiểm tra username đã tồn tại chưa (trừ user hiện tại)
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, user_id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Tên người dùng đã được sử dụng' });
    }

    // Kiểm tra tên hiển thị đã tồn tại chưa (trừ user hiện tại)
    const [existingFullNames] = await db.execute(
      'SELECT id FROM users WHERE full_name = ? AND id != ?',
      [full_name, user_id]
    );

    if (existingFullNames.length > 0) {
      return res.status(400).json({ message: 'Tên hiển thị đã được sử dụng' });
    }



    let avatarPath = null;
    
    // Xử lý upload avatar nếu có
    if (req.file) {
      avatarPath = `/uploads/avatars/${req.file.filename}`;
      
      // Xóa avatar cũ nếu có
      if (req.user.avatar) {
        const oldAvatarPath = path.join(__dirname, '..', req.user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
    }

    // Cập nhật thông tin
    if (avatarPath) {
      await db.execute(
        'UPDATE users SET full_name = ?, username = ?, avatar = ? WHERE id = ?',
        [full_name, username, avatarPath, user_id]
      );
    } else {
      await db.execute(
        'UPDATE users SET full_name = ?, username = ? WHERE id = ?',
        [full_name, username, user_id]
      );
    }

    // Lấy thông tin user đã cập nhật
    const [updatedUser] = await db.execute(
      'SELECT id, username, email, full_name, avatar, role FROM users WHERE id = ?',
      [user_id]
    );

    res.json({ 
      message: 'Cập nhật thông tin thành công',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error(error);
    // Xóa file nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
    }

    const user_id = req.user.id;
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Xóa avatar cũ nếu có
    if (req.user.avatar) {
      const oldAvatarPath = path.join(__dirname, '..', req.user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    await db.execute('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, user_id]);

    res.json({
      message: 'Upload avatar thành công',
      avatar: avatarPath
    });
  } catch (error) {
    console.error(error);
    // Xóa file nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đổi mật khẩu
router.put('/password', auth, [
  body('current_password').notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
  body('new_password').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;
    const user_id = req.user.id;

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(current_password, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user_id]);

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy bài viết của người dùng
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [posts] = await db.execute(`
      SELECT p.*, c.name as category_name, c.color as category_color,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_approved = TRUE) as comment_count
      FROM posts p
      JOIN categories c ON p.category_id = c.id
      WHERE p.user_id = ? AND p.is_approved = TRUE
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND is_approved = TRUE',
      [id]
    );

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy tài liệu của người dùng
router.get('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [documents] = await db.execute(`
      SELECT d.*, c.name as category_name, c.color as category_color
      FROM documents d
      JOIN categories c ON d.category_id = c.id
      WHERE d.user_id = ? AND d.is_approved = TRUE
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as count FROM documents WHERE user_id = ? AND is_approved = TRUE',
      [id]
    );

    res.json({
      documents,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;