const jwt = require("jsonwebtoken");
const pool = require("../Config/db");

// protect: verifies the JWT token and attaches user to req.user
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token is invalid or expired",
      });
    }

    // Query PostgreSQL instead of Mongoose
    let userDoc;
    if (decoded.role === "partner") {
      const result = await pool.query(
        "SELECT * FROM partners WHERE id = $1",
        [decoded.id]
      );
      userDoc = result.rows[0];
    } else if (decoded.role === "admin" || decoded.role === "superadmin") {
      const result = await pool.query(
        "SELECT * FROM admins WHERE id = $1",
        [decoded.id]
      );
      userDoc = result.rows[0];
    }

    if (!userDoc) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user no longer exists",
      });
    }

    req.user = { id: decoded.id, role: decoded.role, doc: userDoc };
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
};

// authorize: restricts route to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you do not have access to this resource",
      });
    }
    next();
  };
};