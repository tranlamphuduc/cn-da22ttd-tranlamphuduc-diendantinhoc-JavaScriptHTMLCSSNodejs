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
      SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active, u.created_at,
             (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
             (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comment_count,
             rw.warning_count as false_report_count,
             rw.is_banned_from_reporting,
             rw.ban_until
      FROM users u
      LEFT JOIN report_warnings rw ON u.id = rw.user_id
      ORDER BY u.created_at DESC 
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

// Lấy chi tiết cảnh báo báo cáo sai của user
router.get('/users/:id/report-warnings', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin cảnh báo
    const [warnings] = await db.execute(
      'SELECT * FROM report_warnings WHERE user_id = ?',
      [id]
    );

    // Lấy danh sách báo cáo sai của user
    const [falseReports] = await db.execute(`
      SELECT r.*, 
             CASE 
               WHEN r.report_type = 'user' THEN u.full_name
               WHEN r.report_type = 'post' THEN p.title
               WHEN r.report_type = 'document' THEN d.title
             END as reported_content_name
      FROM reports r
      LEFT JOIN users u ON r.reported_user_id = u.id
      LEFT JOIN posts p ON r.reported_post_id = p.id
      LEFT JOIN documents d ON r.reported_document_id = d.id
      WHERE r.reporter_id = ? AND r.is_false_report = TRUE
      ORDER BY r.created_at DESC
    `, [id]);

    res.json({
      warning: warnings.length > 0 ? warnings[0] : null,
      false_reports: falseReports
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Giảm hình phạt báo cáo sai cho user
router.post('/users/:id/reduce-penalty', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'reduce_warning', 'unban', 'reset_all'

    // Kiểm tra user tồn tại
    const [users] = await db.execute('SELECT id, full_name FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Lấy thông tin cảnh báo hiện tại
    const [warnings] = await db.execute(
      'SELECT * FROM report_warnings WHERE user_id = ?',
      [id]
    );

    if (warnings.length === 0) {
      return res.status(400).json({ message: 'Người dùng này không có cảnh báo nào' });
    }

    const warning = warnings[0];

    switch (action) {
      case 'reduce_warning':
        // Giảm 1 lần cảnh báo
        if (warning.warning_count <= 0) {
          return res.status(400).json({ message: 'Số lần cảnh báo đã là 0' });
        }
        await db.execute(
          'UPDATE report_warnings SET warning_count = warning_count - 1 WHERE user_id = ?',
          [id]
        );
        
        // Tạo thông báo cho user
        await createNotification(
          id,
          'penalty_reduced',
          'Giảm hình phạt',
          'Quản trị viên đã giảm 1 lần cảnh báo báo cáo sai cho bạn do hoạt động tích cực.',
          null
        );
        
        res.json({ message: 'Đã giảm 1 lần cảnh báo thành công' });
        break;

      case 'unban':
        // Gỡ cấm báo cáo
        if (!warning.is_banned_from_reporting) {
          return res.status(400).json({ message: 'Người dùng này không bị cấm báo cáo' });
        }
        await db.execute(
          'UPDATE report_warnings SET is_banned_from_reporting = FALSE, ban_until = NULL WHERE user_id = ?',
          [id]
        );
        
        // Tạo thông báo cho user
        await createNotification(
          id,
          'penalty_reduced',
          'Gỡ cấm báo cáo',
          'Quản trị viên đã gỡ lệnh cấm báo cáo cho bạn. Bạn có thể tiếp tục gửi báo cáo.',
          null
        );
        
        res.json({ message: 'Đã gỡ cấm báo cáo thành công' });
        break;

      case 'reset_all':
        // Reset toàn bộ cảnh báo
        await db.execute(
          'UPDATE report_warnings SET warning_count = 0, is_banned_from_reporting = FALSE, ban_until = NULL WHERE user_id = ?',
          [id]
        );
        
        // Tạo thông báo cho user
        await createNotification(
          id,
          'penalty_reduced',
          'Xóa toàn bộ hình phạt',
          'Quản trị viên đã xóa toàn bộ cảnh báo và hình phạt báo cáo sai cho bạn.',
          null
        );
        
        res.json({ message: 'Đã reset toàn bộ cảnh báo thành công' });
        break;

      default:
        return res.status(400).json({ message: 'Hành động không hợp lệ' });
    }
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

// Ghim/bỏ ghim bài viết
router.patch('/posts/:id/pin', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra bài viết tồn tại
    const [posts] = await db.execute('SELECT id, is_pinned, title FROM posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    const newPinnedStatus = !posts[0].is_pinned;
    const pinnedAt = newPinnedStatus ? new Date() : null;

    await db.execute(
      'UPDATE posts SET is_pinned = ?, pinned_at = ? WHERE id = ?',
      [newPinnedStatus, pinnedAt, id]
    );

    res.json({
      message: newPinnedStatus ? 'Đã ghim bài viết lên đầu' : 'Đã bỏ ghim bài viết',
      is_pinned: newPinnedStatus
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

// ==================== QUẢN LÝ CẤM NGƯỜI DÙNG ====================

// Hàm tính thời gian cấm
const calculateBanUntil = (duration) => {
  if (duration === 'permanent') return null;
  
  const now = new Date();
  switch (duration) {
    case '1_day':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '3_days':
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case '1_week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '1_month':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};

// Lấy tên loại cấm
const getBanTypeName = (banType) => {
  const names = {
    'account': 'tài khoản',
    'comment': 'bình luận',
    'post': 'đăng bài viết',
    'document': 'đăng tài liệu',
    'report': 'báo cáo'
  };
  return names[banType] || banType;
};

// Lấy tên thời gian cấm
const getDurationName = (duration) => {
  const names = {
    '1_day': '1 ngày',
    '3_days': '3 ngày',
    '1_week': '1 tuần',
    '1_month': '1 tháng',
    'permanent': 'vĩnh viễn'
  };
  return names[duration] || duration;
};

// Lấy danh sách cấm của user
router.get('/users/:id/bans', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [bans] = await db.execute(`
      SELECT ub.*, u.full_name as banned_by_name
      FROM user_bans ub
      LEFT JOIN users u ON ub.banned_by = u.id
      WHERE ub.user_id = ?
      ORDER BY ub.created_at DESC
    `, [id]);

    // Kiểm tra và cập nhật trạng thái cấm đã hết hạn
    const activeBans = bans.filter(ban => {
      if (!ban.is_active) return false;
      if (ban.ban_until && new Date(ban.ban_until) < new Date()) {
        // Cấm đã hết hạn, cập nhật trạng thái
        db.execute('UPDATE user_bans SET is_active = FALSE WHERE id = ?', [ban.id]);
        return false;
      }
      return true;
    });

    res.json({
      bans: bans,
      active_bans: activeBans
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cấm người dùng
router.post('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { ban_type, duration, reason } = req.body;
    const adminId = req.user.id;

    // Validate
    const validBanTypes = ['account', 'comment', 'post', 'document', 'report'];
    const validDurations = ['1_day', '3_days', '1_week', '1_month', 'permanent'];

    if (!validBanTypes.includes(ban_type)) {
      return res.status(400).json({ message: 'Loại cấm không hợp lệ' });
    }

    if (!validDurations.includes(duration)) {
      return res.status(400).json({ message: 'Thời gian cấm không hợp lệ' });
    }

    // Kiểm tra user tồn tại
    const [users] = await db.execute('SELECT id, full_name, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Không cho phép cấm admin
    if (users[0].role === 'admin') {
      return res.status(400).json({ message: 'Không thể cấm quản trị viên' });
    }

    const banUntil = calculateBanUntil(duration);

    // Kiểm tra xem đã có lệnh cấm loại này chưa
    const [existingBan] = await db.execute(
      'SELECT id FROM user_bans WHERE user_id = ? AND ban_type = ?',
      [id, ban_type]
    );

    if (existingBan.length > 0) {
      // Cập nhật lệnh cấm hiện có
      await db.execute(`
        UPDATE user_bans 
        SET ban_until = ?, reason = ?, banned_by = ?, is_active = TRUE, updated_at = NOW()
        WHERE user_id = ? AND ban_type = ?
      `, [banUntil, reason || null, adminId, id, ban_type]);
    } else {
      // Tạo lệnh cấm mới
      await db.execute(`
        INSERT INTO user_bans (user_id, ban_type, reason, banned_by, ban_until, is_active)
        VALUES (?, ?, ?, ?, ?, TRUE)
      `, [id, ban_type, reason || null, adminId, banUntil]);
    }

    // Nếu cấm tài khoản, cập nhật is_active trong bảng users
    if (ban_type === 'account') {
      await db.execute('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);
    }

    // Tạo thông báo cho user
    const banTypeName = getBanTypeName(ban_type);
    const durationName = getDurationName(duration);
    const banMessage = duration === 'permanent'
      ? `Bạn đã bị cấm ${banTypeName} vĩnh viễn.`
      : `Bạn đã bị cấm ${banTypeName} trong ${durationName}.`;

    await createNotification(
      id,
      'user_banned',
      `Bị cấm ${banTypeName}`,
      `${banMessage}${reason ? ` Lý do: ${reason}` : ''}`,
      null
    );

    res.json({ 
      message: `Đã cấm ${banTypeName} thành công`,
      ban_until: banUntil
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Gỡ cấm người dùng
router.post('/users/:id/unban', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { ban_type } = req.body;

    // Validate
    const validBanTypes = ['account', 'comment', 'post', 'document', 'report'];
    if (!validBanTypes.includes(ban_type)) {
      return res.status(400).json({ message: 'Loại cấm không hợp lệ' });
    }

    // Kiểm tra user tồn tại
    const [users] = await db.execute('SELECT id, full_name FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra lệnh cấm tồn tại
    const [existingBan] = await db.execute(
      'SELECT id FROM user_bans WHERE user_id = ? AND ban_type = ? AND is_active = TRUE',
      [id, ban_type]
    );

    if (existingBan.length === 0) {
      return res.status(400).json({ message: 'Người dùng không bị cấm loại này' });
    }

    // Gỡ cấm
    await db.execute(
      'UPDATE user_bans SET is_active = FALSE, updated_at = NOW() WHERE user_id = ? AND ban_type = ?',
      [id, ban_type]
    );

    // Nếu gỡ cấm tài khoản, cập nhật is_active trong bảng users
    if (ban_type === 'account') {
      await db.execute('UPDATE users SET is_active = TRUE WHERE id = ?', [id]);
    }

    // Tạo thông báo cho user
    const banTypeName = getBanTypeName(ban_type);
    await createNotification(
      id,
      'user_unbanned',
      `Gỡ cấm ${banTypeName}`,
      `Lệnh cấm ${banTypeName} của bạn đã được gỡ bỏ. Bạn có thể tiếp tục sử dụng tính năng này.`,
      null
    );

    res.json({ message: `Đã gỡ cấm ${banTypeName} thành công` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Kiểm tra trạng thái cấm của user (dùng cho middleware)
router.get('/users/:id/ban-status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [bans] = await db.execute(`
      SELECT ban_type, ban_until, reason
      FROM user_bans 
      WHERE user_id = ? AND is_active = TRUE
    `, [id]);

    // Lọc các lệnh cấm còn hiệu lực
    const activeBans = {};
    for (const ban of bans) {
      if (!ban.ban_until || new Date(ban.ban_until) > new Date()) {
        activeBans[ban.ban_type] = {
          ban_until: ban.ban_until,
          reason: ban.reason
        };
      }
    }

    res.json({ bans: activeBans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;