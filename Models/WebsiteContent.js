const pool = require('../Config/db');

const WebsiteContent = {
  // Get content by section
  findBySection: async (section) => {
    const result = await pool.query(
      'SELECT * FROM website_contents WHERE section = $1',
      [section]
    );
    return result.rows[0];
  },

  // Create or update content
  upsert: async (section, content) => {
    const result = await pool.query(
      `INSERT INTO website_contents (section, content) 
       VALUES ($1, $2) 
       ON CONFLICT (section) 
       DO UPDATE SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [section, JSON.stringify(content)]
    );
    return result.rows[0];
  }
};

module.exports = WebsiteContent;