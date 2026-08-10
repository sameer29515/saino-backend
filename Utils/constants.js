// Central place for enums shared between Models, Controllers and validation,
// so they stay in sync with what the boss specified.

exports.PROVIDER_TYPES = [
  "Hospital",
  "Clinic",
  "Pharmacy",
  "Diagnostic Centre",
  "Wellness/Fitness",
  "Mental Health",
  "Sexual Health",
  "Nutritional",
  "Insurance Company",
];

exports.SERVICE_TYPES = [
  "OPD",
  "Laboratory",
  "Pharmacy",
  "Emergency",
  "Yoga",
  "Fitness",
  "Insurance",
];

// Partner listing lifecycle:
// draft      -> partner is still filling profile, never submitted
// pending    -> submitted, waiting for admin review
// approved   -> admin approved, eligible to be published on public site
// rejected   -> admin rejected, partner must edit and resubmit
// suspended  -> admin suspended a previously approved partner
exports.PARTNER_STATUS = ["draft", "pending", "approved", "rejected", "suspended"];

exports.ENQUIRY_STATUS = ["new", "responded", "closed"];

exports.CONTENT_SECTIONS = ["homepage", "solutions", "about", "contact"];
