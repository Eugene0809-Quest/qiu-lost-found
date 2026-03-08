require('dotenv').config();
const mysql = require('mysql2/promise');

const isProduction = process.env.NODE_ENV === 'production';

const pool = mysql.createPool(
  isProduction
    ? {
        host:     process.env.DB_HOST,
        port:     3306,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl:      { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit:    10,
      }
    : {
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT || 3306,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit:    10,
      }
);

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