CREATE DATABASE IF NOT EXISTS dien_dan_tin_hoc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dien_dan_tin_hoc;

-- Bảng người dùng
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng danh mục
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng bài viết
CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    views INT DEFAULT 0,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Bảng bình luận
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Bảng tài liệu
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    downloads INT DEFAULT 0,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Bảng báo cáo
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reporter_id INT NOT NULL,
    reported_user_id INT DEFAULT NULL,
    reported_post_id INT DEFAULT NULL,
    reported_document_id INT DEFAULT NULL,
    report_type ENUM('user', 'post', 'document') NOT NULL,
    reason ENUM('spam', 'inappropriate', 'harassment', 'fake_info', 'copyright', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_note TEXT DEFAULT NULL,
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Bảng thống kê
CREATE TABLE statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    total_users INT DEFAULT 0,
    total_posts INT DEFAULT 0,
    total_comments INT DEFAULT 0,
    total_documents INT DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm dữ liệu mẫu
INSERT INTO categories (name, description, color) VALUES
('Lập trình Web', 'Thảo luận về HTML, CSS, JavaScript, React, Node.js', '#e74c3c'),
('Cơ sở dữ liệu', 'MySQL, MongoDB, PostgreSQL và các hệ quản trị CSDL', '#3498db'),
('Thuật toán', 'Cấu trúc dữ liệu và giải thuật', '#9b59b6'),
('Lập trình di động', 'Android, iOS, React Native, Flutter', '#2ecc71'),
('Trí tuệ nhân tạo', 'Machine Learning, Deep Learning, AI', '#f39c12'),
('Bảo mật', 'An toàn thông tin, mã hóa, penetration testing', '#e67e22'),
('DevOps', 'Docker, Kubernetes, CI/CD, Cloud Computing', '#34495e'),
('Game Development', 'Unity, Unreal Engine, phát triển game', '#8e44ad');

-- Thêm tài khoản admin và user mẫu (password: "password")
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@diendan.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quản trị viên', 'admin'),
('tranlamphuduc', 'nguyenvana@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần Lâm Phú Đức', 'user'),
('nguyenthanhduy', 'tranthib@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nguyễn Thanh Duy', 'user'),
('nguyendinhtuankhoa', 'lequangc@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nguyễn Đinh Tuấn Khoa', 'user');

-- Thêm bài viết mẫu
INSERT INTO posts (title, content, user_id, category_id, views) VALUES
('Hướng dẫn học React.js cho người mới bắt đầu', 
'# Giới thiệu về React.js\n\nReact.js là một thư viện JavaScript phổ biến để xây dựng giao diện người dùng.\n\n## Cài đặt\n\n```bash\nnpx create-react-app my-app\ncd my-app\nnpm start\n```\n\n## Component đầu tiên\n\n```jsx\nfunction Welcome(props) {\n  return <h1>Hello, {props.name}!</h1>;\n}\n```\n\nReact sử dụng JSX để viết component một cách dễ dàng và trực quan.', 
2, 1, 156),

('Cấu trúc dữ liệu Stack và Queue', 
'# Stack và Queue\n\n## Stack (Ngăn xếp)\n\nStack là cấu trúc dữ liệu hoạt động theo nguyên tắc LIFO (Last In First Out).\n\n### Các thao tác cơ bản:\n- **Push**: Thêm phần tử vào đỉnh stack\n- **Pop**: Lấy phần tử từ đỉnh stack\n- **Top/Peek**: Xem phần tử ở đỉnh stack\n\n```python\nclass Stack:\n    def __init__(self):\n        self.items = []\n    \n    def push(self, item):\n        self.items.append(item)\n    \n    def pop(self):\n        return self.items.pop()\n```\n\n## Queue (Hàng đợi)\n\nQueue hoạt động theo nguyên tắc FIFO (First In First Out).', 
3, 3, 89),

('Tối ưu hóa truy vấn MySQL', 
'# Tối ưu hóa MySQL\n\n## 1. Sử dụng Index\n\nIndex giúp tăng tốc độ truy vấn đáng kể:\n\n```sql\nCREATE INDEX idx_user_email ON users(email);\nCREATE INDEX idx_post_category ON posts(category_id, created_at);\n```\n\n## 2. Tối ưu câu truy vấn\n\n### Tránh SELECT *\n```sql\n-- Không tốt\nSELECT * FROM users WHERE email = "user@example.com";\n\n-- Tốt hơn\nSELECT id, username, full_name FROM users WHERE email = "user@example.com";\n```\n\n## 3. Sử dụng EXPLAIN\n\n```sql\nEXPLAIN SELECT * FROM posts WHERE category_id = 1;\n```', 
4, 2, 234),

('Bảo mật ứng dụng web cơ bản', 
'# Bảo mật Web Application\n\n## 1. SQL Injection\n\nLuôn sử dụng prepared statements:\n\n```php\n// Không an toàn\n$query = "SELECT * FROM users WHERE id = " . $_GET["id"];\n\n// An toàn\n$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");\n$stmt->execute([$_GET["id"]]);\n```\n\n## 2. XSS (Cross-Site Scripting)\n\nEscape output data:\n\n```php\necho htmlspecialchars($user_input, ENT_QUOTES, "UTF-8");\n```\n\n## 3. CSRF Protection\n\nSử dụng CSRF tokens trong forms.', 
2, 6, 178);

-- Thêm bình luận mẫu
INSERT INTO comments (content, user_id, post_id) VALUES
('Bài viết rất hữu ích! Cảm ơn bạn đã chia sẻ.', 3, 1),
('Mình đã thử làm theo và thành công. Thanks!', 4, 1),
('Có thể giải thích thêm về lifecycle methods không?', 2, 1),
('Stack và Queue là nền tảng quan trọng của lập trình. Bài viết hay!', 2, 2),
('Code example rất dễ hiểu, upvote!', 4, 2),
('Index thực sự giúp tăng performance rất nhiều.', 3, 3),
('Bảo mật là vấn đề quan trọng mà nhiều dev bỏ qua.', 4, 4);

-- Thêm dữ liệu mẫu cho tài liệu
INSERT INTO documents (title, description, file_name, file_path, file_size, file_type, user_id, category_id, downloads) VALUES
('Hướng dẫn React.js cơ bản', 'Tài liệu hướng dẫn React.js từ cơ bản đến nâng cao', 'react-guide.pdf', 'documents/react-guide.pdf', 2048576, 'application/pdf', 2, 1, 45),
('Cấu trúc dữ liệu và giải thuật', 'Bài giảng về cấu trúc dữ liệu và giải thuật', 'data-structures.pptx', 'documents/data-structures.pptx', 5242880, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 3, 3, 78),
('Hướng dẫn MySQL', 'Tài liệu hướng dẫn sử dụng MySQL', 'mysql-tutorial.docx', 'documents/mysql-tutorial.docx', 1048576, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 4, 2, 32),
('Bảo mật ứng dụng web', 'Tài liệu về bảo mật ứng dụng web', 'web-security.pdf', 'documents/web-security.pdf', 3145728, 'application/pdf', 2, 6, 67);

-- Thêm dữ liệu mẫu cho báo cáo
INSERT INTO reports (reporter_id, reported_user_id, reported_post_id, reported_document_id, report_type, reason, description, status) VALUES
(2, 3, NULL, NULL, 'user', 'spam', 'Người dùng này liên tục gửi tin nhắn spam', 'pending'),
(3, NULL, 1, NULL, 'post', 'inappropriate', 'Nội dung bài viết không phù hợp với diễn đàn', 'reviewed'),
(4, 2, NULL, NULL, 'user', 'harassment', 'Người dùng này có hành vi quấy rối', 'resolved'),
(2, NULL, 3, NULL, 'post', 'fake_info', 'Bài viết chứa thông tin sai lệch về công nghệ', 'dismissed'),
(3, NULL, NULL, 1, 'document', 'copyright', 'Tài liệu này vi phạm bản quyền', 'pending'),
(4, NULL, NULL, 2, 'document', 'inappropriate', 'Nội dung tài liệu không phù hợp', 'reviewed');

-- Cập nhật thống kê
INSERT INTO statistics (total_users, total_posts, total_comments, total_documents, date) VALUES
(4, 4, 7, 0, CURDATE());