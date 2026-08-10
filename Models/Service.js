const mongoose = require("mongoose");
const { SERVICE_TYPES } = require("../Utils/constants");

// Master catalog of services (OPD, Laboratory, Pharmacy, etc.) that admin can
// manage descriptive info for. Partners reference services by name (string).
const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, enum: SERVICE_TYPES, required: true, unique: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
