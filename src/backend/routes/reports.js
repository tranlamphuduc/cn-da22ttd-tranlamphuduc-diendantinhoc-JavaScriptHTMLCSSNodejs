const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { body, validationResult } = require('express-validator');

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dien_dan_tin_hoc'
};

// Middleware để kiểm tra authentication
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Lấy thông tin user từ database
        const connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute(
            'SELECT id, username, email, full_name, role FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.userId]
        );
        await connection.end();

        if (users.length === 0) {
            return res.status(403).json({ message: 'User not found or inactive' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// Middleware kiểm tra admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Tạo báo cáo mới
router.post('/', 
    authenticateToken,
    [
        body('report_type').isIn(['user', 'post', 'document']).withMessage('Loại báo cáo không hợp lệ'),
        body('reason').isIn(['spam', 'inappropriate', 'harassment', 'fake_info', 'copyright', 'other']).withMessage('Lý do không hợp lệ'),
        body('description').optional().isLength({ max: 1000 }).withMessage('Mô tả không được quá 1000 ký tự')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { report_type, reported_user_id, reported_post_id, reported_document_id, reason, description } = req.body;
            const reporter_id = req.user.id;

            // Kiểm tra logic báo cáo
            if (report_type === 'user' && !reported_user_id) {
                return res.status(400).json({ message: 'ID người dùng bị báo cáo là bắt buộc' });
            }
            if (report_type === 'post' && !reported_post_id) {
                return res.status(400).json({ message: 'ID bài viết bị báo cáo là bắt buộc' });
            }
            if (report_type === 'document' && !reported_document_id) {
                return res.status(400).json({ message: 'ID tài liệu bị báo cáo là bắt buộc' });
            }

            // Không cho phép tự báo cáo
            if (report_type === 'user' && reported_user_id === reporter_id) {
                return res.status(400).json({ message: 'Không thể tự báo cáo bản thân' });
            }

            const connection = await mysql.createConnection(dbConfig);

            // Kiểm tra xem đã báo cáo trước đó chưa
            let checkQuery = 'SELECT id FROM reports WHERE reporter_id = ? AND report_type = ? AND status IN ("pending", "reviewed")';
            let checkParams = [reporter_id, report_type];
            
            if (report_type === 'user' && reported_user_id) {
                checkQuery += ' AND reported_user_id = ?';
                checkParams.push(reported_user_id);
            } else if (report_type === 'post' && reported_post_id) {
                checkQuery += ' AND reported_post_id = ?';
                checkParams.push(reported_post_id);
            } else if (report_type === 'document' && reported_document_id) {
                checkQuery += ' AND reported_document_id = ?';
                checkParams.push(reported_document_id);
            }
            
            const [existingReports] = await connection.execute(checkQuery, checkParams);

            if (existingReports.length > 0) {
                await connection.end();
                return res.status(400).json({ message: 'Bạn đã báo cáo nội dung này trước đó' });
            }

            // Tạo báo cáo mới
            const [result] = await connection.execute(
                'INSERT INTO reports (reporter_id, reported_user_id, reported_post_id, reported_document_id, report_type, reason, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    reporter_id, 
                    reported_user_id || null, 
                    reported_post_id || null, 
                    reported_document_id || null, 
                    report_type, 
                    reason, 
                    description || null
                ]
            );

            await connection.end();

            res.status(201).json({
                message: 'Báo cáo đã được gửi thành công',
                report_id: result.insertId
            });

        } catch (error) {
            console.error('Error creating report:', error);
            res.status(500).json({ message: 'Lỗi server khi tạo báo cáo' });
        }
    }
);

// Lấy danh sách báo cáo (chỉ admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, report_type, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const connection = await mysql.createConnection(dbConfig);

        let whereClause = '1=1';
        let params = [];

        if (status) {
            whereClause += ' AND r.status = ?';
            params.push(status);
        }

        if (report_type) {
            whereClause += ' AND r.report_type = ?';
            params.push(report_type);
        }

        const query = `
            SELECT 
                r.*,
                reporter.username as reporter_username,
                reporter.full_name as reporter_name,
                reported_user.username as reported_username,
                reported_user.full_name as reported_user_name,
                p.title as post_title,
                d.title as document_title,
                reviewer.username as reviewer_username
            FROM reports r
            LEFT JOIN users reporter ON r.reporter_id = reporter.id
            LEFT JOIN users reported_user ON r.reported_user_id = reported_user.id
            LEFT JOIN posts p ON r.reported_post_id = p.id
            LEFT JOIN documents d ON r.reported_document_id = d.id
            LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
            WHERE ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        const [reports] = await connection.execute(query, params);

        // Đếm tổng số báo cáo
        const countQuery = `SELECT COUNT(*) as total FROM reports r WHERE ${whereClause}`;
        const [countResult] = await connection.execute(countQuery, params.slice(0, -2));

        await connection.end();

        res.json({
            reports,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(countResult[0].total / limit),
                total_reports: countResult[0].total,
                per_page: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách báo cáo' });
    }
});

// Cập nhật trạng thái báo cáo (chỉ admin)
router.put('/:id/status', 
    authenticateToken, 
    requireAdmin,
    [
        body('status').isIn(['reviewed', 'resolved', 'dismissed']).withMessage('Trạng thái không hợp lệ'),
        body('admin_note').optional().isLength({ max: 500 }).withMessage('Ghi chú không được quá 500 ký tự')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const { status, admin_note } = req.body;
            const reviewed_by = req.user.id;

            const connection = await mysql.createConnection(dbConfig);

            // Kiểm tra báo cáo tồn tại
            const [reports] = await connection.execute(
                'SELECT * FROM reports WHERE id = ?',
                [id]
            );

            if (reports.length === 0) {
                await connection.end();
                return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
            }

            // Cập nhật trạng thái
            await connection.execute(
                'UPDATE reports SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
                [status, admin_note || null, reviewed_by, id]
            );

            await connection.end();

            res.json({ message: 'Cập nhật trạng thái báo cáo thành công' });

        } catch (error) {
            console.error('Error updating report status:', error);
            res.status(500).json({ message: 'Lỗi server khi cập nhật báo cáo' });
        }
    }
);

// Lấy thống kê báo cáo (chỉ admin)
router.get('/statistics', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_reports,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
                SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed_reports,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_reports,
                SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed_reports,
                SUM(CASE WHEN report_type = 'user' THEN 1 ELSE 0 END) as user_reports,
                SUM(CASE WHEN report_type = 'post' THEN 1 ELSE 0 END) as post_reports,
                SUM(CASE WHEN report_type = 'document' THEN 1 ELSE 0 END) as document_reports
            FROM reports
        `);

        const [reasonStats] = await connection.execute(`
            SELECT reason, COUNT(*) as count
            FROM reports
            GROUP BY reason
            ORDER BY count DESC
        `);

        await connection.end();

        res.json({
            overview: stats[0],
            by_reason: reasonStats
        });

    } catch (error) {
        console.error('Error fetching report statistics:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê báo cáo' });
    }
});

module.exports = router;