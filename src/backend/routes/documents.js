const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkBan } = require('../middleware/auth');

const router = express.Router();

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Loại file không được hỗ trợ'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Lấy danh sách tài liệu
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'newest'; // newest, oldest, most_downloaded, least_downloaded
    const offset = (page - 1) * limit;

    let query = `
      SELECT d.*, u.username, u.full_name, c.name as category_name, c.color as category_color
      FROM documents d
      JOIN users u ON d.user_id = u.id
      JOIN categories c ON d.category_id = c.id
      WHERE d.is_approved = TRUE
    `;
    
    const params = [];

    if (category) {
      query += ' AND d.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (d.title LIKE ? OR d.description LIKE ? OR u.full_name LIKE ? OR u.username LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Thêm sắp xếp theo lựa chọn
    let orderBy = 'd.created_at DESC'; // mặc định
    switch (sortBy) {
      case 'oldest':
        orderBy = 'd.created_at ASC';
        break;
      case 'most_downloaded':
        orderBy = 'd.downloads DESC';
        break;
      case 'least_downloaded':
        orderBy = 'd.downloads ASC';
        break;
      default:
        orderBy = 'd.created_at DESC';
    }

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [documents] = await db.execute(query, params);

    // Đếm tổng số tài liệu
    let countQuery = 'SELECT COUNT(*) as count FROM documents d WHERE d.is_approved = TRUE';
    const countParams = [];

    if (category) {
      countQuery += ' AND d.category_id = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (d.title LIKE ? OR d.description LIKE ? OR EXISTS (SELECT 1 FROM users u WHERE u.id = d.user_id AND (u.full_name LIKE ? OR u.username LIKE ?)))';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [totalCount] = await db.execute(countQuery, countParams);

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

// Upload tài liệu
router.post('/upload', auth, checkBan('document'), upload.single('file'), [
  body('title').notEmpty().withMessage('Tiêu đề không được để trống'),
  body('category_id').isInt().withMessage('Danh mục không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file để upload' });
    }

    const { title, description, category_id } = req.body;
    const user_id = req.user.id;
    const file = req.file;

    const [result] = await db.execute(`
      INSERT INTO documents (title, description, file_name, file_path, file_size, file_type, user_id, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      description || null,
      file.originalname,
      file.path,
      file.size,
      file.mimetype,
      user_id,
      category_id
    ]);

    res.status(201).json({
      message: 'Upload tài liệu thành công',
      document_id: result.insertId
    });
  } catch (error) {
    console.error(error);
    // Xóa file nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy chi tiết tài liệu
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [documents] = await db.execute(`
      SELECT d.*, u.username, u.full_name, u.avatar, c.name as category_name, c.color as category_color
      FROM documents d
      JOIN users u ON d.user_id = u.id
      JOIN categories c ON d.category_id = c.id
      WHERE d.id = ? AND d.is_approved = TRUE
    `, [id]);

    if (documents.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    res.json({ document: documents[0] });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Download tài liệu (public endpoint)
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Download request for document ID:', id);

    const [documents] = await db.execute(
      'SELECT * FROM documents WHERE id = ? AND is_approved = TRUE',
      [id]
    );

    if (documents.length === 0) {
      console.log('Document not found:', id);
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const document = documents[0];
    console.log('Document found:', { 
      id: document.id, 
      filename: document.file_name, 
      path: document.file_path,
      exists: fs.existsSync(document.file_path)
    });

    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(document.file_path)) {
      console.error('File not found at path:', document.file_path);
      return res.status(404).json({ message: 'File không tồn tại' });
    }

    // Tăng số lượt download
    await db.execute('UPDATE documents SET downloads = downloads + 1 WHERE id = ?', [id]);

    console.log('Starting file download:', document.file_name);

    // Set headers để force download với tên file đúng
    const filename = document.file_name;
    const encodedFilename = encodeURIComponent(filename);
    
    // Set Content-Disposition header với cả ASCII và UTF-8 encoding
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', document.file_type || 'application/octet-stream');
    res.setHeader('Content-Length', fs.statSync(document.file_path).size);
    
    console.log('Download headers set:', {
      filename: filename,
      contentType: document.file_type,
      contentLength: fs.statSync(document.file_path).size
    });
    
    // Tạo read stream và pipe to response
    const fileStream = fs.createReadStream(document.file_path);
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Lỗi khi đọc file' });
      }
    });

    fileStream.on('end', () => {
      console.log('File download completed:', document.file_name);
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
});

// Xóa tài liệu
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Kiểm tra quyền sở hữu
    const [documents] = await db.execute('SELECT * FROM documents WHERE id = ?', [id]);
    if (documents.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const document = documents[0];

    if (document.user_id !== user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xóa tài liệu này' });
    }

    // Xóa file khỏi hệ thống
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Xóa record khỏi database
    await db.execute('DELETE FROM documents WHERE id = ?', [id]);

    res.json({ message: 'Xóa tài liệu thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;