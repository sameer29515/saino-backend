// @desc    Search partners with filters (Marketplace Search Engine)
// @route   GET /api/public/search
// @access  Public
exports.searchPartners = asyncHandler(async (req, res) => {
  const { 
    query, 
    country, 
    city, 
    providerType, 
    service, 
    page = 1, 
    limit = 12 
  } = req.query;

  const filter = { status: "approved", isPublished: true };

  // Country filter (Nepal, India, UAE)
  if (country) {
    filter.country = country;
  }

  // Provider Type filter
  if (providerType) {
    filter.providerType = providerType;
  }

  // Service filter
  if (service) {
    filter.services = service;
  }

  // City filter
  if (city) {
    filter["location.city"] = new RegExp(city, "i");
  }

  // Search query (name, about, city)
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

// @desc    Get countries list (for filter UI)
// @route   GET /api/public/countries
// @access  Public
exports.getCountries = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: ['Nepal', 'India', 'UAE']
  });
});