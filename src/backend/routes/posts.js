const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách bài viết
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.username, u.full_name, u.avatar, c.name as category_name, c.color as category_color,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_approved = TRUE) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_approved = TRUE
    `;
    
    const params = [];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [posts] = await db.execute(query, params);

    // Đếm tổng số bài viết
    let countQuery = 'SELECT COUNT(*) as count FROM posts p WHERE p.is_approved = TRUE';
    const countParams = [];

    if (category) {
      countQuery += ' AND p.category_id = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [totalCount] = await db.execute(countQuery, countParams);

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

// Lấy chi tiết bài viết
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [posts] = await db.execute(`
      SELECT p.*, u.username, u.full_name, u.avatar, c.name as category_name, c.color as category_color
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_approved = TRUE
    `, [id]);

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    res.json({ post: posts[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// API riêng để tăng lượt xem
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);

    res.json({ message: 'View incremented' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tạo bài viết mới
router.post('/', auth, [
  body('title').notEmpty().withMessage('Tiêu đề không được để trống'),
  body('content').notEmpty().withMessage('Nội dung không được để trống'),
  body('category_id').isInt().withMessage('Danh mục không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, category_id } = req.body;
    const user_id = req.user.id;

    const [result] = await db.execute(
      'INSERT INTO posts (title, content, user_id, category_id) VALUES (?, ?, ?, ?)',
      [title, content, user_id, category_id]
    );

    res.status(201).json({
      message: 'Tạo bài viết thành công',
      post_id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật bài viết
router.put('/:id', auth, [
  body('title').notEmpty().withMessage('Tiêu đề không được để trống'),
  body('content').notEmpty().withMessage('Nội dung không được để trống'),
  body('category_id').isInt().withMessage('Danh mục không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content, category_id } = req.body;
    const user_id = req.user.id;

    // Kiểm tra quyền sở hữu
    const [posts] = await db.execute('SELECT user_id FROM posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    if (posts[0].user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa bài viết này' });
    }

    await db.execute(
      'UPDATE posts SET title = ?, content = ?, category_id = ? WHERE id = ?',
      [title, content, category_id, id]
    );

    res.json({ message: 'Cập nhật bài viết thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa bài viết
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Kiểm tra quyền sở hữu
    const [posts] = await db.execute('SELECT user_id FROM posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    if (posts[0].user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xóa bài viết này' });
    }

    await db.execute('DELETE FROM posts WHERE id = ?', [id]);

    res.json({ message: 'Xóa bài viết thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;