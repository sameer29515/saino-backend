const Partner = require("../Models/Partner");
const Location = require("../Models/Location");
const Service = require("../Models/Service");
const ContactEnquiry = require("../Models/ContactEnquiry");
const WebsiteContent = require("../Models/WebsiteContent");
const asyncHandler = require("../Utils/asyncHandler");
const ApiError = require("../Utils/ApiError");
const { CONTENT_SECTIONS, PROVIDER_TYPES } = require("../Utils/constants");

const PUBLIC_FIELDS =
  "name logo phone website about providerType country location branches services createdAt marketplace";

// ============ SEARCH ENGINE API ============

exports.searchPartners = asyncHandler(async (req, res) => {
  const { query, country, city, providerType, service, page = 1, limit = 12 } = req.query;

  const filter = { status: "approved", isPublished: true };

  if (country) filter.country = country;
  if (providerType) filter.providerType = providerType;
  if (service) filter.services = service;
  if (city) filter["location.city"] = new RegExp(city, "i");

  if (query) {
    const searchRegex = new RegExp(query, "i");
    filter.$or = [
      { name: searchRegex },
      { about: searchRegex },
      { "location.city": searchRegex },
      { "location.district": searchRegex },
      { "location.province": searchRegex },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [partners, count] = await Promise.all([
    Partner.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ 'marketplace.rating': -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
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

exports.getCountries = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: ['Nepal', 'India', 'UAE']
  });
});

// ============ EXISTING PUBLIC APIS ============

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

exports.getPartnerById = asyncHandler(async (req, res) => {
  const partner = await Partner.findOne({
    _id: req.params.id,
    status: "approved",
    isPublished: true,
  }).select(PUBLIC_FIELDS);

  if (!partner) throw new ApiError(404, "Listing not found or not published");
  res.status(200).json({ success: true, data: partner });
});

exports.getProviderTypes = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: PROVIDER_TYPES });
});

exports.getServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json({ success: true, data: services });
});

exports.getLocations = asyncHandler(async (req, res) => {
  const locations = await Location.find().sort({ province: 1, district: 1, city: 1 });
  res.status(200).json({ success: true, data: locations });
});

exports.getContentSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  if (!CONTENT_SECTIONS.includes(section)) {
    throw new ApiError(400, `section must be one of: ${CONTENT_SECTIONS.join(", ")}`);
  }
  const doc = await WebsiteContent.findOne({ section });
  res.status(200).json({ success: true, data: doc ? doc.content : {} });
});

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