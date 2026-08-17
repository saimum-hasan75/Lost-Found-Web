const pool = require('./db');

async function migrate() {
  try {
    // 1. Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(30),
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_email (email),
        INDEX idx_user_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure password column exists (if previously named password_hash)
    try {
      const [pwdCols] = await pool.query("SHOW COLUMNS FROM users LIKE 'password'");
      if (pwdCols.length === 0) {
        // If password_hash exists, add or rename to password
        const [hashCols] = await pool.query("SHOW COLUMNS FROM users LIKE 'password_hash'");
        if (hashCols.length > 0) {
          await pool.query("ALTER TABLE users CHANGE COLUMN password_hash password VARCHAR(255) NOT NULL");
        } else {
          await pool.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL AFTER email");
        }
      }
    } catch (e) {
      console.log('Password column check:', e.message);
    }

    // 2. Ensure items table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_type ENUM('lost', 'found') NOT NULL,
        title VARCHAR(150) NOT NULL,
        category VARCHAR(60) NOT NULL,
        description TEXT,
        location VARCHAR(150) NOT NULL,
        date_occurred DATE NOT NULL,
        contact_name VARCHAR(100) NOT NULL,
        contact_email VARCHAR(150) NOT NULL,
        contact_phone VARCHAR(30),
        image_url VARCHAR(255),
        status ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
        user_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post_type (post_type),
        INDEX idx_category (category),
        INDEX idx_status (status),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Add user_id column to items table if missing
    try {
      const [cols] = await pool.query("SHOW COLUMNS FROM items LIKE 'user_id'");
      if (cols.length === 0) {
        await pool.query("ALTER TABLE items ADD COLUMN user_id INT NULL AFTER status");
      }
    } catch (e) {
      console.log('Migration note (user_id column check):', e.message);
    }

    // 4. Upsert/seed default admin & user accounts with plain text passwords
    const [adminRows] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
    if (adminRows.length === 0) {
      await pool.query(
        'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        ['Admin System', 'admin@example.com', 'admin123', 'admin', '01700-000000']
      );
      console.log('Default admin seeded: admin@example.com / admin123 (Role: admin)');
    } else {
      // Update password to plain text admin123
      await pool.query("UPDATE users SET password = 'admin123', role = 'admin' WHERE email = 'admin@example.com'");
    }

    const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', ['user@example.com']);
    let demoUserId = null;
    if (userRows.length === 0) {
      const [uRes] = await pool.query(
        'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        ['Alex Johnson', 'user@example.com', 'user123', 'user', '01700-000001']
      );
      demoUserId = uRes.insertId;
      console.log('Default user seeded: user@example.com / user123 (Role: user)');
    } else {
      demoUserId = userRows[0].id;
      // Update password to plain text user123
      await pool.query("UPDATE users SET password = 'user123', role = 'user' WHERE email = 'user@example.com'");
    }

    // Link any orphaned items to demo user
    if (demoUserId) {
      await pool.query('UPDATE items SET user_id = ? WHERE user_id IS NULL', [demoUserId]);
    }

    console.log('Database migration & seeding completed.');
  } catch (err) {
    console.error('Database migration error:', err.message);
  }
}

module.exports = migrate;
