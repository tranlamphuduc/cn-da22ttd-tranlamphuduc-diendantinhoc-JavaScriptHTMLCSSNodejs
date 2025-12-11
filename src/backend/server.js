const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const categoryRoutes = require('./routes/categories');
const commentRoutes = require('./routes/comments');
const documentRoutes = require('./routes/documents');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const { router: notificationRoutes, cleanupOldNotifications } = require('./routes/notifications');
const bookmarkRoutes = require('./routes/bookmarks');
const followRoutes = require('./routes/follows');
const { router: tagRoutes } = require('./routes/tags');
const contactRoutes = require('./routes/contact');

const app = express();

// Middleware
app.use(cors({
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/contact', contactRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Có lỗi xảy ra trên server!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
  
  // Chạy cleanup thông báo cũ khi server khởi động
  cleanupOldNotifications();
  
  // Scheduled job: Xóa thông báo cũ mỗi 24 giờ
  setInterval(() => {
    console.log('Đang chạy cleanup thông báo cũ...');
    cleanupOldNotifications();
  }, 24 * 60 * 60 * 1000); // 24 giờ
});