const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const nodemailer = require('nodemailer');

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

// Cấu hình email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true, // Bật debug để xem lỗi chi tiết
    logger: true
  });
};

// Tạo OTP ngẫu nhiên
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi OTP qua email
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Kiểm tra email có tồn tại không
    const [users] = await db.execute(
      'SELECT id, username, full_name FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
    }

    const user = users[0];
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP hết hạn sau 10 phút

    // Lưu OTP vào database
    await db.execute(
      'UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE id = ?',
      [otp, otpExpiry, user.id]
    );

    // Kiểm tra cấu hình email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured. OTP for testing:', otp);
      return res.json({
        message: 'Mã OTP đã được tạo (Email chưa cấu hình - kiểm tra console)',
        email: email,
        otp_for_testing: otp // Chỉ để testing, xóa trong production
      });
    }

    try {
      // Gửi email
      const transporter = createEmailTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Mã OTP đặt lại mật khẩu',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Đặt lại mật khẩu</h2>
            <p>Xin chào <strong>${user.full_name}</strong>,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản <strong>${user.username}</strong>.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h3 style="color: #007bff; margin: 0;">Mã OTP của bạn:</h3>
              <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 10px 0;">${otp}</h1>
              <p style="color: #666; margin: 0;">Mã này sẽ hết hạn sau 10 phút</p>
            </div>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({
        message: 'Mã OTP đã được gửi đến email của bạn',
        email: email
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Vẫn trả về thành công nhưng với thông báo khác
      res.json({
        message: 'Mã OTP đã được tạo (Lỗi gửi email - kiểm tra console)',
        email: email,
        otp_for_testing: otp, // Chỉ để testing
        error_details: emailError.message
      });
    }

  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ message: 'Lỗi server khi xử lý yêu cầu' });
  }
});

// Xác thực OTP và đặt lại mật khẩu
router.post('/reset-password', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP phải có 6 chữ số'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;

    // Kiểm tra OTP
    const [users] = await db.execute(
      'SELECT id, reset_otp, reset_otp_expiry FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    const user = users[0];

    if (!user.reset_otp || !user.reset_otp_expiry) {
      return res.status(400).json({ message: 'Không có yêu cầu đặt lại mật khẩu nào' });
    }

    if (user.reset_otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    if (new Date() > new Date(user.reset_otp_expiry)) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu và xóa OTP
    await db.execute(
      'UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({
      message: 'Đặt lại mật khẩu thành công'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;