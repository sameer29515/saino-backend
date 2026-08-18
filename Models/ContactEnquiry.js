const pool = require('../Config/db');

const ContactEnquiry = {
  // Create enquiry
  create: async (data) => {
    const { name, email, phone, subject, message } = data;
    const result = await pool.query(
      `INSERT INTO contact_enquiries (name, email, phone, subject, message) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, email, phone, subject, message]
    );
    return result.rows[0];
  },

  // Find all enquiries
  getAll: async () => {
    const result = await pool.query(
      'SELECT * FROM contact_enquiries ORDER BY created_at DESC'
    );
    return result.rows;
  },

  // Update status
  updateStatus: async (id, status) => {
    const result = await pool.query(
      'UPDATE contact_enquiries SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }
};

module.exports = ContactEnquiry;