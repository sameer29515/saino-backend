const Partner = require("../Models/Partner");
const Admin = require("../Models/Admin");
const asyncHandler = require("../Utils/asyncHandler");
const ApiError = require("../Utils/ApiError");
const generateToken = require("../Utils/generateToken");
const { PROVIDER_TYPES } = require("../Utils/constants");

// @desc    Register a new healthcare partner account
// @route   POST /api/auth/partner/register
// @access  Public
exports.registerPartner = asyncHandler(async (req, res) => {
  const { name, email, password, phone, providerType } = req.body;

  if (!name || !email || !password || !phone || !providerType) {
    throw new ApiError(400, "name, email, password, phone and providerType are required");
  }

  if (!PROVIDER_TYPES.includes(providerType)) {
    throw new ApiError(400, `providerType must be one of: ${PROVIDER_TYPES.join(", ")}`);
  }

  const existing = await Partner.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(400, "An account with this email already exists");
  }

  const partner = await Partner.create({ name, email, password, phone, providerType });

  const token = generateToken(partner._id, "partner");
  res.status(201).json({
    success: true,
    message: "Account created successfully. Please complete your profile.",
    token,
    data: {
      id: partner._id,
      name: partner.name,
      email: partner.email,
      status: partner.status,
    },
  });
});

// @desc    Login as a healthcare partner
// @route   POST /api/auth/partner/login
// @access  Public
exports.loginPartner = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const partner = await Partner.findOne({ email: email.toLowerCase() }).select("+password");
  if (!partner || !(await partner.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
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
    },
  });
});

// @desc    Login as Saino admin / super admin
// @route   POST /api/auth/admin/login
// @access  Public
exports.loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
  if (!admin || !(await admin.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
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
});

// @desc    Get the currently authenticated user (partner or admin)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const { role, doc } = req.user;
  res.status(200).json({
    success: true,
    data: { role, ...doc.toObject() },
  });
});
