const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  updateProfile,
  uploadLogo,
  uploadVerificationDocuments,
  updateLocation,
  updateServices,
  submitForApproval,
  getStatus,
} = require("../Controllers/partnerController");
const { protect, authorize } = require("../Middlewares/auth");
const { uploadLogo: uploadLogoMiddleware, uploadDocuments } = require("../Middlewares/upload");

// Every route below requires a logged-in partner
router.use(protect, authorize("partner"));

router.get("/profile", getMyProfile);
router.put("/profile", updateProfile);
router.post("/profile/logo", uploadLogoMiddleware, uploadLogo);

router.post("/verification/documents", uploadDocuments, uploadVerificationDocuments);

router.put("/location", updateLocation);
router.put("/services", updateServices);

router.post("/submit", submitForApproval);
router.get("/status", getStatus);

module.exports = router;
