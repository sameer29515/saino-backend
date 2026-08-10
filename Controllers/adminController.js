const Partner = require("../Models/Partner");
const Location = require("../Models/Location");
const Service = require("../Models/Service");
const ContactEnquiry = require("../Models/ContactEnquiry");
const WebsiteContent = require("../Models/WebsiteContent");
const asyncHandler = require("../Utils/asyncHandler");
const ApiError = require("../Utils/ApiError");
const { CONTENT_SECTIONS, ENQUIRY_STATUS } = require("../Utils/constants");

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

// @desc    Dashboard summary counts
// @route   GET /api/admin/dashboard
// @access  Private (admin)
exports.getDashboard = asyncHandler(async (req, res) => {
  const [total, pending, approved, rejected, suspended, published, enquiries] = await Promise.all([
    Partner.countDocuments(),
    Partner.countDocuments({ status: "pending" }),
    Partner.countDocuments({ status: "approved" }),
    Partner.countDocuments({ status: "rejected" }),
    Partner.countDocuments({ status: "suspended" }),
    Partner.countDocuments({ isPublished: true }),
    ContactEnquiry.countDocuments({ status: "new" }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalPartners: total,
      pendingApprovals: pending,
      verifiedPartners: approved,
      rejectedPartners: rejected,
      suspendedPartners: suspended,
      publishedListings: published,
      newEnquiries: enquiries,
    },
  });
});

/* ------------------------------------------------------------------ */
/*  Partner listing management                                         */
/* ------------------------------------------------------------------ */

// @desc    List all partners with optional filters
// @route   GET /api/admin/partners?status=&providerType=&city=&search=&page=&limit=
// @access  Private (admin)
exports.getPartners = asyncHandler(async (req, res) => {
  const { status, providerType, city, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (providerType) filter.providerType = providerType;
  if (city) filter["location.city"] = new RegExp(`^${city}$`, "i");//^ for starting word city  || $ The entire string must be exactly city || i for case-insensitive||RegExp means Regular Expression.It is a JavaScript tool used to search for a pattern inside text.

  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { phone: new RegExp(search, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [partners, count] = await Promise.all([
    Partner.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Partner.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count,
    page: Number(page),
    pages: Math.ceil(count / Number(limit)),
    data: partners,
  });
});

// @desc    Get a single partner (full detail)
// @route   GET /api/admin/partners/:id
// @access  Private (admin)
exports.getPartnerById = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) throw new ApiError(404, "Partner not found");
  res.status(200).json({ success: true, data: partner });
});

// @desc    Admin edits any field on a partner's listing
// @route   PUT /api/admin/partners/:id
// @access  Private (admin)
exports.updatePartner = asyncHandler(async (req, res) => {
  const disallowed = ["password", "email", "status", "isVerified", "isPublished"];
  const updates = { ...req.body };
  disallowed.forEach((field) => delete updates[field]);

  const partner = await Partner.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!partner) throw new ApiError(404, "Partner not found");

  res.status(200).json({ success: true, message: "Partner updated", data: partner });
});

// @desc    Approve a pending listing -> publishes it on the public directory
// @route   PUT /api/admin/partners/:id/approve
// @access  Private (admin)
exports.approvePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.status = "approved";
  partner.isVerified = true;
  partner.isPublished = true;
  partner.rejectionReason = "";
  partner.reviewedAt = new Date();
  await partner.save();

  res.status(200).json({ success: true, message: "Partner approved and published", data: partner });
});

// @desc    Reject a pending listing so the partner can edit and resubmit
// @route   PUT /api/admin/partners/:id/reject
// @access  Private (admin)
exports.rejectPartner = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw new ApiError(400, "A rejection reason is required");

  const partner = await Partner.findById(req.params.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.status = "rejected";
  partner.isPublished = false;
  partner.rejectionReason = reason;
  partner.reviewedAt = new Date();
  await partner.save();

  res.status(200).json({ success: true, message: "Partner rejected", data: partner });
});

// @desc    Publish an approved listing (make visible on public site)
// @route   PUT /api/admin/partners/:id/publish
// @access  Private (admin)
exports.publishPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  if (partner.status !== "approved") {
    throw new ApiError(400, "Only approved partners can be published");
  }

  partner.isPublished = true;
  await partner.save();

  res.status(200).json({ success: true, message: "Partner published", data: partner });
});

// @desc    Hide a listing from the public directory without changing its status
// @route   PUT /api/admin/partners/:id/hide
// @access  Private (admin)
exports.hidePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.isPublished = false;
  await partner.save();

  res.status(200).json({ success: true, message: "Partner hidden from public site", data: partner });
});

// @desc    Suspend a partner account/listing entirely
// @route   PUT /api/admin/partners/:id/suspend
// @access  Private (admin)
exports.suspendPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) throw new ApiError(404, "Partner not found");

  partner.status = "suspended";
  partner.isPublished = false;
  await partner.save();

  res.status(200).json({ success: true, message: "Partner suspended", data: partner });
});

// @desc    Permanently delete a partner
// @route   DELETE /api/admin/partners/:id
// @access  Private (admin)
exports.deletePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findByIdAndDelete(req.params.id);
  if (!partner) throw new ApiError(404, "Partner not found");
  res.status(200).json({ success: true, message: "Partner deleted" });
});

/* ------------------------------------------------------------------ */
/*  Master data: Locations                                             */
/* ------------------------------------------------------------------ */

exports.getLocations = asyncHandler(async (req, res) => {
  const locations = await Location.find().sort({ province: 1, district: 1, city: 1 });
  res.status(200).json({ success: true, count: locations.length, data: locations });
});

exports.createLocation = asyncHandler(async (req, res) => {
  const { province, district, city } = req.body;
  if (!province || !district || !city) {
    throw new ApiError(400, "province, district and city are required");
  }
  const location = await Location.create({ province, district, city });
  res.status(201).json({ success: true, data: location });
});

exports.updateLocation = asyncHandler(async (req, res) => {
  const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!location) throw new ApiError(404, "Location not found");
  res.status(200).json({ success: true, data: location });
});

exports.deleteLocation = asyncHandler(async (req, res) => {
  const location = await Location.findByIdAndDelete(req.params.id);
  if (!location) throw new ApiError(404, "Location not found");
  res.status(200).json({ success: true, message: "Location deleted" });
});

/* ------------------------------------------------------------------ */
/*  Master data: Services                                              */
/* ------------------------------------------------------------------ */

exports.getServices = asyncHandler(async (req, res) => {
  const services = await Service.find().sort({ name: 1 });
  res.status(200).json({ success: true, count: services.length, data: services });
});

exports.createService = asyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;
  if (!name) throw new ApiError(400, "name is required");

  const exists = await Service.findOne({ name });
  if (exists) throw new ApiError(400, "This service already exists");

  const service = await Service.create({ name, description, icon });
  res.status(201).json({ success: true, data: service });
});

exports.updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) throw new ApiError(404, "Service not found");
  res.status(200).json({ success: true, data: service });
});

exports.deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw new ApiError(404, "Service not found");
  res.status(200).json({ success: true, message: "Service deleted" });
});

/* ------------------------------------------------------------------ */
/*  Contact enquiries                                                  */
/* ------------------------------------------------------------------ */

exports.getEnquiries = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const enquiries = await ContactEnquiry.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: enquiries.length, data: enquiries });
});

exports.updateEnquiry = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (status && !ENQUIRY_STATUS.includes(status)) {
    throw new ApiError(400, `status must be one of: ${ENQUIRY_STATUS.join(", ")}`);
  }

  const enquiry = await ContactEnquiry.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!enquiry) throw new ApiError(404, "Enquiry not found");
  res.status(200).json({ success: true, data: enquiry });
});

/* ------------------------------------------------------------------ */
/*  Website content management                                         */
/* ------------------------------------------------------------------ */

exports.getContentSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  if (!CONTENT_SECTIONS.includes(section)) {
    throw new ApiError(400, `section must be one of: ${CONTENT_SECTIONS.join(", ")}`);
  }

  let doc = await WebsiteContent.findOne({ section });
  if (!doc) doc = await WebsiteContent.create({ section, content: {} });

  res.status(200).json({ success: true, data: doc });
});

exports.updateContentSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  if (!CONTENT_SECTIONS.includes(section)) {
    throw new ApiError(400, `section must be one of: ${CONTENT_SECTIONS.join(", ")}`);
  }

  const doc = await WebsiteContent.findOneAndUpdate(
    { section },
    { content: req.body },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: "Content updated", data: doc });
});
