const express = require("express");
const router = express.Router();
const {
  getPartnerById,
  getMyProfile,
  updateProfile,
  uploadLogo,
  uploadVerificationDocuments,
  updateLocation,
  updateServices,
  submitForApproval,
  getStatus,
  getDashboard,
} = require("../Controllers/partnerController");

const { protect, authorize } = require("../Middlewares/auth");
const { uploadLogo: uploadLogoMiddleware, uploadDocuments } = require("../Middlewares/upload");

// ✅ Protected routes — each has protect + authorize middleware inline
router.get("/dashboard", protect, authorize("partner"), getDashboard);
router.get("/profile", protect, authorize("partner"), getMyProfile);
router.put("/profile", protect, authorize("partner"), updateProfile);
router.post("/profile/logo", protect, authorize("partner"), uploadLogoMiddleware, uploadLogo);
router.post("/verification/documents", protect, authorize("partner"), uploadDocuments, uploadVerificationDocuments);
router.put("/location", protect, authorize("partner"), updateLocation);
router.put("/services", protect, authorize("partner"), updateServices);
router.post("/submit", protect, authorize("partner"), submitForApproval);
router.get("/status", protect, authorize("partner"), getStatus);

module.exports = router;