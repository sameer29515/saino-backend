const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { PROVIDER_TYPES, SERVICE_TYPES, PARTNER_STATUS } = require("../Utils/constants");

const branchSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    province: { type: String, trim: true },
  },
  { _id: false }
);

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
    logo: { type: String, default: "" }, // path/url to uploaded logo
    website: { type: String, default: "", trim: true },
    about: { type: String, default: "", trim: true },
    providerType: {
      type: String,
      enum: PROVIDER_TYPES,
      required: [true, "Provider type is required"],
    },

    // ---- Verification ----
    verification: {
      registrationNumber: { type: String, default: "" },
      licenseNumber: { type: String, default: "" },
      documents: [{ type: String }], // uploaded file paths
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

// Hash password before saving, only if it was modified
partnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

partnerSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Helper: is this partner's profile complete enough to submit for approval?
partnerSchema.methods.isProfileComplete = function () {
  return Boolean(
    this.name &&
      this.phone &&
      this.providerType &&
      this.location &&
      this.location.address &&
      this.location.city &&
      this.services &&
      this.services.length > 0
  );
};

module.exports = mongoose.model("Partner", partnerSchema);
