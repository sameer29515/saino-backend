const pool = require('../Config/db');

const Service = {
  // Create service
  create: async (data) => {
    const { partner_id, name, price } = data;
    const result = await pool.query(
      `INSERT INTO services (partner_id, name, price) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [partner_id, name, price]
    );
    return result.rows[0];
  },

  // Find by partner ID
  findByPartnerId: async (partnerId) => {
    const result = await pool.query(
      'SELECT * FROM services WHERE partner_id = $1',
      [partnerId]
    );
    return result.rows;
  },

  // Update service
  update: async (id, data) => {
    const { name, price } = data;
    const result = await pool.query(
      `UPDATE services 
       SET name = COALESCE($1, name), 
           price = COALESCE($2, price)
       WHERE id = $3 
       RETURNING *`,
      [name, price, id]
    );
    return result.rows[0];
  },

  // Delete service
  delete: async (id) => {
    const result = await pool.query(
      'DELETE FROM services WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // Get all active services
  getAll: async () => {
    const result = await pool.query(
      'SELECT DISTINCT name FROM services ORDER BY name'
    );
    return result.rows;
  }
};

module.exports = Service;