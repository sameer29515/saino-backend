const Partner = require("../Models/Partner");
const Location = require("../Models/Location");
const Service = require("../Models/Service");
const ContactEnquiry = require("../Models/ContactEnquiry");
const WebsiteContent = require("../Models/WebsiteContent");
const asyncHandler = require("../Utils/asyncHandler");
const ApiError = require("../Utils/ApiError");
const { CONTENT_SECTIONS, PROVIDER_TYPES } = require("../Utils/constants");

// Fields safe to expose publicly for a partner listing (no email/password/verification docs)
const PUBLIC_FIELDS =
  "name logo phone website about providerType location branches services createdAt";

// @desc    Search / filter the public healthcare partner directory
// @route   GET /api/public/partners?search=&location=&providerType=&service=&page=&limit=
// @access  Public
exports.getPartners = asyncHandler(async (req, res) => {
  const { search, location, providerType, service, page = 1, limit = 12 } = req.query;

  const filter = { status: "approved", isPublished: true };

  if (providerType) filter.providerType = providerType;
  if (service) filter.services = service;
  if (location) {
    const locationRegex = new RegExp(location, "i");
    filter.$or = [
      { "location.city": locationRegex },
      { "location.district": locationRegex },
      { "location.province": locationRegex },
    ];
  }
  if (search) {
    const searchRegex = new RegExp(search, "i");
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [{ name: searchRegex }, { about: searchRegex }, { "location.city": searchRegex }],
    });
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [partners, count] = await Promise.all([
    Partner.find(filter).select(PUBLIC_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
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

// @desc    Get a single published partner's public profile
// @route   GET /api/public/partners/:id
// @access  Public
exports.getPartnerById = asyncHandler(async (req, res) => {
  const partner = await Partner.findOne({
    _id: req.params.id,
    status: "approved",
    isPublished: true,
  }).select(PUBLIC_FIELDS);

  if (!partner) throw new ApiError(404, "Listing not found or not published");

  res.status(200).json({ success: true, data: partner });
});

// @desc    Get provider type categories (for the filter UI)
// @route   GET /api/public/provider-types
// @access  Public
exports.getProviderTypes = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: PROVIDER_TYPES });
});

// @desc    Get active services catalog (for the filter UI)
// @route   GET /api/public/services
// @access  Public
exports.getServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ success: true, data: services });
});

// @desc    Get locations list (for the filter UI)
// @route   GET /api/public/locations
// @access  Public
exports.getLocations = asyncHandler(async (req, res) => {
  const locations = await Location.find().sort({ province: 1, district: 1, city: 1 });
  res.status(200).json({ success: true, data: locations });
});

// @desc    Get managed content for a website section (homepage, solutions, about, contact)
// @route   GET /api/public/content/:section
// @access  Public
exports.getContentSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  if (!CONTENT_SECTIONS.includes(section)) {
    throw new ApiError(400, `section must be one of: ${CONTENT_SECTIONS.join(", ")}`);
  }

  const doc = await WebsiteContent.findOne({ section });
  res.status(200).json({ success: true, data: doc ? doc.content : {} });
});

// @desc    Submit the public Contact form
// @route   POST /api/public/contact
// @access  Public
exports.submitEnquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    throw new ApiError(400, "name, email and message are required");
  }

  const enquiry = await ContactEnquiry.create({ name, email, phone, subject, message });
  res.status(201).json({
    success: true,
    message: "Thank you, we received your message and will get back to you soon.",
    data: { id: enquiry._id },
  });
});
