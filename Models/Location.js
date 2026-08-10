const mongoose = require("mongoose");

// Master list of locations admin can maintain, used to power the
// "Location" search/filter dropdown on the public website.
const locationSchema = new mongoose.Schema(
  {
    province: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

locationSchema.index({ province: 1, district: 1, city: 1 }, { unique: true });

module.exports = mongoose.model("Location", locationSchema);
