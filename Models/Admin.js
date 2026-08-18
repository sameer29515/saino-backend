const pool = require('../Config/db');
const bcrypt = require('bcryptjs');

const Admin = {
  // Find by email
  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    return result.rows[0];
  },

  // Create admin
  create: async (data) => {
    const { name, email, password, role } = data;
    const result = await pool.query(
      `INSERT INTO admins (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, email, password, role || 'admin']
    );
    return result.rows[0];
  }
};

module.exports = Admin;