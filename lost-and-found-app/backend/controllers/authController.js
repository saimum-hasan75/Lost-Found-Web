const pool = require('../config/db');

// POST /api/auth/google - Google SSO handler
exports.googleAuth = async (req, res) => {
  try {
    const { name, email, photo_url } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Google email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (existing.length > 0) {
      const user = existing[0];
      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at,
      };
      return res.json({ user: safeUser });
    }

    // Create new user with default role 'user'
    const userName = name ? name.trim() : cleanEmail.split('@')[0];
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [userName, cleanEmail, 'GOOGLE_AUTH_USER', 'user']
    );

    const newUser = {
      id: result.insertId,
      name: userName,
      email: cleanEmail,
      phone: null,
      role: 'user',
    };

    res.status(201).json({ user: newUser });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ message: 'Google sign-in failed. Please try again.' });
  }
};

// POST /api/auth/register - Default role is always 'user'
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Default role is always 'user'. Admin can upgrade via database.
    const defaultRole = 'user';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, password, phone ? phone.trim() : null, defaultRole]
    );

    const newUser = {
      id: result.insertId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      role: defaultRole,
    };

    res.status(201).json({ user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Could not register user. Please try again.' });
  }
};

// POST /api/auth/login - Plain text password comparison
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
    };

    res.json({ user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = rows[0];

    // Get user stats
    const [stats] = await pool.query(
      `SELECT
        COUNT(*) as total_posts,
        SUM(CASE WHEN post_type = 'lost' THEN 1 ELSE 0 END) as lost_count,
        SUM(CASE WHEN post_type = 'found' THEN 1 ELSE 0 END) as found_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
       FROM items WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      user,
      stats: {
        total_posts: Number(stats[0]?.total_posts || 0),
        lost_count: Number(stats[0]?.lost_count || 0),
        found_count: Number(stats[0]?.found_count || 0),
        resolved_count: Number(stats[0]?.resolved_count || 0),
      },
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Could not fetch profile.' });
  }
};

// PUT /api/auth/me
exports.updateMe = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [
      name.trim(),
      phone ? phone.trim() : null,
      req.user.id,
    ]);

    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ message: 'Could not update profile.' });
  }
};

// GET /api/auth/users (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.created_at,
        COUNT(i.id) as item_count
      FROM users u
      LEFT JOIN items i ON u.id = i.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ message: 'Could not fetch users list.' });
  }
};

// DELETE /api/auth/users/:id (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account.' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ message: 'Could not delete user.' });
  }
};
