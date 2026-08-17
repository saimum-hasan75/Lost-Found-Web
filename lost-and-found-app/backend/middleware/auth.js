const pool = require('../config/db');

// Simple header-based user authentication (x-user-id or Authorization header)
async function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Authentication check failed.' });
  }
}

async function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
  });
}

async function optionalAuth(req, res, next) {
  const userId = req.headers['x-user-id'] || req.headers['authorization']?.replace('Bearer ', '');
  if (userId) {
    try {
      const [rows] = await pool.query(
        'SELECT id, name, email, phone, role FROM users WHERE id = ?',
        [userId]
      );
      if (rows.length > 0) {
        req.user = rows[0];
      }
    } catch (e) {
      // ignore
    }
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth,
};
