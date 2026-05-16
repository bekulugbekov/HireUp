const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: req.t('auth.unauthorized') });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: req.t('auth.unauthorized') });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: req.t('auth.tokenExpired') });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: req.t('auth.forbidden') });
    }
    next();
  };
};

module.exports = { protect, authorize };
