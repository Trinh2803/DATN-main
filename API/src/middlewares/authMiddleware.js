const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

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
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Decoded token:', decoded); // Thêm log để debug
    if (!decoded.userId) {
      return res.status(403).json({ message: 'Token không chứa userId' });
    }
    req.user = { id: decoded.userId, role: decoded.role }; // Chuẩn hóa req.user
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
  verifyToken(req, res, () => {
    if (req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Yêu cầu quyền admin' });
    }
  });
};

module.exports = { verifyToken, verifyAdmin };