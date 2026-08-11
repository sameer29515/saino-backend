const partnerSchema = new mongoose.Schema(
  {
    // ---- Basic Info ----
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: [true, "Password is required"], select: false },
    phone: { type: String, required: [true, "Phone is required"], trim: true },
    logo: { type: String, default: "" },
    website: { type: String, default: "", trim: true },
    about: { type: String, default: "", trim: true },
    providerType: {
      type: String,
      enum: PROVIDER_TYPES,
      required: [true, "Provider type is required"],
    },

    // ✅ **NEW: Country Field (Phase 1 - Nepal, India, UAE)**
    country: {
      type: String,
      enum: ['Nepal', 'India', 'UAE'],
      default: 'Nepal',
      required: [true, "Country is required"],
    },

    // ---- Verification ----
    verification: {
      registrationNumber: { type: String, default: "" },
      licenseNumber: { type: String, default: "" },
      documents: [{ type: String }],
    },

    // ---- Location ----
    location: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      province: { type: String, default: "" },
    },
    branches: [branchSchema],

    // ---- Services ----
    services: [{ type: String, enum: SERVICE_TYPES }],

    // ---- Subscription Model (Phase 1) ----
    subscription: {
      plan: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      isActive: { type: Boolean, default: true },
    },

    // ---- Marketplace Fields ----
    marketplace: {
      searchKeywords: [{ type: String }],
      rating: { type: Number, default: 0, min: 0, max: 5 },
      reviews: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
    },

    // ---- Listing lifecycle ----
    status: { type: String, enum: PARTNER_STATUS, default: "draft" },
    isVerified: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    rejectionReason: { type: String, default: "" },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ---- Indexes for Search Performance ----
partnerSchema.index({ name: 'text', about: 'text', 'location.city': 'text' });
partnerSchema.index({ country: 1, status: 1, isPublished: 1 });
partnerSchema.index({ providerType: 1, 'location.city': 1 });

// Hash password before saving
partnerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

partnerSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

partnerSchema.methods.isProfileComplete = function () {
  return Boolean(
    this.name &&
      this.phone &&
      this.providerType &&
      this.country &&
      this.location &&
      this.location.address &&
      this.location.city &&
      this.services &&
      this.services.length > 0
  );
};

module.exports = mongoose.model("Partner", partnerSchema);