const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.execute('SELECT * FROM users WHERE id = ? AND is_active = TRUE', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ message: 'Không có quyền truy cập' });
  }
};

module.exports = { auth, adminAuth };