const pool = require('../Config/db');

const Location = {
  // Create location
  create: async (data) => {
    const { partner_id, address, city, district, province } = data;
    const result = await pool.query(
      `INSERT INTO locations (partner_id, address, city, district, province) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [partner_id, address, city, district, province]
    );
    return result.rows[0];
  },

  // Find by partner ID
  findByPartnerId: async (partnerId) => {
    const result = await pool.query(
      'SELECT * FROM locations WHERE partner_id = $1',
      [partnerId]
    );
    return result.rows;
  },

  // Update location
  update: async (id, data) => {
    const { address, city, district, province } = data;
    const result = await pool.query(
      `UPDATE locations 
       SET address = COALESCE($1, address), 
           city = COALESCE($2, city), 
           district = COALESCE($3, district), 
           province = COALESCE($4, province),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [address, city, district, province, id]
    );
    return result.rows[0];
  },

  // Delete location
  delete: async (id) => {
    const result = await pool.query(
      'DELETE FROM locations WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // Get all locations (for filters)
  getAll: async () => {
    const result = await pool.query(
      'SELECT DISTINCT city, district, province FROM locations ORDER BY province, district, city'
    );
    return result.rows;
  }
};

module.exports = Location;