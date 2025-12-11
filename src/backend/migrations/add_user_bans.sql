-- Migration: Thêm bảng quản lý cấm người dùng
-- Chạy lệnh: mysql -u root -p dien_dan_tin_hoc < backend/migrations/add_user_bans.sql

-- Bảng quản lý các loại cấm của người dùng
CREATE TABLE IF NOT EXISTS user_bans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ban_type ENUM('account', 'comment', 'post', 'document', 'report') NOT NULL,
    reason TEXT,
    banned_by INT NOT NULL,
    ban_until TIMESTAMP NULL, -- NULL = vĩnh viễn
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_ban_type (user_id, ban_type)
);

-- Thêm index để tối ưu truy vấn
CREATE INDEX idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX idx_user_bans_ban_type ON user_bans(ban_type);
CREATE INDEX idx_user_bans_is_active ON user_bans(is_active);

-- Cập nhật bảng notifications để hỗ trợ thêm loại thông báo mới
ALTER TABLE notifications MODIFY COLUMN type ENUM(
    'comment', 
    'post_deleted', 
    'comment_deleted', 
    'document_deleted', 
    'report_warning',
    'penalty_reduced',
    'user_banned',
    'user_unbanned'
) NOT NULL;
