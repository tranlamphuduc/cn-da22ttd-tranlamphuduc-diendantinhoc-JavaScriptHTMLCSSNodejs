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

            // Kiểm tra xem người dùng có bị cấm báo cáo từ bảng user_bans không
            const [userBanCheck] = await connection.execute(
                'SELECT * FROM user_bans WHERE user_id = ? AND ban_type = "report" AND is_active = TRUE AND (ban_until IS NULL OR ban_until > NOW())',
                [reporter_id]
            );

            if (userBanCheck.length > 0) {
                const ban = userBanCheck[0];
                const banMessage = ban.ban_until 
                    ? `Bạn đã bị cấm báo cáo đến ${new Date(ban.ban_until).toLocaleString('vi-VN')}.${ban.reason ? ` Lý do: ${ban.reason}` : ''}`
                    : `Bạn đã bị cấm báo cáo vĩnh viễn.${ban.reason ? ` Lý do: ${ban.reason}` : ''}`;
                
                await connection.end();
                return res.status(403).json({ 
                    message: banMessage,
                    banned: true,
                    ban_until: ban.ban_until
                });
            }

            // Kiểm tra xem người dùng có bị cấm báo cáo từ report_warnings không (legacy)
            const [warningCheck] = await connection.execute(
                'SELECT * FROM report_warnings WHERE user_id = ? AND (is_banned_from_reporting = TRUE AND (ban_until IS NULL OR ban_until > NOW()))',
                [reporter_id]
            );

            if (warningCheck.length > 0) {
                const banUntil = warningCheck[0].ban_until;
                const banMessage = banUntil 
                    ? `Bạn đã bị cấm báo cáo đến ${new Date(banUntil).toLocaleString('vi-VN')} do báo cáo sai nhiều lần`
                    : 'Bạn đã bị cấm báo cáo vĩnh viễn do báo cáo sai 5 lần trong vòng 3 tháng';
                
                await connection.end();
                return res.status(403).json({ 
                    message: banMessage,
                    banned: true,
                    ban_until: banUntil
                });
            }

            // Kiểm tra số lượng báo cáo đang chờ xử lý (tối đa 3)
            const [pendingReports] = await connection.execute(
                'SELECT COUNT(*) as count FROM reports WHERE reporter_id = ? AND status IN ("pending", "reviewed")',
                [reporter_id]
            );

            if (pendingReports[0].count >= 3) {
                await connection.end();
                return res.status(400).json({ 
                    message: 'Bạn đã có 3 báo cáo đang chờ xử lý. Vui lòng đợi quản trị viên xử lý xong trước khi gửi báo cáo mới.',
                    pending_count: pendingReports[0].count
                });
            }

            // Kiểm tra xem đã báo cáo nội dung này trước đó chưa
            let checkQuery = 'SELECT id FROM reports WHERE reporter_id = ? AND report_type = ?';
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
                report_id: result.insertId,
                pending_count: pendingReports[0].count + 1
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
        body('status').isIn(['pending', 'reviewed', 'resolved', 'dismissed']).withMessage('Trạng thái không hợp lệ'),
        body('admin_note').optional().isLength({ max: 500 }).withMessage('Ghi chú không được quá 500 ký tự'),
        body('is_false_report').optional().isBoolean().withMessage('is_false_report phải là boolean')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const { status, admin_note, is_false_report = false } = req.body;
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

            const report = reports[0];

            // Cập nhật trạng thái báo cáo
            await connection.execute(
                'UPDATE reports SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW(), is_false_report = ? WHERE id = ?',
                [status, admin_note || null, reviewed_by, is_false_report, id]
            );

            // Nếu báo cáo bị đánh dấu là sai, xử lý cảnh báo cho người báo cáo
            // Chỉ xử lý nếu trước đó chưa được đánh dấu là báo cáo sai
            if (is_false_report && !report.is_false_report) {
                await handleFalseReportWarning(connection, report.reporter_id);
            }

            await connection.end();

            res.json({ message: 'Cập nhật trạng thái báo cáo thành công' });

        } catch (error) {
            console.error('Error updating report status:', error);
            res.status(500).json({ message: 'Lỗi server khi cập nhật báo cáo' });
        }
    }
);

// Hàm xử lý cảnh báo báo cáo sai
async function handleFalseReportWarning(connection, userId) {
    try {
        // Kiểm tra xem user đã có record cảnh báo chưa
        const [existingWarning] = await connection.execute(
            'SELECT * FROM report_warnings WHERE user_id = ?',
            [userId]
        );

        if (existingWarning.length === 0) {
            // Tạo record cảnh báo mới
            await connection.execute(
                'INSERT INTO report_warnings (user_id, warning_count, last_warning_at) VALUES (?, 1, NOW())',
                [userId]
            );
        } else {
            const currentWarnings = existingWarning[0].warning_count;
            const newWarningCount = currentWarnings + 1;
            
            // Cập nhật số lần cảnh báo
            await connection.execute(
                'UPDATE report_warnings SET warning_count = ?, last_warning_at = NOW() WHERE user_id = ?',
                [newWarningCount, userId]
            );
        }

        // Kiểm tra số lần báo cáo sai trong khoảng thời gian
        const [recentWarnings1Month] = await connection.execute(
            'SELECT COUNT(*) as count FROM reports WHERE reporter_id = ? AND is_false_report = TRUE AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)',
            [userId]
        );

        const [recentWarnings3Months] = await connection.execute(
            'SELECT COUNT(*) as count FROM reports WHERE reporter_id = ? AND is_false_report = TRUE AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)',
            [userId]
        );

        const warnings1Month = recentWarnings1Month[0].count;
        const warnings3Months = recentWarnings3Months[0].count;

        let shouldBan = false;
        let banDuration = null;
        let banMessage = '';

        // Kiểm tra điều kiện cấm báo cáo
        if (warnings3Months >= 5) {
            // Cấm báo cáo vĩnh viễn nếu có 5 lần báo cáo sai trong 3 tháng
            shouldBan = true;
            banDuration = null; // Vĩnh viễn
            banMessage = 'Bạn đã bị cấm báo cáo vĩnh viễn do báo cáo sai 5 lần trong vòng 3 tháng. Vui lòng liên hệ quản trị viên nếu có thắc mắc.';
        } else if (warnings1Month >= 3) {
            // Cấm báo cáo 30 ngày nếu có 3 lần báo cáo sai trong 1 tháng
            shouldBan = true;
            banDuration = 'DATE_ADD(NOW(), INTERVAL 30 DAY)';
            banMessage = `Bạn đã bị cấm báo cáo trong 30 ngày do báo cáo sai ${warnings1Month} lần trong vòng 1 tháng.`;
        }

        // Cập nhật trạng thái cấm nếu cần
        if (shouldBan) {
            if (banDuration) {
                await connection.execute(
                    `UPDATE report_warnings SET is_banned_from_reporting = TRUE, ban_until = ${banDuration} WHERE user_id = ?`,
                    [userId]
                );
            } else {
                await connection.execute(
                    'UPDATE report_warnings SET is_banned_from_reporting = TRUE, ban_until = NULL WHERE user_id = ?',
                    [userId]
                );
            }
        }

        // Tạo thông báo cho người dùng về cảnh báo
        const { createNotification } = require('./notifications');
        const [warningInfo] = await connection.execute(
            'SELECT * FROM report_warnings WHERE user_id = ?',
            [userId]
        );

        if (warningInfo.length > 0) {
            const warning = warningInfo[0];
            let notificationMessage = '';
            
            if (shouldBan) {
                notificationMessage = banMessage;
            } else {
                notificationMessage = `Bạn đã nhận cảnh báo lần ${warning.warning_count} do gửi báo cáo không chính xác. Hiện tại bạn có ${warnings1Month} báo cáo sai trong 1 tháng và ${warnings3Months} báo cáo sai trong 3 tháng. Nếu tiếp tục báo cáo sai, bạn sẽ bị cấm báo cáo.`;
            }

            await createNotification(
                userId,
                'report_warning',
                'Cảnh báo báo cáo sai',
                notificationMessage,
                null
            );
        }

    } catch (error) {
        console.error('Error handling false report warning:', error);
    }
}

// Lấy báo cáo của người dùng hiện tại
router.get('/my-reports', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const connection = await mysql.createConnection(dbConfig);

        // Lấy danh sách báo cáo của user
        const [reports] = await connection.execute(
            `SELECT r.*, 
                    CASE 
                        WHEN r.report_type = 'user' THEN u.full_name
                        WHEN r.report_type = 'post' THEN p.title
                        WHEN r.report_type = 'document' THEN d.title
                    END as reported_content_name
             FROM reports r
             LEFT JOIN users u ON r.reported_user_id = u.id
             LEFT JOIN posts p ON r.reported_post_id = p.id
             LEFT JOIN documents d ON r.reported_document_id = d.id
             WHERE r.reporter_id = ?
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), parseInt(offset)]
        );

        // Đếm tổng số báo cáo
        const [countResult] = await connection.execute(
            'SELECT COUNT(*) as total FROM reports WHERE reporter_id = ?',
            [userId]
        );

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
        console.error('Error fetching user reports:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy báo cáo' });
    }
});

// Kiểm tra trạng thái báo cáo của người dùng
router.get('/my-status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = await mysql.createConnection(dbConfig);

        // Lấy thông tin cảnh báo
        const [warnings] = await connection.execute(
            'SELECT * FROM report_warnings WHERE user_id = ?',
            [userId]
        );

        // Đếm số báo cáo đang chờ xử lý
        const [pendingReports] = await connection.execute(
            'SELECT COUNT(*) as count FROM reports WHERE reporter_id = ? AND status IN ("pending", "reviewed")',
            [userId]
        );

        // Lấy lịch sử báo cáo gần đây
        const [recentReports] = await connection.execute(
            `SELECT r.*, 
                    CASE 
                        WHEN r.report_type = 'user' THEN u.full_name
                        WHEN r.report_type = 'post' THEN p.title
                        WHEN r.report_type = 'document' THEN d.title
                    END as reported_content_name
             FROM reports r
             LEFT JOIN users u ON r.reported_user_id = u.id
             LEFT JOIN posts p ON r.reported_post_id = p.id
             LEFT JOIN documents d ON r.reported_document_id = d.id
             WHERE r.reporter_id = ?
             ORDER BY r.created_at DESC
             LIMIT 10`,
            [userId]
        );

        await connection.end();

        const warningInfo = warnings.length > 0 ? warnings[0] : null;
        const isBanned = warningInfo && warningInfo.is_banned_from_reporting && 
                        (warningInfo.ban_until === null || new Date(warningInfo.ban_until) > new Date());

        res.json({
            warning_count: warningInfo ? warningInfo.warning_count : 0,
            is_banned: isBanned,
            ban_until: warningInfo ? warningInfo.ban_until : null,
            pending_reports_count: pendingReports[0].count,
            can_report: !isBanned && pendingReports[0].count < 3,
            recent_reports: recentReports
        });

    } catch (error) {
        console.error('Error fetching user report status:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy trạng thái báo cáo' });
    }
});

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