# 🌐 Diễn Đàn Tin Học

Một diễn đàn trực tuyến hiện đại chuyên về lĩnh vực tin học, nơi cộng đồng yêu thích công nghệ có thể chia sẻ kiến thức, trao đổi kinh nghiệm và hỗ trợ lẫn nhau.

## ✨ Tính năng chính

### 👥 Dành cho người dùng
- 🔐 Đăng ký/đăng nhập tài khoản
- ✍️ Tạo, chỉnh sửa và xóa bài viết
- 💬 Bình luận và thảo luận
- 📁 Chia sẻ tài liệu (PDF, DOCX, PPTX, hình ảnh)
- 🔍 Tìm kiếm bài viết và tài liệu theo từ khóa, danh mục
- 👤 Quản lý hồ sơ cá nhân
- 📊 Theo dõi thống kê cá nhân (bài viết, tài liệu, lượt xem)

### 🛡️ Dành cho quản trị viên
- 👥 Quản lý người dùng (thêm, sửa, khóa tài khoản)
- 🗂️ Quản lý danh mục chủ đề
- 📝 Kiểm duyệt và xóa bài viết vi phạm
- 💬 Quản lý bình luận
- 📈 Thống kê hoạt động diễn đàn
- 📊 Theo dõi số liệu người dùng và nội dung

## 🛠️ Công nghệ sử dụng

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Mysql
- **Authentication**: JWT tokens
- **File Storage**: GridFS
- **Password Hashing**: bcrypt
- **CORS**: Configured cho frontend

### Frontend
- **Framework**: React 19
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: React Context
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Styling**: Glass morphism design với gradient

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js 16+
- Python 3.8+
- Mysql
- Git

### 1. Clone repository
```bash
git clone https://github.com/tranlamphuduc/cn-da22ttd-tranlamphuduc-diendantinhoc-JavaScriptHTMLCSSNodejs.git
```

### 2. Cài đặt Backend
```bash
cd backend
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env
# Cập nhật thông tin mysql và JWT secret trong .env

# Chạy server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### 3. Cài đặt Frontend
```bash
cd frontend
npm install
# hoặc
yarn install

# Tạo file .env
cp .env.example .env
# Cập nhật REACT_APP_BACKEND_URL trong .env

# Chạy development server
npm start
# hoặc
yarn start
```

### 4. Truy cập ứng dụng
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📁 Cấu trúc dự án

```
dien-dan-tin-hoc/
├── backend/                 # Backend API (Python FastAPI)
│   ├── server.py           # Main server file
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Backend environment variables
│
├── frontend/               # Frontend Web App (React)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/          # Utilities
│   ├── public/            # Static files
│   └── package.json       # Node.js dependencies
│
├── test/                  # Test files
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```

## 🔧 Cấu hình Environment Variables

### Backend (.env)
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dien_dan_tin_hoc
JWT_SECRET=
UPLOAD_PATH=uploads/
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
npm test
# hoặc
yarn test
```

## 📦 Deployment

### Backend Deployment
- Có thể deploy lên Heroku, Railway, hoặc VPS
- Sử dụng MongoDB Atlas cho production database
- Cấu hình CORS cho domain production

### Frontend Deployment
- Có thể deploy lên Vercel, Netlify, hoặc static hosting
- Build production: `npm run build`
- Cập nhật REACT_APP_BACKEND_URL cho production API

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phát hành dưới [MIT License](LICENSE).

## 👨‍💻 Tác giả

**Trần Lâm Phú Đức**
- GitHub: (https://github.com/tranlamphuduc)
- Email: tranlamphuducc3tieucan22@gmail.com

## 🙏 Acknowledgments

- Cảm ơn cộng đồng React và FastAPI
- Cảm ơn các thư viện mã nguồn mở được sử dụng
- Cảm ơn những người đóng góp cho dự án

---

