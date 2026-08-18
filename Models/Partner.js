const pool = require('../Config/db');
const bcrypt = require('bcryptjs');

const Partner = {
  // Find by email
  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM partners WHERE email = $1', [email]);
    return result.rows[0];
  },

  // Find by ID
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM partners WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Create new partner
  create: async (data) => {
    const { name, email, password, phone, providerType } = data;
    const result = await pool.query(
      `INSERT INTO partners (name, email, password, phone, provider_type, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') 
       RETURNING *`,
      [name, email, password, phone, providerType]
    );
    return result.rows[0];
  },

  // Update partner
  update: async (id, data) => {
    const fields = [];
    const values = [];
    let index = 1;

    if (data.name) { fields.push(`name = $${index}`); values.push(data.name); index++; }
    if (data.phone) { fields.push(`phone = $${index}`); values.push(data.phone); index++; }
    if (data.website) { fields.push(`website = $${index}`); values.push(data.website); index++; }
    if (data.about) { fields.push(`about = $${index}`); values.push(data.about); index++; }
    if (data.providerType) { fields.push(`provider_type = $${index}`); values.push(data.providerType); index++; }
    if (data.status) { fields.push(`status = $${index}`); values.push(data.status); index++; }

    values.push(id);
    const query = `UPDATE partners SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get all approved partners
  findApproved: async () => {
    const result = await pool.query(
      'SELECT * FROM partners WHERE status = $1 AND is_published = $2',
      ['approved', true]
    );
    return result.rows;
  },

  // Search partners with filters
  search: async (filters) => {
    let query = 'SELECT * FROM partners WHERE status = $1 AND is_published = $2';
    let values = ['approved', true];
    let index = 3;

    // Add filters
    if (filters.country) {
      query += ` AND country = $${index}`;
      values.push(filters.country);
      index++;
    }

    if (filters.city) {
      query += ` AND city = $${index}`;
      values.push(filters.city);
      index++;
    }

    if (filters.providerType) {
      query += ` AND provider_type = $${index}`;
      values.push(filters.providerType);
      index++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${index} OR about ILIKE $${index})`;
      values.push(`%${filters.search}%`);
      index++;
    }

    const result = await pool.query(query, values);
    return result.rows;
  },

  // Update status
  updateStatus: async (id, status) => {
    const result = await pool.query(
      'UPDATE partners SET status = $1, is_published = $2 WHERE id = $3 RETURNING *',
      [status, status === 'approved', id]
    );
    return result.rows[0];
  },

  // Check if profile is complete
  isProfileComplete: async (id) => {
    const result = await pool.query(
      `SELECT * FROM partners WHERE id = $1 
       AND name IS NOT NULL 
       AND phone IS NOT NULL 
       AND provider_type IS NOT NULL 
       AND country IS NOT NULL`,
      [id]
    );
    return result.rows.length > 0;
  }
};

module.exports = Partner;