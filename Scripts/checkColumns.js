const pool = require('../Config/db');

async function run() {
  try {
    const r = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'partners' ORDER BY ordinal_position`
    );
    console.log('partners columns:', r.rows.map(c => c.column_name).join(', '));

    // Add rating and review_count if missing
    await pool.query(`
      ALTER TABLE partners
        ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 0.0,
        ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0
    `);
    console.log('✅ rating & review_count columns ensured');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}
run();
