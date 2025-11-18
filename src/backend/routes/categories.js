const express = require('express');
const db = require('../config/database');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách danh mục
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM posts WHERE category_id = c.id AND is_approved = TRUE) as post_count,
             (SELECT COUNT(*) FROM documents WHERE category_id = c.id AND is_approved = TRUE) as document_count
      FROM categories c
      ORDER BY c.name
    `);

    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Tạo danh mục mới (chỉ admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    }

    const [result] = await db.execute(
      'INSERT INTO categories (name, description, color) VALUES (?, ?, ?)',
      [name, description || null, color || '#007bff']
    );

    res.status(201).json({
      message: 'Tạo danh mục thành công',
      category_id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật danh mục (chỉ admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    }

    const [result] = await db.execute(
      'UPDATE categories SET name = ?, description = ?, color = ? WHERE id = ?',
      [name, description || null, color || '#007bff', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    res.json({ message: 'Cập nhật danh mục thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa danh mục (chỉ admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem có bài viết nào trong danh mục này không
    const [posts] = await db.execute('SELECT COUNT(*) as count FROM posts WHERE category_id = ?', [id]);
    
    if (posts[0].count > 0) {
      return res.status(400).json({ 
        message: 'Không thể xóa danh mục này vì còn có bài viết' 
      });
    }

    const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;