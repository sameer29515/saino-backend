const Partner = require("../Models/Partner");
const asyncHandler = require("../Utils/asyncHandler");
const ApiError = require("../Utils/ApiError");
const { PROVIDER_TYPES, SERVICE_TYPES } = require("../Utils/constants");

// @desc    Get logged-in partner's own profile
// @route   GET /api/partner/profile
// @access  Private (partner)
exports.getMyProfile = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.user.id);
  if (!partner) throw new ApiError(404, "Partner not found");
  res.status(200).json({ success: true, data: partner });
});

// @desc    Update basic profile info (✅ COMPLETE FIX)
// @route   PUT /api/partner/profile
// @access  Private (partner)
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, website, about, providerType, location, services } = req.body;

  if (providerType && !PROVIDER_TYPES.includes(providerType)) {
    throw new ApiError(400, `providerType must be one of: ${PROVIDER_TYPES.join(", ")}`);
  }

  const partner = await Partner.findById(req.user.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  if (partner.status === "approved" || partner.status === "pending") {
    partner.status = "pending";
    partner.isPublished = false;
  }

  if (name !== undefined) partner.name = name;
  if (phone !== undefined) partner.phone = phone;
  if (website !== undefined) partner.website = website;
  if (about !== undefined) partner.about = about;
  if (providerType !== undefined) partner.providerType = providerType;

  // ✅ Location update
  if (location) {
    partner.location = {
      address: location.address || partner.location.address,
      city: location.city || partner.location.city,
      district: location.district || partner.location.district,
      province: location.province || partner.location.province,
    };
  }

  // ✅ Services update
  if (services && Array.isArray(services) && services.length > 0) {
    const invalid = services.filter((s) => !SERVICE_TYPES.includes(s));
    if (invalid.length === 0) {
      partner.services = [...new Set(services)];
    }
  }

  await partner.save();
  res.status(200).json({ success: true, message: "Profile updated", data: partner });
});

// @desc    Upload / replace partner logo
// @route   POST /api/partner/profile/logo
// @access  Private (partner)
exports.uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No logo file uploaded");

  const partner = await Partner.findById(req.user.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.logo = `/uploads/logos/${req.file.filename}`;
  await partner.save();

  res.status(200).json({ success: true, message: "Logo uploaded", data: { logo: partner.logo } });
});

// @desc    Upload verification documents (registration/license/etc.)
// @route   POST /api/partner/verification/documents
// @access  Private (partner)
exports.uploadVerificationDocuments = asyncHandler(async (req, res) => {
  const { registrationNumber, licenseNumber } = req.body;

  const partner = await Partner.findById(req.user.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  if (registrationNumber !== undefined) partner.verification.registrationNumber = registrationNumber;
  if (licenseNumber !== undefined) partner.verification.licenseNumber = licenseNumber;

  if (req.files && req.files.length > 0) {
    const paths = req.files.map((f) => `/uploads/documents/${f.filename}`);
    partner.verification.documents.push(...paths);
  }

  await partner.save();
  res.status(200).json({
    success: true,
    message: "Verification info updated",
    data: partner.verification,
  });
});

// @desc    Update location & branches
// @route   PUT /api/partner/location
// @access  Private (partner)
exports.updateLocation = asyncHandler(async (req, res) => {
  const { address, city, district, province, branches } = req.body;

  const partner = await Partner.findById(req.user.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.location = {
    address: address ?? partner.location.address,
    city: city ?? partner.location.city,
    district: district ?? partner.location.district,
    province: province ?? partner.location.province,
  };

  if (Array.isArray(branches)) {
    partner.branches = branches;
  }

  await partner.save();
  res.status(200).json({ success: true, message: "Location updated", data: partner.location });
});

// @desc    Update offered services
// @route   PUT /api/partner/services
// @access  Private (partner)
exports.updateServices = asyncHandler(async (req, res) => {
  const { services } = req.body;

  if (!Array.isArray(services) || services.length === 0) {
    throw new ApiError(400, "services must be a non-empty array");
  }

  const invalid = services.filter((s) => !SERVICE_TYPES.includes(s));
  if (invalid.length > 0) {
    throw new ApiError(400, `Invalid service(s): ${invalid.join(", ")}. Allowed: ${SERVICE_TYPES.join(", ")}`);
  }

  const partner = await Partner.findById(req.user.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.services = [...new Set(services)];
  await partner.save();

  res.status(200).json({ success: true, message: "Services updated", data: partner.services });
});

// @desc    Submit the profile for Saino admin review
// @route   POST /api/partner/submit
// @access  Private (partner)
exports.submitForApproval = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.user.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  if (partner.status === "pending") {
    throw new ApiError(400, "Your listing is already pending review");
  }
  if (partner.status === "approved") {
    throw new ApiError(400, "Your listing is already approved");
  }
  if (partner.status === "suspended") {
    throw new ApiError(400, "Your account is suspended. Contact Saino support.");
  }

  if (!partner.isProfileComplete()) {
    throw new ApiError(
      400,
      "Please complete your profile (name, phone, provider type, address, city and at least one service) before submitting"
    );
  }

  partner.status = "pending";
  partner.submittedAt = new Date();
  partner.rejectionReason = "";
  await partner.save();

  res.status(200).json({
    success: true,
    message: "Listing submitted for review. You will be notified once Saino reviews it.",
    data: { status: partner.status, submittedAt: partner.submittedAt },
  });
});

// @desc    Get current listing status
// @route   GET /api/partner/status
// @access  Private (partner)
exports.getStatus = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.user.id).select(
    "status isVerified isPublished rejectionReason submittedAt reviewedAt"
  );
  if (!partner) throw new ApiError(404, "Partner not found");
  res.status(200).json({ success: true, data: partner });
});