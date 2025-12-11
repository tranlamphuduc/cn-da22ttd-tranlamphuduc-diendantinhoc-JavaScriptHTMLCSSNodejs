-- Migration: Thêm cột theme_settings vào bảng users
-- Lưu cài đặt giao diện của người dùng dưới dạng JSON

ALTER TABLE users ADD COLUMN theme_settings JSON DEFAULT NULL;

-- Ví dụ cấu trúc JSON:
-- {
--   "backgroundColor": "#f8f9fa",
--   "backgroundImage": "https://example.com/bg.jpg",
--   "backgroundSize": "cover",
--   "backgroundPosition": "center",
--   "backgroundAttachment": "fixed",
--   "primaryColor": "#007bff",
--   "textColor": "#333333",
--   "cardBackground": "#ffffff",
--   "cardOpacity": 1,
--   "fontFamily": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
--   "fontSize": "16px",
--   "borderRadius": "8px",
--   "navbarBackground": "#ffffff",
--   "navbarTextColor": "#333333"
-- }
