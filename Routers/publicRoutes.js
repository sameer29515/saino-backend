const express = require("express");
const router = express.Router();
const {
  getPartners,
  getPartnerById,
  getProviderTypes,
  getServices,
  getLocations,
  getContentSection,
  submitEnquiry,
  searchPartners,      // ✅ Add this
  getCountries,        // ✅ Add this
} = require("../Controllers/publicController");

// Healthcare Partners directory
router.get("/partners", getPartners);
router.get("/partners/:id", getPartnerById);

// ✅ NEW: Search Engine API
router.get("/search", searchPartners);
router.get("/countries", getCountries);

// Filter option lists
router.get("/provider-types", getProviderTypes);
router.get("/services", getServices);
router.get("/locations", getLocations);

// Managed website content
router.get("/content/:section", getContentSection);

// Contact form
router.post("/contact", submitEnquiry);

module.exports = router;