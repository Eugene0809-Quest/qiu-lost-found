require('dotenv').config();
const mysql = require('mysql2/promise');

// Railway gives us MYSQL_URL — use it directly if available
const pool = process.env.MYSQL_URL
  ? mysql.createPool({
      uri: process.env.MYSQL_URL,
      waitForConnections: true,
      connectionLimit: 10,
      ssl: { rejectUnauthorized: false }
    })
  : mysql.createPool({
      host:     process.env.DB_HOST || 'localhost',
      port:     Number(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lost_found_db',
      waitForConnections: true,
      connectionLimit: 10,
    });

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
  }
})();

module.exports = pool;