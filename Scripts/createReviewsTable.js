const pool = require('../Config/db');

async function createReviewsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id          SERIAL PRIMARY KEY,
        partner_id  INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        reviewer_name VARCHAR(100) NOT NULL,
        rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment     TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_reviews_partner_id ON reviews(partner_id);
    `);
    console.log('✅ reviews table created (or already exists)');
  } catch (err) {
    console.error('❌ Error creating reviews table:', err.message);
  } finally {
    process.exit();
  }
}

createReviewsTable();
