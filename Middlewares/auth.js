const jwt = require("jsonwebtoken");
const asyncHandler = require("../Utils/asyncHandler");
const ApiError = require("../Utils/ApiError");
const Partner = require("../Models/Partner");
const Admin = require("../Models/Admin");

// protect: verifies the JWT sent in the Authorization header (Bearer <token>)
// and attaches the authenticated user to req.user as { id, role, doc }
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Not authorized, token is invalid or expired");
  }

  let userDoc;
  if (decoded.role === "partner") {
    userDoc = await Partner.findById(decoded.id);
  } else if (decoded.role === "admin" || decoded.role === "superadmin") {
    userDoc = await Admin.findById(decoded.id);
  }

  if (!userDoc) {
    throw new ApiError(401, "Not authorized, user no longer exists");
  }

  req.user = { id: decoded.id, role: decoded.role, doc: userDoc };
  next();
});

// authorize: restricts a route to the given roles.
// Usage: authorize("admin", "superadmin")
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "Forbidden: you do not have access to this resource");
    }
    next();
  };
};
