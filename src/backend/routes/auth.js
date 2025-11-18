const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Đăng ký
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Tên đăng nhập phải có ít nhất 3 ký tự'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('full_name').notEmpty().withMessage('Họ tên không được để trống')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, full_name } = req.body;

    // Kiểm tra user đã tồn tại
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ? OR full_name = ?',
      [email, username, full_name]
    );

    if (existingUsers.length > 0) {
      // Kiểm tra cụ thể trường nào bị trùng
      const [emailCheck] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
      const [usernameCheck] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
      const [fullNameCheck] = await db.execute('SELECT id FROM users WHERE full_name = ?', [full_name]);
      
      if (emailCheck.length > 0) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
      if (usernameCheck.length > 0) {
        return res.status(400).json({ message: 'Tên người dùng đã được sử dụng' });
      }
      if (fullNameCheck.length > 0) {
        return res.status(400).json({ message: 'Tên hiển thị đã được sử dụng' });
      }
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, full_name]
    );

    // Tạo token
    const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        full_name,
        role: 'user'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Đăng nhập
router.post('/login', [
  body('username').notEmpty().withMessage('Tên đăng nhập không được để trống'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Tìm user
    const [users] = await db.execute(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    const user = users[0];

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Tạo token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy thông tin user hiện tại
router.get('/me', auth, async (req, res) => {
  try {
    const { password, ...userInfo } = req.user;
    res.json({ user: userInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;