const express = require('express');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ==================== THEO DÕI NGƯỜI DÙNG ====================

// Lấy danh sách người đang theo dõi
router.get('/following', auth, async (req, res) => {
  try {
    const [following] = await db.execute(`
      SELECT uf.id as follow_id, uf.created_at as followed_at,
             u.id, u.username, u.full_name, u.avatar,
             (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_approved = TRUE) as post_count
      FROM user_follows uf
      JOIN users u ON uf.following_id = u.id
      WHERE uf.follower_id = ? AND u.is_active = TRUE
      ORDER BY uf.created_at DESC
    `, [req.user.id]);

    res.json({ following });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy danh sách người theo dõi mình
router.get('/followers', auth, async (req, res) => {
  try {
    const [followers] = await db.execute(`
      SELECT uf.id as follow_id, uf.created_at as followed_at,
             u.id, u.username, u.full_name, u.avatar,
             (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_approved = TRUE) as post_count
      FROM user_follows uf
      JOIN users u ON uf.follower_id = u.id
      WHERE uf.following_id = ? AND u.is_active = TRUE
      ORDER BY uf.created_at DESC
    `, [req.user.id]);

    res.json({ followers });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Kiểm tra đã theo dõi người dùng chưa
router.get('/user/check/:userId', auth, async (req, res) => {
  try {
    const [follow] = await db.execute(
      'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, req.params.userId]
    );

    res.json({ isFollowing: follow.length > 0 });
  } catch (error) {
    console.error('Error checking follow:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Theo dõi người dùng
router.post('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Không thể tự theo dõi chính mình
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'Không thể theo dõi chính mình' });
    }

    // Kiểm tra user tồn tại
    const [user] = await db.execute('SELECT id, full_name FROM users WHERE id = ? AND is_active = TRUE', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra đã theo dõi chưa
    const [existing] = await db.execute(
      'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Đã theo dõi người dùng này' });
    }

    await db.execute(
      'INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)',
      [req.user.id, userId]
    );

    // Gửi thông báo cho người được theo dõi
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_url) 
       VALUES (?, 'new_follower', 'Có người theo dõi mới', ?, ?, ?)`,
      [userId, `${req.user.full_name} đã bắt đầu theo dõi bạn`, req.user.id, `/profile/${req.user.id}`]
    );

    res.status(201).json({ message: 'Đã theo dõi người dùng' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Bỏ theo dõi người dùng
router.delete('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await db.execute(
      'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Chưa theo dõi người dùng này' });
    }

    res.json({ message: 'Đã bỏ theo dõi' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy số lượng follower/following của user
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [followers] = await db.execute(
      'SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?',
      [userId]
    );

    const [following] = await db.execute(
      'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?',
      [userId]
    );

    res.json({
      followers: followers[0].count,
      following: following[0].count
    });
  } catch (error) {
    console.error('Error fetching follow stats:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
