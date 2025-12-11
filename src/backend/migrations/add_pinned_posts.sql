-- Migration: Thêm cột is_pinned vào bảng posts
-- Cho phép Admin ghim bài viết lên đầu trang chủ

ALTER TABLE posts ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN pinned_at TIMESTAMP NULL;
