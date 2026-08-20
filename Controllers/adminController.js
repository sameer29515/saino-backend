const pool = require("../Config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 1. Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const result = await pool.query("SELECT * FROM admins WHERE email = $1", [email.toLowerCase()]);
    const admin = result.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(400).json({ success: false, message: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      data: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 2. Get All Partners
exports.getAllPartners = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM partners ORDER BY created_at DESC");
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 3. Update Partner Status (Approve / Reject)
exports.updatePartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    const isPublished = status === "approved";

    const result = await pool.query(
      `UPDATE partners 
       SET status = $1, rejection_reason = $2, is_published = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 RETURNING *`,
      [status, status === "rejected" ? rejection_reason : null, isPublished, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    res.json({ success: true, message: "Status updated successfully", partner: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 4. Delete Partner
exports.deletePartner = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM partners WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    res.json({ success: true, message: "Partner deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};