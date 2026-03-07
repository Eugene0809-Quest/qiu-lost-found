// db.js — MySQL connection pool using environment variables
// WHY: We use a pool (not single connection) so multiple users
//      can query the DB at the same time without waiting.
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,       // max 10 simultaneous queries
  queueLimit:         0
});

// Test the connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1); // stop server if DB can't connect
  }
})();

module.exports = pool;
