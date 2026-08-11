const Partner = require("../Models/Partner");
const Admin = require("../Models/Admin");
const ApiError = require("../Utils/ApiError");
const generateToken = require("../Utils/generateToken");
const { PROVIDER_TYPES } = require("../Utils/constants");

// @desc    Register a new healthcare partner account (Direct Pending Status)
// @route   POST /api/auth/partner/register
// @access  Public
exports.registerPartner = async (req, res) => {
  try {
    const { name, email, password, phone, providerType } = req.body;

    if (!name || !email || !password || !phone || !providerType) {
      return res.status(400).json({
        success: false,
        message: "name, email, password, phone and providerType are required"
      });
    }

    if (!PROVIDER_TYPES.includes(providerType)) {
      return res.status(400).json({
        success: false,
        message: `providerType must be one of: ${PROVIDER_TYPES.join(", ")}`
      });
    }

    const existing = await Partner.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists"
      });
    }

    // ✅ Status ko direct 'pending' set kar diya taake Admin Dashboard pe foran show ho
    const partner = await Partner.create({ 
      name, 
      email: email.toLowerCase(), 
      password, 
      phone, 
      providerType,
      status: "pending", 
      submittedAt: new Date()
    });

    const token = generateToken(partner._id, "partner");
    
    res.status(201).json({
      success: true,
      message: "Account created successfully. Please wait for admin approval.",
      token,
      data: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        status: partner.status,
        role: "partner"
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed. Please try again."
    });
  }
};

// @desc    Login as a healthcare partner (Strict Approved Check)
// @route   POST /api/auth/partner/login
// @access  Public
exports.loginPartner = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required"
      });
    }

    const partner = await Partner.findOne({ email: email.toLowerCase() }).select("+password");
    if (!partner || !(await partner.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // ✅ SIRF APPROVED PARTNERS KO LOGIN KA ACCESS MILEGA
    if (partner.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: partner.status === "pending"
          ? "Account pending approval. Please wait for admin to approve your account."
          : "Account rejected. Please contact admin."
      });
    }

    const token = generateToken(partner._id, "partner");
    res.status(200).json({
      success: true,
      token,
      data: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        status: partner.status,
        isPublished: partner.isPublished,
        role: "partner"
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed. Please try again."
    });
  }
};

// @desc    Login as Saino admin / super admin
// @route   POST /api/auth/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required"
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = generateToken(admin._id, admin.role);
    res.status(200).json({
      success: true,
      token,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed. Please try again."
    });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user profile",
    });
  }
};