const express = require('express');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách bài viết đã lưu
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [bookmarks] = await db.execute(`
      SELECT b.id as bookmark_id, b.created_at as bookmarked_at,
             p.id, p.title, p.content, p.views, p.created_at,
             u.id as user_id, u.username, u.full_name, u.avatar,
             c.name as category_name, c.color as category_color,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_approved = TRUE) as comment_count
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE b.user_id = ? AND p.is_approved = TRUE
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, limit, offset]);

    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as count FROM bookmarks b JOIN posts p ON b.post_id = p.id WHERE b.user_id = ? AND p.is_approved = TRUE',
      [req.user.id]
    );

    res.json({
      bookmarks,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Kiểm tra bài viết đã được lưu chưa
router.get('/check/:postId', auth, async (req, res) => {
  try {
    const [bookmark] = await db.execute(
      'SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?',
      [req.user.id, req.params.postId]
    );

    res.json({ isBookmarked: bookmark.length > 0 });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lưu bài viết
router.post('/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    // Kiểm tra bài viết tồn tại
    const [post] = await db.execute('SELECT id FROM posts WHERE id = ? AND is_approved = TRUE', [postId]);
    if (post.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    // Kiểm tra đã lưu chưa
    const [existing] = await db.execute(
      'SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?',
      [req.user.id, postId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Bài viết đã được lưu' });
    }

    await db.execute(
      'INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)',
      [req.user.id, postId]
    );

    res.status(201).json({ message: 'Đã lưu bài viết' });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Bỏ lưu bài viết
router.delete('/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const [result] = await db.execute(
      'DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?',
      [req.user.id, postId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bookmark' });
    }

    res.json({ message: 'Đã bỏ lưu bài viết' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
