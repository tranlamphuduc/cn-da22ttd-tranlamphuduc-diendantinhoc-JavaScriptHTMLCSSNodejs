const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

// Lấy danh sách thông báo của user
router.get('/', auth, async (req, res) => {
  try {
    const [notifications] = await db.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 20`,
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

module.exports = { router, createNotification };