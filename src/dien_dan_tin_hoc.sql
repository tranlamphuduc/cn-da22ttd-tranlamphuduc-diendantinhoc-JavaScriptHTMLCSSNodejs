-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th12 14, 2025 lúc 07:09 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `dien_dan_tin_hoc`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `bookmarks`
--

CREATE TABLE `bookmarks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#007bff',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `color`, `created_at`) VALUES
(1, 'Lập trình Web', 'Thảo luận về HTML, CSS, JavaScript, React, Node.js', '#e74c3c', '2025-11-19 11:40:31'),
(2, 'Cơ sở dữ liệu', 'MySQL, MongoDB, PostgreSQL và các hệ quản trị CSDL', '#3498db', '2025-11-19 11:40:31'),
(3, 'Thuật toán', 'Cấu trúc dữ liệu và giải thuật', '#9b59b6', '2025-11-19 11:40:31'),
(4, 'Lập trình di động', 'Android, iOS, React Native, Flutter', '#2ecc71', '2025-11-19 11:40:31'),
(5, 'Trí tuệ nhân tạo', 'Machine Learning, Deep Learning, AI', '#f39c12', '2025-11-19 11:40:31'),
(6, 'Bảo mật', 'An toàn thông tin, mã hóa, penetration testing', '#e67e22', '2025-11-19 11:40:31'),
(7, 'DevOps', 'Docker, Kubernetes, CI/CD, Cloud Computing', '#34495e', '2025-11-19 11:40:31'),
(8, 'Game Development', 'Unity, Unreal Engine, phát triển game', '#8e44ad', '2025-11-19 11:40:31');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `category_follows`
--

CREATE TABLE `category_follows` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `user_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `comments`
--

INSERT INTO `comments` (`id`, `content`, `user_id`, `post_id`, `parent_id`, `is_approved`, `created_at`) VALUES
(1, 'Bài viết rất hữu ích! Cảm ơn bạn đã chia sẻ.', 3, 1, NULL, 1, '2025-11-19 11:40:31'),
(2, 'Mình đã thử làm theo và thành công. Thanks!', 4, 1, NULL, 1, '2025-11-19 11:40:31'),
(3, 'Có thể giải thích thêm về lifecycle methods không?', 2, 1, NULL, 1, '2025-11-19 11:40:31'),
(4, 'Stack và Queue là nền tảng quan trọng của lập trình. Bài viết hay!', 2, 2, NULL, 1, '2025-11-19 11:40:31'),
(5, 'Code example rất dễ hiểu, upvote!', 4, 2, NULL, 1, '2025-11-19 11:40:31'),
(6, 'Index thực sự giúp tăng performance rất nhiều.', 3, 3, NULL, 1, '2025-11-19 11:40:31'),
(7, 'Bảo mật là vấn đề quan trọng mà nhiều dev bỏ qua.', 4, 4, NULL, 1, '2025-11-19 11:40:31'),
(8, 'alo\n', 3, 1, NULL, 1, '2025-11-19 15:25:31'),
(9, '@nguyenthanhduy dasd', 2, 1, 1, 1, '2025-11-19 15:57:15'),
(10, '@nguyenthanhduy dasd', 2, 1, 1, 1, '2025-11-19 15:57:25'),
(11, 'asdasd', 3, 1, 1, 1, '2025-11-19 15:57:59'),
(13, 'asd', 1, 10, NULL, 1, '2025-12-07 11:32:03'),
(14, '@admin asd', 1, 10, 13, 1, '2025-12-07 11:35:05'),
(15, '@admin asd', 1, 10, 13, 1, '2025-12-07 11:35:13'),
(16, '@admin asd', 1, 10, 13, 1, '2025-12-07 11:35:16');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `downloads` int(11) DEFAULT 0,
  `is_approved` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `documents`
--

INSERT INTO `documents` (`id`, `title`, `description`, `file_name`, `file_path`, `file_size`, `file_type`, `user_id`, `category_id`, `downloads`, `is_approved`, `created_at`) VALUES
(1, 'Hướng dẫn React.js cơ bản', 'Tài liệu hướng dẫn React.js từ cơ bản đến nâng cao', 'react-guide.pdf', 'documents/react-guide.pdf', 2048576, 'application/pdf', 2, 1, 45, 1, '2025-11-19 11:40:31'),
(2, 'Cấu trúc dữ liệu và giải thuật', 'Bài giảng về cấu trúc dữ liệu và giải thuật', 'data-structures.pptx', 'documents/data-structures.pptx', 5242880, 'application/vnd.openxmlformats-officedocument.pres', 3, 3, 78, 1, '2025-11-19 11:40:31'),
(3, 'Hướng dẫn MySQL', 'Tài liệu hướng dẫn sử dụng MySQL', 'mysql-tutorial.docx', 'documents/mysql-tutorial.docx', 1048576, 'application/vnd.openxmlformats-officedocument.word', 4, 2, 32, 1, '2025-11-19 11:40:31'),
(4, 'Bảo mật ứng dụng web', 'Tài liệu về bảo mật ứng dụng web', 'web-security.pdf', 'documents/web-security.pdf', 3145728, 'application/pdf', 2, 6, 67, 1, '2025-11-19 11:40:31'),
(6, 'adsad', NULL, 'SOAP.docx', 'C:\\xampp\\htdocs\\cn\\backend\\uploads\\documents\\1764230449087-533913647.docx', 81995, 'application/vnd.openxmlformats-officedocument.word', 1, 1, 3, 1, '2025-11-27 08:00:49'),
(7, 'Coursera QBS90B2AZYUL', NULL, 'Coursera QBS90B2AZYUL.pdf', 'C:\\xampp\\htdocs\\cn\\backend\\uploads\\documents\\1764230525171-798896838.pdf', 299421, 'application/pdf', 1, 6, 3, 1, '2025-11-27 08:02:05');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('comment','post_deleted','comment_deleted','document_deleted','report_warning','penalty_reduced','user_banned','user_unbanned') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `related_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `related_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`, `related_url`) VALUES
(11, 4, 'user_banned', 'Bị cấm bình luận', 'Bạn đã bị cấm bình luận trong 1 ngày.', NULL, 0, '2025-12-07 07:17:59', NULL),
(12, 4, 'user_unbanned', 'Gỡ cấm bình luận', 'Lệnh cấm bình luận của bạn đã được gỡ bỏ. Bạn có thể tiếp tục sử dụng tính năng này.', NULL, 0, '2025-12-07 07:18:04', NULL),
(13, 1, '', 'Có người theo dõi mới', 'Trần Lâm Phú Đức đã bắt đầu theo dõi bạn', 2, 1, '2025-12-07 08:50:49', '/profile/2'),
(14, 1, '', 'Có người theo dõi mới', 'Trần Lâm Phú Đức đã bắt đầu theo dõi bạn', 2, 1, '2025-12-07 09:05:36', '/profile/2'),
(15, 3, 'user_banned', 'Bị cấm đăng bài viết', 'Bạn đã bị cấm đăng bài viết trong 1 ngày. Lý do: spam', NULL, 1, '2025-12-07 09:57:01', NULL),
(16, 3, 'user_unbanned', 'Gỡ cấm đăng bài viết', 'Lệnh cấm đăng bài viết của bạn đã được gỡ bỏ. Bạn có thể tiếp tục sử dụng tính năng này.', NULL, 1, '2025-12-07 09:58:15', NULL),
(17, 2, 'comment', 'Có bình luận mới', 'Nguyễn Thanh Duy đã bình luận về bài viết \"asd\" của bạn', 11, 1, '2025-12-07 11:13:02', NULL),
(18, 2, 'comment', 'Có bình luận mới', 'Quản trị viên đã bình luận về bài viết \"asd\" của bạn', 10, 1, '2025-12-07 11:32:03', NULL),
(19, 2, 'comment', 'Có bình luận mới', 'Quản trị viên đã bình luận về bài viết \"asd\" của bạn', 10, 1, '2025-12-07 11:35:05', NULL),
(20, 2, 'comment', 'Có bình luận mới', 'Quản trị viên đã bình luận về bài viết \"asd\" của bạn', 10, 1, '2025-12-07 11:35:13', NULL),
(21, 2, 'comment', 'Có bình luận mới', 'Quản trị viên đã bình luận về bài viết \"asd\" của bạn', 10, 1, '2025-12-07 11:35:16', NULL),
(22, 2, 'penalty_reduced', 'Giảm hình phạt', 'Quản trị viên đã giảm 1 lần cảnh báo báo cáo sai cho bạn do hoạt động tích cực.', NULL, 1, '2025-12-07 12:05:25', NULL),
(23, 3, 'penalty_reduced', 'Giảm hình phạt', 'Quản trị viên đã giảm 1 lần cảnh báo báo cáo sai cho bạn do hoạt động tích cực.', NULL, 1, '2025-12-07 12:06:20', NULL),
(24, 1, 'post_deleted', 'Bài viết bị xóa', 'Bài viết \"asd\" của bạn đã bị xóa bởi quản trị viên. Lý do: Test', 7, 1, '2025-12-07 12:11:06', NULL),
(25, 3, 'document_deleted', 'Tài liệu bị xóa', 'Tài liệu \"dasd\" của bạn đã bị xóa bởi quản trị viên. Lý do: Test', 5, 1, '2025-12-07 12:11:17', NULL),
(26, 3, 'comment_deleted', 'Bình luận bị xóa', 'Bình luận \"test\" của bạn trong bài viết \"asd\" đã bị xóa bởi quản trị viên. Lý do: Test', 12, 1, '2025-12-07 12:11:28', NULL),
(27, 3, 'penalty_reduced', 'Xóa toàn bộ hình phạt', 'Quản trị viên đã xóa toàn bộ cảnh báo và hình phạt báo cáo sai cho bạn.', NULL, 1, '2025-12-07 12:12:43', NULL),
(28, 2, 'report_warning', 'Cảnh báo báo cáo sai', 'Bạn đã nhận cảnh báo lần 1 do gửi báo cáo không chính xác. Hiện tại bạn có 1 báo cáo sai trong 1 tháng và 1 báo cáo sai trong 3 tháng. Nếu tiếp tục báo cáo sai, bạn sẽ bị cấm báo cáo.', NULL, 1, '2025-12-07 12:16:21', NULL),
(29, 2, 'report_warning', 'Cảnh báo báo cáo sai', 'Bạn đã nhận cảnh báo lần 2 do gửi báo cáo không chính xác. Hiện tại bạn có 2 báo cáo sai trong 1 tháng và 2 báo cáo sai trong 3 tháng. Nếu tiếp tục báo cáo sai, bạn sẽ bị cấm báo cáo.', NULL, 1, '2025-12-07 12:20:14', NULL),
(30, 2, 'report_warning', 'Cảnh báo báo cáo sai', 'Bạn đã bị cấm báo cáo trong 30 ngày do báo cáo sai 3 lần trong vòng 1 tháng.', NULL, 1, '2025-12-07 12:20:18', NULL),
(31, 2, 'penalty_reduced', 'Xóa toàn bộ hình phạt', 'Quản trị viên đã xóa toàn bộ cảnh báo và hình phạt báo cáo sai cho bạn.', NULL, 1, '2025-12-07 12:21:29', NULL),
(32, 1, '', 'Test', 'asd', NULL, 1, '2025-12-07 12:23:34', NULL),
(33, 2, '', 'Test', 'asd', NULL, 1, '2025-12-07 12:23:34', NULL),
(34, 3, '', 'Test', 'asd', NULL, 1, '2025-12-07 12:23:34', NULL),
(35, 4, '', 'Test', 'asd', NULL, 0, '2025-12-07 12:23:34', NULL),
(36, 4, 'penalty_reduced', 'Giảm hình phạt', 'Quản trị viên đã giảm 1 lần cảnh báo báo cáo sai cho bạn do hoạt động tích cực.', NULL, 0, '2025-12-07 12:27:02', NULL),
(37, 4, 'report_warning', 'Cảnh báo báo cáo sai', 'Bạn đã nhận cảnh báo lần 3 do gửi báo cáo không chính xác. Hiện tại bạn có 1 báo cáo sai trong 1 tháng và 1 báo cáo sai trong 3 tháng. Nếu tiếp tục báo cáo sai, bạn sẽ bị cấm báo cáo.', NULL, 0, '2025-12-07 12:27:17', NULL),
(38, 2, 'report_warning', 'Cảnh báo báo cáo sai', 'Bạn đã nhận cảnh báo lần 1 do gửi báo cáo không chính xác. Hiện tại bạn có 1 báo cáo sai trong 1 tháng và 1 báo cáo sai trong 3 tháng. Nếu tiếp tục báo cáo sai, bạn sẽ bị cấm báo cáo.', NULL, 1, '2025-12-07 12:54:41', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `posts`
--

CREATE TABLE `posts` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `views` int(11) DEFAULT 0,
  `is_approved` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_pinned` tinyint(1) DEFAULT 0,
  `pinned_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `posts`
--

INSERT INTO `posts` (`id`, `title`, `content`, `user_id`, `category_id`, `views`, `is_approved`, `created_at`, `updated_at`, `is_pinned`, `pinned_at`) VALUES
(1, 'Hướng dẫn học React.js cho người mới bắt đầu', '# Giới thiệu về React.js\n\nReact.js là một thư viện JavaScript phổ biến để xây dựng giao diện người dùng.\n\n## Cài đặt\n\n```bash\nnpx create-react-app my-app\ncd my-app\nnpm start\n```\n\n## Component đầu tiên\n\n```jsx\nfunction Welcome(props) {\n  return <h1>Hello, {props.name}!</h1>;\n}\n```\n\nReact sử dụng JSX để viết component một cách dễ dàng và trực quan.', 2, 1, 172, 1, '2025-11-19 11:40:31', '2025-12-07 12:41:33', 0, NULL),
(2, 'Cấu trúc dữ liệu Stack và Queue', '# Stack và Queue\n\n## Stack (Ngăn xếp)\n\nStack là cấu trúc dữ liệu hoạt động theo nguyên tắc LIFO (Last In First Out).\n\n### Các thao tác cơ bản:\n- **Push**: Thêm phần tử vào đỉnh stack\n- **Pop**: Lấy phần tử từ đỉnh stack\n- **Top/Peek**: Xem phần tử ở đỉnh stack\n\n```python\nclass Stack:\n    def __init__(self):\n        self.items = []\n    \n    def push(self, item):\n        self.items.append(item)\n    \n    def pop(self):\n        return self.items.pop()\n```\n\n## Queue (Hàng đợi)\n\nQueue hoạt động theo nguyên tắc FIFO (First In First Out).', 3, 3, 95, 1, '2025-11-19 11:40:31', '2025-12-07 11:36:33', 0, NULL),
(3, 'Tối ưu hóa truy vấn MySQL', '# Tối ưu hóa MySQL\n\n## 1. Sử dụng Index\n\nIndex giúp tăng tốc độ truy vấn đáng kể:\n\n```sql\nCREATE INDEX idx_user_email ON users(email);\nCREATE INDEX idx_post_category ON posts(category_id, created_at);\n```\n\n## 2. Tối ưu câu truy vấn\n\n### Tránh SELECT *\n```sql\n-- Không tốt\nSELECT * FROM users WHERE email = \"user@example.com\";\n\n-- Tốt hơn\nSELECT id, username, full_name FROM users WHERE email = \"user@example.com\";\n```\n\n## 3. Sử dụng EXPLAIN\n\n```sql\nEXPLAIN SELECT * FROM posts WHERE category_id = 1;\n```', 4, 2, 235, 1, '2025-11-19 11:40:31', '2025-12-07 11:21:50', 0, NULL),
(4, 'Bảo mật ứng dụng web cơ bản', '# Bảo mật Web Application\n\n## 1. SQL Injection\n\nLuôn sử dụng prepared statements:\n\n```php\n// Không an toàn\n$query = \"SELECT * FROM users WHERE id = \" . $_GET[\"id\"];\n\n// An toàn\n$stmt = $pdo->prepare(\"SELECT * FROM users WHERE id = ?\");\n$stmt->execute([$_GET[\"id\"]]);\n```\n\n## 2. XSS (Cross-Site Scripting)\n\nEscape output data:\n\n```php\necho htmlspecialchars($user_input, ENT_QUOTES, \"UTF-8\");\n```\n\n## 3. CSRF Protection\n\nSử dụng CSRF tokens trong forms.', 2, 6, 180, 1, '2025-11-19 11:40:31', '2025-12-07 11:33:09', 0, NULL),
(6, 'asd', '**asd**', 1, 6, 6, 1, '2025-11-19 15:31:18', '2025-12-07 11:38:24', 0, NULL),
(10, 'asd', '**dasdasd**\nasd\n*asd*\n# asd# \n> SAD\nhttps://www.youtube.com/watch?v=E3etOPxbcSg&list=RDE3etOPxbcSg&start_radio=1\n', 2, 6, 8, 1, '2025-11-19 15:46:59', '2025-12-07 11:36:12', 0, NULL),
(11, 'asd', 'https://www.youtube.com/watch?v=E3etOPxbcSg&list=RDE3etOPxbcSg&start_radio=1', 2, 7, 12, 1, '2025-11-19 15:47:32', '2025-12-07 12:39:15', 0, NULL),
(12, 'fff', '\nhttps://www.youtube.com/watch?v=E3etOPxbcSg&list=RDE3etOPxbcSg&start_radio=1', 2, 6, 15, 1, '2025-11-19 15:48:41', '2025-12-07 12:31:00', 0, NULL),
(13, 'Test', '**Test anh**\n![Alt text](https://ocafe.net/wp-content/uploads/2024/10/anh-nen-may-tinh-4k-1.jpg)\n**Test video**\n\nhttps://www.youtube.com/watch?v=4lpsMnBYdxg\n', 1, 1, 46, 1, '2025-11-27 08:12:07', '2025-12-07 12:44:09', 0, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `post_tags`
--

CREATE TABLE `post_tags` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `post_tags`
--

INSERT INTO `post_tags` (`id`, `post_id`, `tag_id`, `created_at`) VALUES
(3, 12, 33, '2025-12-07 11:19:54');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `reported_user_id` int(11) DEFAULT NULL,
  `reported_post_id` int(11) DEFAULT NULL,
  `reported_document_id` int(11) DEFAULT NULL,
  `report_type` enum('user','post','document') NOT NULL,
  `reason` enum('spam','inappropriate','harassment','fake_info','copyright','other') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') DEFAULT 'pending',
  `admin_note` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `is_false_report` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `reports`
--

INSERT INTO `reports` (`id`, `reporter_id`, `reported_user_id`, `reported_post_id`, `reported_document_id`, `report_type`, `reason`, `description`, `status`, `admin_note`, `reviewed_by`, `reviewed_at`, `is_false_report`, `created_at`) VALUES
(1, 2, 3, NULL, NULL, 'user', 'spam', 'Người dùng này liên tục gửi tin nhắn spam', 'dismissed', NULL, 1, '2025-12-07 12:21:43', 0, '2025-11-19 11:40:32'),
(2, 3, NULL, 1, NULL, 'post', 'inappropriate', 'Nội dung bài viết không phù hợp với diễn đàn', 'pending', NULL, 1, '2025-12-07 12:52:17', 0, '2025-11-19 11:40:32'),
(3, 4, 2, NULL, NULL, 'user', 'harassment', 'Người dùng này có hành vi quấy rối', 'resolved', NULL, 1, '2025-12-07 12:27:17', 1, '2025-11-19 11:40:32'),
(4, 2, NULL, 3, NULL, 'post', 'fake_info', 'Bài viết chứa thông tin sai lệch về công nghệ', 'dismissed', NULL, NULL, NULL, 0, '2025-11-19 11:40:32'),
(5, 3, NULL, NULL, 1, 'document', 'copyright', 'Tài liệu này vi phạm bản quyền', 'pending', NULL, NULL, NULL, 0, '2025-11-19 11:40:32'),
(6, 4, NULL, NULL, 2, 'document', 'inappropriate', 'Nội dung tài liệu không phù hợp', 'reviewed', NULL, NULL, NULL, 0, '2025-11-19 11:40:32'),
(7, 2, NULL, 2, NULL, 'post', 'spam', NULL, 'dismissed', NULL, 1, '2025-12-07 12:21:39', 0, '2025-11-19 15:24:20'),
(8, 2, NULL, NULL, 7, 'document', 'fake_info', NULL, 'dismissed', NULL, 1, '2025-12-07 12:54:41', 1, '2025-11-27 08:06:44');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `report_warnings`
--

CREATE TABLE `report_warnings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `warning_count` int(11) DEFAULT 0,
  `is_banned_from_reporting` tinyint(1) DEFAULT 0,
  `ban_until` timestamp NULL DEFAULT NULL,
  `last_warning_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `report_warnings`
--

INSERT INTO `report_warnings` (`id`, `user_id`, `warning_count`, `is_banned_from_reporting`, `ban_until`, `last_warning_at`, `created_at`, `updated_at`) VALUES
(1, 3, 0, 0, NULL, '2025-11-17 11:40:32', '2025-11-19 11:40:32', '2025-12-07 12:12:43'),
(2, 4, 3, 1, '2025-11-24 11:40:32', '2025-12-07 12:27:17', '2025-11-19 11:40:32', '2025-12-07 12:27:17'),
(3, 2, 1, 0, NULL, '2025-12-07 12:54:41', '2025-11-27 08:07:24', '2025-12-07 12:54:41');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `statistics`
--

CREATE TABLE `statistics` (
  `id` int(11) NOT NULL,
  `total_users` int(11) DEFAULT 0,
  `total_posts` int(11) DEFAULT 0,
  `total_comments` int(11) DEFAULT 0,
  `total_documents` int(11) DEFAULT 0,
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `statistics`
--

INSERT INTO `statistics` (`id`, `total_users`, `total_posts`, `total_comments`, `total_documents`, `date`, `created_at`) VALUES
(1, 4, 4, 7, 0, '2025-11-19', '2025-11-19 11:40:32');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `usage_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `tags`
--

INSERT INTO `tags` (`id`, `name`, `slug`, `usage_count`, `created_at`) VALUES
(1, 'javascript', 'javascript', 0, '2025-12-07 09:41:45'),
(2, 'python', 'python', 0, '2025-12-07 09:41:45'),
(3, 'java', 'java', 0, '2025-12-07 09:41:45'),
(4, 'csharp', 'csharp', 0, '2025-12-07 09:41:45'),
(5, 'php', 'php', 0, '2025-12-07 09:41:45'),
(6, 'nodejs', 'nodejs', 0, '2025-12-07 09:41:45'),
(7, 'reactjs', 'reactjs', 0, '2025-12-07 09:41:45'),
(8, 'vuejs', 'vuejs', 0, '2025-12-07 09:41:45'),
(9, 'angular', 'angular', 0, '2025-12-07 09:41:45'),
(10, 'html', 'html', 0, '2025-12-07 09:41:45'),
(11, 'css', 'css', 0, '2025-12-07 09:41:45'),
(12, 'mysql', 'mysql', 0, '2025-12-07 09:41:45'),
(13, 'mongodb', 'mongodb', 0, '2025-12-07 09:41:45'),
(14, 'postgresql', 'postgresql', 0, '2025-12-07 09:41:45'),
(15, 'docker', 'docker', 0, '2025-12-07 09:41:45'),
(16, 'git', 'git', 0, '2025-12-07 09:41:45'),
(17, 'linux', 'linux', 0, '2025-12-07 09:41:45'),
(18, 'windows', 'windows', 0, '2025-12-07 09:41:45'),
(19, 'android', 'android', 0, '2025-12-07 09:41:45'),
(20, 'ios', 'ios', 0, '2025-12-07 09:41:45'),
(21, 'flutter', 'flutter', 0, '2025-12-07 09:41:45'),
(22, 'machine-learning', 'machine-learning', 0, '2025-12-07 09:41:45'),
(23, 'deep-learning', 'deep-learning', 0, '2025-12-07 09:41:45'),
(24, 'api', 'api', 0, '2025-12-07 09:41:45'),
(25, 'rest-api', 'rest-api', 0, '2025-12-07 09:41:45'),
(26, 'security', 'security', 0, '2025-12-07 09:41:45'),
(27, 'tutorial', 'tutorial', 0, '2025-12-07 09:41:45'),
(28, 'tips', 'tips', 0, '2025-12-07 09:41:45'),
(29, 'bug', 'bug', 0, '2025-12-07 09:41:45'),
(30, 'help', 'help', 0, '2025-12-07 09:41:45'),
(31, 'asd', 'asd', 1, '2025-12-07 09:42:15'),
(32, 'duc', 'duc', 1, '2025-12-07 09:42:44'),
(33, 'baomat', 'baomat', 1, '2025-12-07 11:19:54');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reset_otp` varchar(6) DEFAULT NULL,
  `reset_otp_expiry` timestamp NULL DEFAULT NULL,
  `theme_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`theme_settings`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `avatar`, `role`, `is_active`, `created_at`, `updated_at`, `reset_otp`, `reset_otp_expiry`, `theme_settings`) VALUES
(1, 'admin', 'admin@diendan.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quản trị viên', NULL, 'admin', 1, '2025-11-19 11:40:31', '2025-12-07 12:38:54', '722252', '2025-11-19 16:31:37', '{\"backgroundColor\":\"#f8f9fa\",\"backgroundImage\":\"\",\"backgroundSize\":\"cover\",\"backgroundPosition\":\"center\",\"backgroundAttachment\":\"fixed\",\"primaryColor\":\"#007bff\",\"textColor\":\"#333333\",\"cardBackground\":\"#ffffff\",\"cardOpacity\":1,\"fontFamily\":\"-apple-system, BlinkMacSystemFont, \\\"Segoe UI\\\", Roboto, sans-serif\",\"fontSize\":\"16px\",\"borderRadius\":\"8px\",\"navbarBackground\":\"#ffffff\",\"navbarTextColor\":\"#333333\",\"linkColor\":\"#007bff\",\"linkHoverColor\":\"#0056b3\",\"buttonColor\":\"#007bff\",\"buttonTextColor\":\"#ffffff\",\"borderColor\":\"#dee2e6\",\"inputBackground\":\"#ffffff\",\"inputTextColor\":\"#495057\",\"badgeBackground\":\"#667eea\",\"badgeTextColor\":\"#ffffff\",\"footerBackground\":\"#343a40\",\"footerTextColor\":\"#ffffff\"}'),
(2, 'tranlamphuduc', 'katozamata@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần Lâm Phú Đức', '/uploads/avatars/avatar-1765110653763-619534274.png', 'user', 1, '2025-11-19 11:40:31', '2025-12-07 12:43:53', '332305', '2025-11-19 17:00:57', '{\"backgroundColor\":\"#f8f9fa\",\"backgroundImage\":\"http://localhost:5000/uploads/backgrounds/bg-1765111310153-114866515.jpg\",\"backgroundSize\":\"cover\",\"backgroundPosition\":\"center\",\"backgroundAttachment\":\"fixed\",\"primaryColor\":\"#007bff\",\"textColor\":\"#333333\",\"cardBackground\":\"#ffffff\",\"cardOpacity\":1,\"fontFamily\":\"-apple-system, BlinkMacSystemFont, \\\"Segoe UI\\\", Roboto, sans-serif\",\"fontSize\":\"16px\",\"borderRadius\":\"8px\",\"navbarBackground\":\"#666af0\",\"navbarTextColor\":\"#ffffff\",\"linkColor\":\"#007bff\",\"linkHoverColor\":\"#0056b3\",\"buttonColor\":\"#007bff\",\"buttonTextColor\":\"#ffffff\",\"borderColor\":\"#dee2e6\",\"inputBackground\":\"#ffffff\",\"inputTextColor\":\"#495057\",\"badgeBackground\":\"#667eea\",\"badgeTextColor\":\"#ffffff\",\"footerBackground\":\"#343a40\",\"footerTextColor\":\"#ffffff\"}'),
(3, 'nguyenthanhduy', 'tranlamphuducc3tieucan22@gmail.com', '$2a$10$l2PybyFhJWQrx7TUVNs08uC1JAOBMJZJSLlMZlZvMYn3kpyX6n3Ne', 'Nguyễn Thanh Duy', NULL, 'user', 1, '2025-11-19 11:40:31', '2025-12-07 12:46:17', '498669', '2025-11-19 16:50:19', '{\"backgroundColor\":\"#1a1a2e\",\"backgroundImage\":\"\",\"backgroundSize\":\"cover\",\"backgroundPosition\":\"center\",\"backgroundAttachment\":\"fixed\",\"primaryColor\":\"#e94560\",\"textColor\":\"#eaeaea\",\"cardBackground\":\"#16213e\",\"cardOpacity\":1,\"fontFamily\":\"-apple-system, BlinkMacSystemFont, \\\"Segoe UI\\\", Roboto, sans-serif\",\"fontSize\":\"16px\",\"borderRadius\":\"8px\",\"navbarBackground\":\"#0f3460\",\"navbarTextColor\":\"#eaeaea\",\"linkColor\":\"#e94560\",\"linkHoverColor\":\"#ff6b6b\",\"buttonColor\":\"#e94560\",\"buttonTextColor\":\"#ffffff\",\"borderColor\":\"#2d3748\",\"inputBackground\":\"#16213e\",\"inputTextColor\":\"#eaeaea\",\"badgeBackground\":\"#e94560\",\"badgeTextColor\":\"#ffffff\",\"footerBackground\":\"#0f3460\",\"footerTextColor\":\"#eaeaea\"}'),
(4, 'nguyendinhtuankhoa', 'lequangc@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nguyễn Đinh Tuấn Khoa', NULL, 'user', 1, '2025-11-19 11:40:31', '2025-11-19 11:40:31', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_bans`
--

CREATE TABLE `user_bans` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ban_type` enum('account','comment','post','document','report') NOT NULL,
  `reason` text DEFAULT NULL,
  `banned_by` int(11) NOT NULL,
  `ban_until` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_bans`
--

INSERT INTO `user_bans` (`id`, `user_id`, `ban_type`, `reason`, `banned_by`, `ban_until`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, 'comment', NULL, 1, '2025-12-08 07:17:59', 0, '2025-12-07 07:17:59', '2025-12-07 07:18:04'),
(2, 3, 'post', 'spam', 1, '2025-12-08 09:57:01', 0, '2025-12-07 09:57:01', '2025-12-07 09:58:15');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_follows`
--

CREATE TABLE `user_follows` (
  `id` int(11) NOT NULL,
  `follower_id` int(11) NOT NULL,
  `following_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_follows`
--

INSERT INTO `user_follows` (`id`, `follower_id`, `following_id`, `created_at`) VALUES
(2, 2, 1, '2025-12-07 09:05:36');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_bookmark` (`user_id`,`post_id`),
  ADD KEY `post_id` (`post_id`);

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `category_follows`
--
ALTER TABLE `category_follows`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_follow` (`user_id`,`category_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Chỉ mục cho bảng `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `post_id` (`post_id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Chỉ mục cho bảng `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Chỉ mục cho bảng `post_tags`
--
ALTER TABLE `post_tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_post_tag` (`post_id`,`tag_id`),
  ADD KEY `idx_post_tags_post` (`post_id`),
  ADD KEY `idx_post_tags_tag` (`tag_id`);

--
-- Chỉ mục cho bảng `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reporter_id` (`reporter_id`),
  ADD KEY `reported_user_id` (`reported_user_id`),
  ADD KEY `reported_post_id` (`reported_post_id`),
  ADD KEY `reported_document_id` (`reported_document_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Chỉ mục cho bảng `report_warnings`
--
ALTER TABLE `report_warnings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_warning` (`user_id`);

--
-- Chỉ mục cho bảng `statistics`
--
ALTER TABLE `statistics`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_tags_name` (`name`),
  ADD KEY `idx_tags_slug` (`slug`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Chỉ mục cho bảng `user_bans`
--
ALTER TABLE `user_bans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_ban_type` (`user_id`,`ban_type`),
  ADD KEY `banned_by` (`banned_by`),
  ADD KEY `idx_user_bans_user_id` (`user_id`),
  ADD KEY `idx_user_bans_ban_type` (`ban_type`),
  ADD KEY `idx_user_bans_is_active` (`is_active`);

--
-- Chỉ mục cho bảng `user_follows`
--
ALTER TABLE `user_follows`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_follow` (`follower_id`,`following_id`),
  ADD KEY `following_id` (`following_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `bookmarks`
--
ALTER TABLE `bookmarks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `category_follows`
--
ALTER TABLE `category_follows`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT cho bảng `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT cho bảng `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `post_tags`
--
ALTER TABLE `post_tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `report_warnings`
--
ALTER TABLE `report_warnings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `statistics`
--
ALTER TABLE `statistics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `user_bans`
--
ALTER TABLE `user_bans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `user_follows`
--
ALTER TABLE `user_follows`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD CONSTRAINT `bookmarks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookmarks_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `category_follows`
--
ALTER TABLE `category_follows`
  ADD CONSTRAINT `category_follows_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `category_follows_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `post_tags`
--
ALTER TABLE `post_tags`
  ADD CONSTRAINT `post_tags_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `post_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_3` FOREIGN KEY (`reported_post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_4` FOREIGN KEY (`reported_document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_5` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `report_warnings`
--
ALTER TABLE `report_warnings`
  ADD CONSTRAINT `report_warnings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_bans`
--
ALTER TABLE `user_bans`
  ADD CONSTRAINT `user_bans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_bans_ibfk_2` FOREIGN KEY (`banned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_follows`
--
ALTER TABLE `user_follows`
  ADD CONSTRAINT `user_follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_follows_ibfk_2` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
