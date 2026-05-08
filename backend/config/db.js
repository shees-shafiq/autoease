const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autoease_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // SSL config for AWS RDS
  ...(process.env.NODE_ENV === 'production' && {
    ssl: { rejectUnauthorized: false }
  })
});

const db = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Database connected successfully');
  connection.release();
});

module.exports = db;
