const express = require("express");
const router = express.Router();
const {
  getDashboard,
  getPartners,
  getPartnerById,
  updatePartner,
  approvePartner,
  rejectPartner,
  publishPartner,
  hidePartner,
  suspendPartner,
  deletePartner,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getServices,
  createService,
  updateService,
  deleteService,
  getEnquiries,
  updateEnquiry,
  getContentSection,
  updateContentSection,
} = require("../Controllers/adminController");
const { protect, authorize } = require("../Middlewares/auth");

// Every route below requires a logged-in admin / superadmin
router.use(protect, authorize("admin", "superadmin"));

router.get("/dashboard", getDashboard);

// Partners
router.get("/partners", getPartners);
router.get("/partners/:id", getPartnerById);
router.put("/partners/:id", updatePartner);
router.put("/partners/:id/approve", approvePartner);
router.put("/partners/:id/reject", rejectPartner);
router.put("/partners/:id/publish", publishPartner);
router.put("/partners/:id/hide", hidePartner);
router.put("/partners/:id/suspend", suspendPartner);
router.delete("/partners/:id", deletePartner);

// Master data: Locations
router.get("/locations", getLocations);
router.post("/locations", createLocation);
router.put("/locations/:id", updateLocation);
router.delete("/locations/:id", deleteLocation);

// Master data: Services
router.get("/services", getServices);
router.post("/services", createService);
router.put("/services/:id", updateService);
router.delete("/services/:id", deleteService);

// Contact enquiries
router.get("/enquiries", getEnquiries);
router.put("/enquiries/:id", updateEnquiry);

// Website content
router.get("/content/:section", getContentSection);
router.put("/content/:section", updateContentSection);

module.exports = router;
