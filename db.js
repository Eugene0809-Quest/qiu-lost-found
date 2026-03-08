require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  ssl:                { rejectUnauthorized: false },
  connectTimeout:     30000,
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    console.log('   Host:', process.env.DB_HOST);
    console.log('   Port:', process.env.DB_PORT);
    console.log('   DB:  ', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Host:', process.env.DB_HOST);
    console.error('   Port:', process.env.DB_PORT);
  }
})();