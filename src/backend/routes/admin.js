const express = require('express');
const db = require('../config/database');
const { adminAuth } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// Lấy thống kê tổng quan
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Thống kê tổng số
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
    const [postCount] = await db.execute('SELECT COUNT(*) as count FROM posts WHERE is_approved = TRUE');
    const [commentCount] = await db.execute('SELECT COUNT(*) as count FROM comments WHERE is_approved = TRUE');
    const [documentCount] = await db.execute('SELECT COUNT(*) as count FROM documents WHERE is_approved = TRUE');

    // Thống kê 7 ngày qua
    const [userGrowth] = await db.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_active = TRUE
    `);
    
    const [postGrowth] = await db.execute(`
      SELECT COUNT(*) as count FROM posts 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_approved = TRUE
    `);

    const [commentGrowth] = await db.execute(`
      SELECT COUNT(*) as count FROM comments 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_approved = TRUE
    `);

    const [documentGrowth] = await db.execute(`
      SELECT COUNT(*) as count FROM documents 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_approved = TRUE
    `);

    // Thống kê báo cáo
    const [reportCount] = await db.execute('SELECT COUNT(*) as count FROM reports');
    const [pendingReports] = await db.execute('SELECT COUNT(*) as count FROM reports WHERE status = "pending"');
    
    // Thống kê lượt xem
    const [totalViews] = await db.execute('SELECT SUM(views) as total FROM posts');
    const [viewGrowth] = await db.execute(`
      SELECT SUM(views) as total FROM posts 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    res.json({
      stats: {
        totalUsers: userCount[0].count,
        totalPosts: postCount[0].count,
        totalComments: commentCount[0].count,
        totalDocuments: documentCount[0].count,
        totalReports: reportCount[0].count,
        pendingReports: pendingReports[0].count,
        totalViews: totalViews[0].total || 0,
        userGrowth: userGrowth[0].count,
        postGrowth: postGrowth[0].count,
        commentGrowth: commentGrowth[0].count,
        documentGrowth: documentGrowth[0].count,
        viewGrowth: viewGrowth[0].total || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Quản lý người dùng
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [users] = await db.execute(`
      SELECT id, username, email, full_name, role, is_active, created_at,
             (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count,
             (SELECT COUNT(*) FROM comments WHERE user_id = users.id) as comment_count
      FROM users 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [totalCount] = await db.execute('SELECT COUNT(*) as count FROM users');

    res.json({
      users,
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

// Khóa/mở khóa tài khoản
router.patch('/users/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await db.execute('SELECT is_active FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const newStatus = !users[0].is_active;
    await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

    res.json({ 
      message: newStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
      is_active: newStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Quản lý bài viết
router.get('/posts', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [posts] = await db.execute(`
      SELECT p.*, u.username, u.full_name, c.name as category_name,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [totalCount] = await db.execute('SELECT COUNT(*) as count FROM posts');

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

// Xóa bài viết với lý do
router.delete('/posts/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do xóa bài viết' });
    }

    // Lấy thông tin bài viết trước khi xóa
    const [posts] = await db.execute(
      'SELECT user_id, title FROM posts WHERE id = ?',
      [id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    const post = posts[0];

    // Xóa bài viết
    const [result] = await db.execute('DELETE FROM posts WHERE id = ?', [id]);

    // Tạo thông báo cho tác giả
    await createNotification(
      post.user_id,
      'post_deleted',
      'Bài viết bị xóa',
      `Bài viết "${post.title}" của bạn đã bị xóa bởi quản trị viên. Lý do: ${reason.trim()}`,
      id
    );

    res.json({ message: 'Đã xóa bài viết thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Quản lý tài liệu
router.get('/documents', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [documents] = await db.execute(`
      SELECT d.*, u.username, u.full_name, c.name as category_name, c.color as category_color
      FROM documents d
      JOIN users u ON d.user_id = u.id
      JOIN categories c ON d.category_id = c.id
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [totalCount] = await db.execute('SELECT COUNT(*) as count FROM documents');

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

// Xóa tài liệu với lý do
router.delete('/documents/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const fs = require('fs');
    const path = require('path');
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do xóa tài liệu' });
    }
    
    // Lấy thông tin file trước khi xóa
    const [documents] = await db.execute(
      'SELECT user_id, title, file_path FROM documents WHERE id = ?', 
      [id]
    );
    
    if (documents.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const document = documents[0];

    // Xóa file khỏi hệ thống
    const filePath = path.join(__dirname, '../uploads', document.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Xóa record khỏi database
    const [result] = await db.execute('DELETE FROM documents WHERE id = ?', [id]);

    // Tạo thông báo cho tác giả
    await createNotification(
      document.user_id,
      'document_deleted',
      'Tài liệu bị xóa',
      `Tài liệu "${document.title}" của bạn đã bị xóa bởi quản trị viên. Lý do: ${reason.trim()}`,
      id
    );

    res.json({ message: 'Đã xóa tài liệu thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Quản lý bình luận
router.get('/comments', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [comments] = await db.execute(`
      SELECT c.*, u.username, u.full_name, p.title as post_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      WHERE c.is_approved = TRUE
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [totalCount] = await db.execute('SELECT COUNT(*) as count FROM comments WHERE is_approved = TRUE');

    res.json({
      comments,
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

// Xóa bình luận với lý do
router.delete('/comments/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do xóa bình luận' });
    }

    // Lấy thông tin bình luận trước khi xóa
    const [comments] = await db.execute(
      'SELECT c.user_id, c.content, p.title as post_title FROM comments c JOIN posts p ON c.post_id = p.id WHERE c.id = ?',
      [id]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận' });
    }

    const comment = comments[0];

    // Xóa bình luận
    const [result] = await db.execute('DELETE FROM comments WHERE id = ?', [id]);

    // Tạo thông báo cho tác giả bình luận
    const commentPreview = comment.content.length > 50 
      ? comment.content.substring(0, 50) + '...' 
      : comment.content;

    await createNotification(
      comment.user_id,
      'comment_deleted',
      'Bình luận bị xóa',
      `Bình luận "${commentPreview}" của bạn trong bài viết "${comment.post_title}" đã bị xóa bởi quản trị viên. Lý do: ${reason.trim()}`,
      id
    );

    res.json({ message: 'Đã xóa bình luận thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Quản lý danh mục
// Tạo danh mục mới
router.post('/categories', adminAuth, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    }

    if (name.length > 100) {
      return res.status(400).json({ message: 'Tên danh mục không được vượt quá 100 ký tự' });
    }

    // Kiểm tra tên danh mục đã tồn tại chưa
    const [existingCategories] = await db.execute(
      'SELECT id FROM categories WHERE name = ?',
      [name.trim()]
    );

    if (existingCategories.length > 0) {
      return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
    }

    // Validate color format
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    const finalColor = color && colorRegex.test(color) ? color : '#007bff';

    // Tạo danh mục mới
    const [result] = await db.execute(
      'INSERT INTO categories (name, description, color) VALUES (?, ?, ?)',
      [name.trim(), description?.trim() || null, finalColor]
    );

    // Lấy thông tin danh mục vừa tạo
    const [newCategory] = await db.execute(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Tạo danh mục thành công',
      category: newCategory[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật danh mục
router.put('/categories/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    }

    if (name.length > 100) {
      return res.status(400).json({ message: 'Tên danh mục không được vượt quá 100 ký tự' });
    }

    // Kiểm tra danh mục có tồn tại không
    const [categories] = await db.execute('SELECT id FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    // Kiểm tra tên danh mục đã tồn tại chưa (trừ chính nó)
    const [existingCategories] = await db.execute(
      'SELECT id FROM categories WHERE name = ? AND id != ?',
      [name.trim(), id]
    );

    if (existingCategories.length > 0) {
      return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
    }

    // Validate color format
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    const finalColor = color && colorRegex.test(color) ? color : '#007bff';

    // Cập nhật danh mục
    await db.execute(
      'UPDATE categories SET name = ?, description = ?, color = ? WHERE id = ?',
      [name.trim(), description?.trim() || null, finalColor, id]
    );

    // Lấy thông tin danh mục đã cập nhật
    const [updatedCategory] = await db.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Cập nhật danh mục thành công',
      category: updatedCategory[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa danh mục
router.delete('/categories/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra danh mục có tồn tại không
    const [categories] = await db.execute('SELECT name FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    // Kiểm tra xem có bài viết hoặc tài liệu nào đang sử dụng danh mục này không
    const [posts] = await db.execute('SELECT COUNT(*) as count FROM posts WHERE category_id = ?', [id]);
    const [documents] = await db.execute('SELECT COUNT(*) as count FROM documents WHERE category_id = ?', [id]);

    if (posts[0].count > 0 || documents[0].count > 0) {
      return res.status(400).json({ 
        message: `Không thể xóa danh mục "${categories[0].name}" vì đang có ${posts[0].count} bài viết và ${documents[0].count} tài liệu sử dụng danh mục này. Vui lòng chuyển chúng sang danh mục khác trước khi xóa.`
      });
    }

    // Xóa danh mục
    await db.execute('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ message: 'Đã xóa danh mục thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;