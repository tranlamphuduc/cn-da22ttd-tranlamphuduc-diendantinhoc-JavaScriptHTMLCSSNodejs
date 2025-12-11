-- Migration: Thêm hệ thống Tags/Hashtags cho bài viết
-- Giúp dễ dàng tìm kiếm theo chủ đề cụ thể

-- Bảng tags
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng liên kết posts và tags (many-to-many)
CREATE TABLE IF NOT EXISTS post_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_tag (post_id, tag_id)
);

-- Thêm một số tags mẫu phổ biến cho diễn đàn tin học
INSERT INTO tags (name, slug, usage_count) VALUES
('javascript', 'javascript', 0),
('python', 'python', 0),
('java', 'java', 0),
('csharp', 'csharp', 0),
('php', 'php', 0),
('nodejs', 'nodejs', 0),
('reactjs', 'reactjs', 0),
('vuejs', 'vuejs', 0),
('angular', 'angular', 0),
('html', 'html', 0),
('css', 'css', 0),
('mysql', 'mysql', 0),
('mongodb', 'mongodb', 0),
('postgresql', 'postgresql', 0),
('docker', 'docker', 0),
('git', 'git', 0),
('linux', 'linux', 0),
('windows', 'windows', 0),
('android', 'android', 0),
('ios', 'ios', 0),
('flutter', 'flutter', 0),
('machine-learning', 'machine-learning', 0),
('deep-learning', 'deep-learning', 0),
('api', 'api', 0),
('rest-api', 'rest-api', 0),
('security', 'security', 0),
('tutorial', 'tutorial', 0),
('tips', 'tips', 0),
('bug', 'bug', 0),
('help', 'help', 0);

-- Index để tìm kiếm nhanh
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_post_tags_post ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);
