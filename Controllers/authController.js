const pool = require("../Config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PROVIDER_TYPES } = require("../Utils/constants");

// Helper: Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// =============================================
// REGISTER PARTNER
// =============================================
exports.registerPartner = async (req, res) => {
  try {
    const { name, email, password, phone, providerType } = req.body;

    if (!name || !email || !password || !phone || !providerType) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!PROVIDER_TYPES.includes(providerType)) {
      return res.status(400).json({
        success: false,
        message: `providerType must be one of: ${PROVIDER_TYPES.join(", ")}`,
      });
    }

    // Check if email exists
    const existing = await pool.query(
      "SELECT * FROM partners WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO partners (name, email, password, phone, provider_type, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') 
       RETURNING id, name, email, status, provider_type, created_at`,
      [name, email.toLowerCase(), hashedPassword, phone, providerType]
    );

    const partner = result.rows[0];
    const token = generateToken(partner.id, "partner");

    res.status(201).json({
      success: true,
      message: "Account created successfully. Please wait for admin approval.",
      token,
      data: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        status: partner.status,
        providerType: partner.provider_type,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// =============================================
// LOGIN PARTNER
// =============================================
exports.loginPartner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM partners WHERE email = $1",
      [email.toLowerCase()]
    );

    const partner = result.rows[0];

    if (!partner) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isValid = await bcrypt.compare(password, partner.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (partner.status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Account pending approval. Please wait for admin approval.",
      });
    }

    if (partner.status === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Account rejected. Please contact admin.",
      });
    }

    const token = generateToken(partner.id, "partner");

    res.status(200).json({
      success: true,
      token,
      data: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        status: partner.status,
        providerType: partner.provider_type,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

// =============================================
// LOGIN ADMIN
// =============================================
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM admins WHERE email = $1",
      [email.toLowerCase()]
    );

    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(admin.id, admin.role);

    res.status(200).json({
      success: true,
      token,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

// =============================================
// GET CURRENT USER
// =============================================
exports.getMe = async (req, res) => {
  try {
    const { id, role } = req.user;

    let result;
    if (role === "admin" || role === "superadmin") {
      result = await pool.query(
        "SELECT id, name, email, role FROM admins WHERE id = $1",
        [id]
      );
    } else {
      result = await pool.query(
        `SELECT id, name, email, phone, provider_type, status, is_published, created_at 
         FROM partners WHERE id = $1`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get user",
    });
  }
};