const express = require("express");
const router = express.Router();
const {
  registerPartner,
  loginPartner,
  loginAdmin,
  getMe,
} = require("../Controllers/authController");
const { protect } = require("../Middlewares/auth");

router.post("/partner/register", registerPartner);
router.post("/partner/login", loginPartner);
router.post("/admin/login", loginAdmin);
router.get("/me", protect, getMe);

module.exports = router;
