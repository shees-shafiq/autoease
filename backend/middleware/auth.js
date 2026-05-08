const jwt = require('jsonwebtoken');
const db = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token, authorization denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.execute('SELECT id, name, email, role, is_active FROM users WHERE id = ?', [decoded.id]);

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  });
};

const mechanicAuth = (req, res, next) => {
  auth(req, res, () => {
    if (!['admin', 'mechanic'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Mechanic access required' });
    }
    next();
  });
};

module.exports = { auth, adminAuth, mechanicAuth };
