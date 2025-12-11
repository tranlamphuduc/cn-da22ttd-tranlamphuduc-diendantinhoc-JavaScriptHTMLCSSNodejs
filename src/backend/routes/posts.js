const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkBan } = require('../middleware/auth');
const { updatePostTags } = require('./tags');

const router = express.Router();

// Lấy danh sách bài viết
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'newest'; // newest, oldest, most_viewed, least_viewed
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
      query += ' AND (p.title LIKE ? OR p.content LIKE ? OR u.full_name LIKE ? OR u.username LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Thêm sắp xếp theo lựa chọn (bài ghim luôn lên đầu)
    let orderBy = 'p.created_at DESC'; // mặc định
    switch (sortBy) {
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
      case 'most_viewed':
        orderBy = 'p.views DESC';
        break;
      case 'least_viewed':
        orderBy = 'p.views ASC';
        break;
      default:
        orderBy = 'p.created_at DESC';
    }

    // Bài ghim luôn lên đầu, sau đó mới sắp xếp theo tiêu chí
    query += ` ORDER BY COALESCE(p.is_pinned, 0) DESC, p.pinned_at DESC, ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [posts] = await db.execute(query, params);

    // Lấy tags cho mỗi bài viết
    for (const post of posts) {
      const [tags] = await db.execute(`
        SELECT t.id, t.name, t.slug FROM tags t
        JOIN post_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `, [post.id]);
      post.tags = tags;
    }

    // Đếm tổng số bài viết
    let countQuery = 'SELECT COUNT(*) as count FROM posts p WHERE p.is_approved = TRUE';
    const countParams = [];

    if (category) {
      countQuery += ' AND p.category_id = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (p.title LIKE ? OR p.content LIKE ? OR EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id AND (u.full_name LIKE ? OR u.username LIKE ?)))';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
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
router.post('/', auth, checkBan('post'), [
  body('title').notEmpty().withMessage('Tiêu đề không được để trống'),
  body('content').notEmpty().withMessage('Nội dung không được để trống'),
  body('category_id').isInt().withMessage('Danh mục không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, category_id, tags } = req.body;
    const user_id = req.user.id;

    const [result] = await db.execute(
      'INSERT INTO posts (title, content, user_id, category_id) VALUES (?, ?, ?, ?)',
      [title, content, user_id, category_id]
    );

    const postId = result.insertId;

    // Thêm tags cho bài viết
    if (tags && Array.isArray(tags)) {
      await updatePostTags(postId, tags);
    }

    // Gửi thông báo cho người theo dõi user
    const [userFollowers] = await db.execute(
      'SELECT follower_id FROM user_follows WHERE following_id = ?',
      [user_id]
    );

    for (const follower of userFollowers) {
      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_url) 
         VALUES (?, 'new_post', 'Bài viết mới', ?, ?, ?)`,
        [follower.follower_id, `${req.user.full_name} đã đăng bài viết mới: "${title}"`, postId, `/posts/${postId}`]
      );
    }

    res.status(201).json({
      message: 'Tạo bài viết thành công',
      post_id: postId
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
    const { title, content, category_id, tags } = req.body;
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

    // Cập nhật tags
    if (tags && Array.isArray(tags)) {
      await updatePostTags(id, tags);
    }

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

// API tìm kiếm tổng hợp (bài viết, người dùng, tags)
router.get('/search/all', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ posts: [], users: [], tags: [] });
    }

    const searchTerm = `%${q}%`;

    // Tìm bài viết
    const [posts] = await db.execute(`
      SELECT p.id, p.title, u.full_name as author, c.name as category_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_approved = TRUE AND (p.title LIKE ? OR p.content LIKE ?)
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [searchTerm, searchTerm]);

    // Tìm người dùng
    const [users] = await db.execute(`
      SELECT id, username, full_name, avatar
      FROM users
      WHERE is_active = TRUE AND (username LIKE ? OR full_name LIKE ?)
      ORDER BY full_name ASC
      LIMIT 5
    `, [searchTerm, searchTerm]);

    // Tìm tags
    const [tags] = await db.execute(`
      SELECT id, name, slug, usage_count
      FROM tags
      WHERE name LIKE ?
      ORDER BY usage_count DESC
      LIMIT 5
    `, [searchTerm]);

    res.json({ posts, users, tags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;