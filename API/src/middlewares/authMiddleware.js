const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-here-make-it-long-and-secure';
console.log('SECRET_KEY in middleware:', SECRET_KEY);

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Thiếu token xác thực' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }

  try {
    console.log('Verifying token:', token);
    console.log('Using SECRET_KEY:', SECRET_KEY);
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Decoded token:', decoded); // Thêm log để debug
    if (!decoded.userId) {
      return res.status(403).json({ message: 'Token không chứa userId' });
    }
    req.user = { id: decoded.userId, role: decoded.role }; // Chuẩn hóa req.user
    console.log('User set in request:', req.user);
    next();
  } catch (err) {
    console.error('Verify token error:', err.message); // Thêm log lỗi
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token đã hết hạn' });
    }
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

const verifyAdmin = (req, res, next) => {
  // Không gọi verifyToken nữa vì nó đã được gọi trong route
  console.log('Verifying admin access for user:', req.user);
  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json({ message: 'Chưa xác thực' });
  }
  
  if (req.user.role === 'admin') {
    console.log('Admin access granted');
    next();
  } else {
    console.log('Admin access denied, user role:', req.user.role);
    res.status(403).json({ message: 'Yêu cầu quyền admin' });
  }
};

module.exports = { verifyToken, verifyAdmin };