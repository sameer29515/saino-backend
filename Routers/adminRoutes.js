const express = require("express");
const router = express.Router();
const {
  adminLogin,
  getAllPartners,
  updatePartnerStatus,
} = require("../Controllers/adminController");
const { protect, authorize } = require("../Middlewares/auth");

// ✅ Public Admin Route (Login)
router.post("/login", adminLogin);

// ✅ Protected Routes (Requires Admin Token)
router.use(protect, authorize("admin", "superadmin"));

router.get("/partners", getAllPartners);
router.put("/partners/:id/status", updatePartnerStatus);

module.exports = router;