const { Pool } = require('pg');
require('dotenv').config();

// ✅ Parse DATABASE_URL manually
const DATABASE_URL = process.env.DATABASE_URL;

// If DATABASE_URL exists, use it; otherwise use individual variables
let poolConfig;

if (DATABASE_URL) {
  poolConfig = {
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'saino123',
    database: process.env.DB_NAME || 'saino',
  };
}

const pool = new Pool(poolConfig);

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
  } else {
    console.log('✅ PostgreSQL connected successfully');
    release();
  }
});

module.exports = pool;