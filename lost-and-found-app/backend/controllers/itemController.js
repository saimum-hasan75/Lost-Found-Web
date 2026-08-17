const pool = require('../config/db');

const CATEGORIES = [
  'Electronics',
  'Bags & Backpacks',
  'Keys',
  'Documents',
  'Jewelry & Watches',
  'Clothing',
  'Pets',
  'Other',
];

// GET /api/items?type=lost|found&category=&status=&search=
exports.getItems = async (req, res) => {
  try {
    const { type, category, status, search } = req.query;
    const clauses = [];
    const params = [];

    if (type && ['lost', 'found'].includes(type)) {
      clauses.push('i.post_type = ?');
      params.push(type);
    }
    if (category) {
      clauses.push('i.category = ?');
      params.push(category);
    }
    if (status && ['open', 'resolved'].includes(status)) {
      clauses.push('i.status = ?');
      params.push(status);
    }
    if (search) {
      clauses.push('(i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT i.*, u.name as user_name, u.email as user_email
       FROM items i
       LEFT JOIN users u ON i.user_id = u.id
       ${where}
       ORDER BY i.created_at DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('getItems error:', err);
    res.status(500).json({ message: 'Could not load items.' });
  }
};

// GET /api/items/my
exports.getMyItems = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, u.name as user_name, u.email as user_email
       FROM items i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.user_id = ?
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getMyItems error:', err);
    res.status(500).json({ message: 'Could not load your items.' });
  }
};

// GET /api/items/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    const [itemStats] = await pool.query(`
      SELECT
        COUNT(*) as total_items,
        SUM(CASE WHEN post_type = 'lost' THEN 1 ELSE 0 END) as total_lost,
        SUM(CASE WHEN post_type = 'found' THEN 1 ELSE 0 END) as total_found,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as total_resolved,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as total_open
      FROM items
    `);

    const [userStats] = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as total_regular_users
      FROM users
    `);

    const total = Number(itemStats[0]?.total_items || 0);
    const resolved = Number(itemStats[0]?.total_resolved || 0);
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    res.json({
      total_items: total,
      total_lost: Number(itemStats[0]?.total_lost || 0),
      total_found: Number(itemStats[0]?.total_found || 0),
      total_resolved: resolved,
      total_open: Number(itemStats[0]?.total_open || 0),
      resolution_rate: resolutionRate,
      total_users: Number(userStats[0]?.total_users || 0),
      total_admins: Number(userStats[0]?.total_admins || 0),
      total_regular_users: Number(userStats[0]?.total_regular_users || 0),
    });
  } catch (err) {
    console.error('getAdminStats error:', err);
    res.status(500).json({ message: 'Could not load statistics.' });
  }
};

// GET /api/items/:id
exports.getItemById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, u.name as user_name, u.email as user_email
       FROM items i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getItemById error:', err);
    res.status(500).json({ message: 'Could not load item.' });
  }
};

// POST /api/items
exports.createItem = async (req, res) => {
  try {
    const {
      post_type,
      title,
      category,
      description,
      location,
      date_occurred,
      contact_name,
      contact_email,
      contact_phone,
      image_url,
    } = req.body;

    if (
      !post_type ||
      !title ||
      !category ||
      !location ||
      !date_occurred ||
      !contact_name ||
      !contact_email
    ) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (!['lost', 'found'].includes(post_type)) {
      return res.status(400).json({ message: 'post_type must be "lost" or "found".' });
    }

    const userId = req.user ? req.user.id : null;

    const [result] = await pool.query(
      `INSERT INTO items
        (post_type, title, category, description, location, date_occurred,
         contact_name, contact_email, contact_phone, image_url, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post_type,
        title.trim(),
        category,
        description ? description.trim() : null,
        location.trim(),
        date_occurred,
        contact_name.trim(),
        contact_email.trim(),
        contact_phone ? contact_phone.trim() : null,
        image_url ? image_url.trim() : null,
        userId,
      ]
    );

    const [rows] = await pool.query(
      `SELECT i.*, u.name as user_name, u.email as user_email
       FROM items i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createItem error:', err);
    res.status(500).json({ message: 'Could not create the post.' });
  }
};

// PUT /api/items/:id
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      post_type,
      title,
      category,
      description,
      location,
      date_occurred,
      contact_name,
      contact_email,
      contact_phone,
      image_url,
      status,
    } = req.body;

    const [existing] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const item = existing[0];
    const isOwner = req.user && item.user_id === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to edit this post.' });
    }

    const nextPostType = post_type || item.post_type;
    const nextStatus = status || item.status;

    await pool.query(
      `UPDATE items SET
        post_type = ?,
        title = ?,
        category = ?,
        description = ?,
        location = ?,
        date_occurred = ?,
        contact_name = ?,
        contact_email = ?,
        contact_phone = ?,
        image_url = ?,
        status = ?
       WHERE id = ?`,
      [
        nextPostType,
        title !== undefined ? title : item.title,
        category !== undefined ? category : item.category,
        description !== undefined ? description : item.description,
        location !== undefined ? location : item.location,
        date_occurred !== undefined ? date_occurred : item.date_occurred,
        contact_name !== undefined ? contact_name : item.contact_name,
        contact_email !== undefined ? contact_email : item.contact_email,
        contact_phone !== undefined ? contact_phone : item.contact_phone,
        image_url !== undefined ? image_url : item.image_url,
        nextStatus,
        id,
      ]
    );

    const [rows] = await pool.query(
      `SELECT i.*, u.name as user_name, u.email as user_email
       FROM items i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = ?`,
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('updateItem error:', err);
    res.status(500).json({ message: 'Could not update the post.' });
  }
};

// PATCH /api/items/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['open', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'status must be "open" or "resolved".' });
    }
    const [existing] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const item = existing[0];
    const isOwner = req.user && item.user_id === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to change status.' });
    }

    await pool.query('UPDATE items SET status = ? WHERE id = ?', [status, id]);
    const [rows] = await pool.query(
      `SELECT i.*, u.name as user_name, u.email as user_email
       FROM items i
       LEFT JOIN users u ON i.user_id = u.id
       WHERE i.id = ?`,
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ message: 'Could not update status.' });
  }
};

// DELETE /api/items/:id
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const item = existing[0];
    const isOwner = req.user && item.user_id === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this post.' });
    }

    await pool.query('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Post deleted successfully.', id: Number(id) });
  } catch (err) {
    console.error('deleteItem error:', err);
    res.status(500).json({ message: 'Could not delete the post.' });
  }
};

// GET /api/categories
exports.getCategories = async (_req, res) => {
  res.json(CATEGORIES);
};
