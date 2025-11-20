const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// Lấy bình luận của bài viết
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Lấy tất cả comments (cả parent và replies)
    const [allComments] = await db.execute(`
      SELECT c.*, u.username, u.full_name, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.is_approved = TRUE
      ORDER BY 
        CASE WHEN c.parent_id IS NULL THEN c.id ELSE c.parent_id END ASC,
        c.parent_id ASC,
        c.created_at ASC
    `, [postId]);

    // Tổ chức comments thành cấu trúc cây
    const commentsMap = new Map();
    const rootComments = [];

    // Tạo map của tất cả comments
    allComments.forEach(comment => {
      comment.replies = [];
      commentsMap.set(comment.id, comment);
    });

    // Tổ chức thành cấu trúc parent-child
    allComments.forEach(comment => {
      if (comment.parent_id === null) {
        rootComments.push(comment);
      } else {
        const parent = commentsMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(comment);
        }
      }
    });

    // Phân trang chỉ áp dụng cho root comments
    const paginatedComments = rootComments.slice(offset, offset + limit);

    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as count FROM comments WHERE post_id = ? AND is_approved = TRUE AND parent_id IS NULL',
      [postId]
    );

    res.json({
      comments: paginatedComments,
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

// Tạo bình luận mới
router.post('/', auth, [
  body('content').notEmpty().withMessage('Nội dung bình luận không được để trống'),
  body('post_id').isInt().withMessage('ID bài viết không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, post_id, parent_id } = req.body;
    const user_id = req.user.id;

    // Kiểm tra bài viết có tồn tại không
    const [posts] = await db.execute('SELECT id FROM posts WHERE id = ? AND is_approved = TRUE', [post_id]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    // Kiểm tra parent comment nếu có
    if (parent_id) {
      const [parentComments] = await db.execute(
        'SELECT id FROM comments WHERE id = ? AND post_id = ? AND is_approved = TRUE',
        [parent_id, post_id]
      );
      if (parentComments.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy bình luận cha' });
      }
    }

    const [result] = await db.execute(
      'INSERT INTO comments (content, user_id, post_id, parent_id) VALUES (?, ?, ?, ?)',
      [content, user_id, post_id, parent_id || null]
    );

    // Tạo thông báo cho tác giả bài viết (nếu không phải chính họ bình luận)
    const [postInfo] = await db.execute(
      'SELECT user_id, title FROM posts WHERE id = ?',
      [post_id]
    );
    
    if (postInfo.length > 0 && postInfo[0].user_id !== user_id) {
      const [commenterInfo] = await db.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [user_id]
      );
      
      await createNotification(
        postInfo[0].user_id,
        'comment',
        'Có bình luận mới',
        `${commenterInfo[0].full_name} đã bình luận về bài viết "${postInfo[0].title}" của bạn`,
        post_id
      );
    }

    res.status(201).json({
      message: 'Tạo bình luận thành công',
      comment_id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật bình luận
router.put('/:id', auth, [
  body('content').notEmpty().withMessage('Nội dung bình luận không được để trống')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    // Kiểm tra quyền sở hữu
    const [comments] = await db.execute('SELECT user_id FROM comments WHERE id = ?', [id]);
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận' });
    }

    if (comments[0].user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa bình luận này' });
    }

    await db.execute('UPDATE comments SET content = ? WHERE id = ?', [content, id]);

    res.json({ message: 'Cập nhật bình luận thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa bình luận
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Kiểm tra quyền sở hữu
    const [comments] = await db.execute('SELECT user_id FROM comments WHERE id = ?', [id]);
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận' });
    }

    if (comments[0].user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xóa bình luận này' });
    }

    await db.execute('DELETE FROM comments WHERE id = ?', [id]);

    res.json({ message: 'Xóa bình luận thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;