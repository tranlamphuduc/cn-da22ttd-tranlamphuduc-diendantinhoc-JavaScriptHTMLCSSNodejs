const express = require('express');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Lấy tất cả tags (phổ biến nhất - chỉ hiển thị tags đã được sử dụng)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const showAll = req.query.showAll === 'true'; // Hiển thị tất cả tags kể cả chưa dùng
    
    let query = 'SELECT * FROM tags';
    if (!showAll) {
      query += ' WHERE usage_count > 0'; // Chỉ hiển thị tags đã được sử dụng
    }
    query += ' ORDER BY usage_count DESC, name ASC LIMIT ?';
    
    const [tags] = await db.execute(query, [limit]);
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tìm kiếm tags (autocomplete)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) {
      return res.json({ tags: [] });
    }

    const [tags] = await db.execute(
      'SELECT * FROM tags WHERE name LIKE ? ORDER BY usage_count DESC LIMIT 10',
      [`%${q}%`]
    );
    res.json({ tags });
  } catch (error) {
    console.error('Error searching tags:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy bài viết theo tag
router.get('/:slug/posts', async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Lấy tag info
    const [tags] = await db.execute('SELECT * FROM tags WHERE slug = ?', [slug]);
    if (tags.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tag' });
    }

    const tag = tags[0];

    // Lấy bài viết có tag này
    const [posts] = await db.execute(`
      SELECT p.*, u.username, u.full_name, u.avatar, c.name as category_name, c.color as category_color,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_approved = TRUE) as comment_count
      FROM posts p
      JOIN post_tags pt ON p.id = pt.post_id
      JOIN users u ON p.user_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE pt.tag_id = ? AND p.is_approved = TRUE
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [tag.id, limit, offset]);

    // Đếm tổng
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as count FROM post_tags pt JOIN posts p ON pt.post_id = p.id WHERE pt.tag_id = ? AND p.is_approved = TRUE',
      [tag.id]
    );

    res.json({
      tag,
      posts,
      pagination: {
        page,
        limit,
        total: countResult[0].count,
        pages: Math.ceil(countResult[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts by tag:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy tags của một bài viết
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const [tags] = await db.execute(`
      SELECT t.* FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
      ORDER BY t.name ASC
    `, [postId]);
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching post tags:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tạo hoặc lấy tag (helper function)
const getOrCreateTag = async (tagName) => {
  const name = tagName.toLowerCase().trim().replace(/[^a-z0-9\-]/g, '');
  if (!name || name.length < 2) return null;

  const slug = name;

  // Kiểm tra tag đã tồn tại chưa
  const [existing] = await db.execute('SELECT * FROM tags WHERE slug = ?', [slug]);
  if (existing.length > 0) {
    return existing[0];
  }

  // Tạo tag mới
  const [result] = await db.execute(
    'INSERT INTO tags (name, slug) VALUES (?, ?)',
    [name, slug]
  );

  return { id: result.insertId, name, slug, usage_count: 0 };
};

// Cập nhật tags cho bài viết
const updatePostTags = async (postId, tagNames) => {
  // Xóa tags cũ
  await db.execute('DELETE FROM post_tags WHERE post_id = ?', [postId]);

  // Giảm usage_count cho tags cũ
  await db.execute(`
    UPDATE tags SET usage_count = GREATEST(0, usage_count - 1)
    WHERE id IN (SELECT tag_id FROM post_tags WHERE post_id = ?)
  `, [postId]);

  if (!tagNames || tagNames.length === 0) return [];

  const addedTags = [];
  for (const tagName of tagNames.slice(0, 10)) { // Giới hạn 10 tags
    const tag = await getOrCreateTag(tagName);
    if (tag) {
      try {
        await db.execute(
          'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
          [postId, tag.id]
        );
        // Tăng usage_count
        await db.execute('UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?', [tag.id]);
        addedTags.push(tag);
      } catch (e) {
        // Ignore duplicate
      }
    }
  }

  return addedTags;
};

module.exports = { router, getOrCreateTag, updatePostTags };
