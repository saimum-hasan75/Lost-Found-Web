const mysql = require('mysql2/promise');
require('dotenv').config();

// A connection pool is used (rather than a single connection) so the
// Express app can safely handle many simultaneous requests.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lost_and_found',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Quick sanity check on startup so connection problems fail loudly
// instead of surfacing as confusing errors on the first request.
pool
  .getConnection()
  .then((conn) => {
    console.log('MySQL connected successfully.');
    conn.release();
  })
  .catch((err) => {
    console.error('MySQL connection failed:', err.message);
  });

module.exports = pool;
