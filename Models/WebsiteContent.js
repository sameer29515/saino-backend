const mongoose = require("mongoose");
const { CONTENT_SECTIONS } = require("../Utils/constants");

// Generic, flexible container so the Super Admin can edit website copy
// (homepage, solutions, about, contact) without needing a code deploy.
// `content` is intentionally Mixed since each section has a different shape.
const websiteContentSchema = new mongoose.Schema(
  {
    section: { type: String, enum: CONTENT_SECTIONS, required: true, unique: true },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WebsiteContent", websiteContentSchema);
