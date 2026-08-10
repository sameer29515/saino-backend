const jwt = require("jsonwebtoken");

// Encodes { id, role } into a signed JWT.
// role is one of: "partner", "admin", "superadmin"
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
