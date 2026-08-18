const pool = require("../Config/db");

// =============================================
// GET PARTNER PROFILE
// =============================================
exports.getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, logo, website, about, 
              provider_type, country, status, is_published, 
              location, services, operating_hours,
              verification_registration, verification_license, verification_documents,
              created_at, updated_at 
       FROM partners WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    const partner = result.rows[0];

    // Build full URL for logo if it's a relative path
    if (partner.logo && partner.logo.startsWith("/uploads")) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      partner.logo = `${baseUrl}${partner.logo}`;
    }

    res.status(200).json({ success: true, data: partner });
  } catch (error) {
    console.error("GetProfile Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to get profile" });
  }
};

// =============================================
// UPDATE PROFILE
// =============================================
exports.updateProfile = async (req, res) => {
  try {
    const {
      name, phone, website,
      // Accept both naming conventions from different frontend forms
      about, description,
      providerType, provider_type,
      // location can come as an object {address,city,district,province}
      // OR as individual fields (address, city, district, province)
      location, address, city, district, province,
      // services can come as an array OR as a plain string (specialties)
      services, specialties,
      // timing fields — stored as operating_hours JSON
      timing_weekday, timing_sunday, operating_hours,
      verification_registration, verification_license,
    } = req.body;

    const partnerId = req.user.id;

    const checkResult = await pool.query("SELECT * FROM partners WHERE id = $1", [partnerId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    const existing = checkResult.rows[0];

    let updates = [];
    let values = [];
    let index = 1;

    // --- name ---
    if (name !== undefined) { updates.push(`name = $${index}`); values.push(name); index++; }

    // --- phone ---
    if (phone !== undefined) { updates.push(`phone = $${index}`); values.push(phone); index++; }

    // --- website ---
    if (website !== undefined) { updates.push(`website = $${index}`); values.push(website); index++; }

    // --- about / description (both accepted) ---
    const aboutValue = about !== undefined ? about : description;
    if (aboutValue !== undefined) {
      updates.push(`about = $${index}`); values.push(aboutValue); index++;
    }

    // --- provider_type (both naming conventions) ---
    const providerTypeValue = providerType !== undefined ? providerType : provider_type;
    if (providerTypeValue !== undefined) {
      updates.push(`provider_type = $${index}`); values.push(providerTypeValue); index++;
    }

    // --- location ---
    // Accept: full object, OR flat fields (address/city/district/province)
    let locationObj = undefined;
    if (location !== undefined && typeof location === 'object') {
      locationObj = location;
    } else if (address !== undefined || city !== undefined || district !== undefined || province !== undefined) {
      // Merge with existing location so partial updates don't wipe other sub-fields
      let existingLoc = {};
      if (existing.location) {
        try {
          existingLoc = typeof existing.location === 'string'
            ? JSON.parse(existing.location)
            : existing.location;
        } catch (e) { existingLoc = {}; }
      }
      locationObj = {
        address: address !== undefined ? address : (existingLoc.address || ''),
        city: city !== undefined ? city : (existingLoc.city || ''),
        district: district !== undefined ? district : (existingLoc.district || ''),
        province: province !== undefined ? province : (existingLoc.province || ''),
      };
    } else if (location !== undefined && typeof location === 'string') {
      // plain string address — store as { address: value }
      let existingLoc = {};
      if (existing.location) {
        try {
          existingLoc = typeof existing.location === 'string'
            ? JSON.parse(existing.location)
            : existing.location;
        } catch (e) { existingLoc = {}; }
      }
      locationObj = { ...existingLoc, address: location };
    }
    if (locationObj !== undefined) {
      updates.push(`location = $${index}`); values.push(JSON.stringify(locationObj)); index++;
    }

    // --- services / specialties (both accepted; string gets converted to array) ---
    let servicesValue = undefined;
    if (services !== undefined) {
      servicesValue = Array.isArray(services) ? services : [services].filter(Boolean);
    } else if (specialties !== undefined) {
      // specialties can be a comma-separated string or array
      if (Array.isArray(specialties)) {
        servicesValue = specialties;
      } else if (typeof specialties === 'string' && specialties.trim()) {
        servicesValue = specialties.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (servicesValue !== undefined) {
      updates.push(`services = $${index}`); values.push(JSON.stringify(servicesValue)); index++;
    }

    // --- operating_hours / timing_weekday / timing_sunday ---
    // All timing info is stored as a JSON array in the operating_hours column.
    // Accept: full operating_hours array, OR timing_weekday + timing_sunday strings.
    let hoursValue = undefined;
    if (operating_hours !== undefined && Array.isArray(operating_hours)) {
      hoursValue = operating_hours;
    } else if (timing_weekday !== undefined || timing_sunday !== undefined) {
      // Build structured array that the public profile page can render
      hoursValue = [];
      if (timing_weekday !== undefined) {
        hoursValue.push({ day: 'Monday - Saturday', hours: timing_weekday, status: 'open' });
      }
      if (timing_sunday !== undefined) {
        hoursValue.push({ day: 'Sunday', hours: timing_sunday, status: 'open' });
      }
    }
    if (hoursValue !== undefined) {
      // operating_hours column may not exist yet — add it only if the query succeeds
      // We store it; if column missing the DB will throw and we catch gracefully below
      updates.push(`operating_hours = $${index}`); values.push(JSON.stringify(hoursValue)); index++;
    }

    // --- verification docs ---
    if (verification_registration !== undefined) {
      updates.push(`verification_registration = $${index}`); values.push(verification_registration); index++;
    }
    if (verification_license !== undefined) {
      updates.push(`verification_license = $${index}`); values.push(verification_license); index++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    values.push(partnerId);

    // First attempt: full update including operating_hours
    let result;
    try {
      const query = `UPDATE partners SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
      result = await pool.query(query, values);
    } catch (dbErr) {
      // If operating_hours column doesn't exist yet, retry without it
      if (dbErr.message && dbErr.message.includes('operating_hours') && hoursValue !== undefined) {
        console.warn("operating_hours column missing — creating it now.");
        await pool.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS operating_hours TEXT`);
        const query = `UPDATE partners SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
        result = await pool.query(query, values);
      } else {
        throw dbErr;
      }
    }

    // Build full logo URL for the response
    const updatedPartner = result.rows[0];
    if (updatedPartner.logo && updatedPartner.logo.startsWith("/uploads")) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      updatedPartner.logo = `${baseUrl}${updatedPartner.logo}`;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedPartner,
    });
  } catch (error) {
    console.error("UpdateProfile Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update profile" });
  }
};

// =============================================
// SUBMIT FOR APPROVAL
// =============================================
exports.submitForApproval = async (req, res) => {
  try {
    const partnerId = req.user.id;
    const result = await pool.query(
      `SELECT name, phone, provider_type, status FROM partners WHERE id = $1`,
      [partnerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    const partner = result.rows[0];
    if (!partner.name || !partner.phone || !partner.provider_type) {
      return res.status(400).json({
        success: false,
        message: "Please complete profile (name, phone, provider type) before submitting",
      });
    }

    if (partner.status === "pending") {
      return res.status(400).json({ success: false, message: "Listing is already pending review" });
    }

    const updateResult = await pool.query(
      `UPDATE partners SET status = 'pending', submitted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [partnerId]
    );

    res.status(200).json({
      success: true,
      message: "Submitted for review.",
      data: { status: updateResult.rows[0].status, submittedAt: updateResult.rows[0].submitted_at },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to submit profile" });
  }
};

// =============================================
// GET STATUS
// =============================================
exports.getStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, status, is_verified, is_published, rejection_reason, submitted_at, reviewed_at FROM partners WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to get status" });
  }
};

// =============================================
// UPLOAD LOGO
// =============================================
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No logo file uploaded" });
    }

    const logoPath = `/uploads/logos/${req.file.filename}`;

    // Build absolute URL so frontend can display the image directly
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const logoUrl = `${baseUrl}${logoPath}`;

    const result = await pool.query(
      `UPDATE partners SET logo = $1 WHERE id = $2 RETURNING logo`,
      [logoPath, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: "Logo uploaded successfully",
      data: {
        logo: logoUrl,        // full URL for frontend display
        logo_path: logoPath,  // relative path stored in DB
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to upload logo" });
  }
};

// =============================================
// UPLOAD VERIFICATION DOCUMENTS
// =============================================
exports.uploadVerificationDocuments = async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: "No document files uploaded" });
    }

    const docPaths = files.map((f) => `/uploads/documents/${f.filename}`);

    const result = await pool.query(
      `UPDATE partners SET verification_documents = $1 WHERE id = $2 RETURNING verification_documents`,
      [JSON.stringify(docPaths), req.user.id]
    );

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      data: { documents: result.rows[0]?.verification_documents },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to upload documents" });
  }
};

// =============================================
// UPDATE LOCATION
// =============================================
exports.updateLocation = async (req, res) => {
  try {
    const { address, city, district, province } = req.body;
    const result = await pool.query(
      `UPDATE partners SET location = $1 WHERE id = $2 RETURNING location`,
      [JSON.stringify({ address, city, district, province }), req.user.id]
    );

    res.status(200).json({ success: true, message: "Location updated", data: result.rows[0]?.location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to update location" });
  }
};

// =============================================
// UPDATE SERVICES
// =============================================
exports.updateServices = async (req, res) => {
  try {
    const { services } = req.body;
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, message: "Services must be a non-empty array" });
    }

    const result = await pool.query(
      `UPDATE partners SET services = $1 WHERE id = $2 RETURNING services`,
      [JSON.stringify(services), req.user.id]
    );

    res.status(200).json({ success: true, message: "Services updated", data: result.rows[0]?.services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to update services" });
  }
};

// =============================================
// GET DASHBOARD OVERVIEW DATA (💥 ADDED)
// =============================================
exports.getDashboard = async (req, res) => {
  try {
    const partnerId = req.user.id;

    // 1. Fetch Partner Basic Info
    const partnerRes = await pool.query(
      `SELECT id, name, email, phone, location FROM partners WHERE id = $1`,
      [partnerId]
    );

    if (partnerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    // 2. Fetch Listings for this Partner
    let listings = [];
    try {
      const listingsRes = await pool.query(
        `SELECT * FROM listings WHERE partner_id = $1 ORDER BY id DESC`,
        [partnerId]
      );
      listings = listingsRes.rows;
    } catch (err) {
      console.warn("Listings query warning:", err.message);
    }

    // 3. Fetch Inquiries / Contact Form Submissions
    let inquiries = [];
    try {
      const inquiriesRes = await pool.query(
        `SELECT * FROM inquiries WHERE partner_id = $1 OR partner_id IS NULL ORDER BY created_at DESC`,
        [partnerId]
      );
      inquiries = inquiriesRes.rows;
    } catch (err) {
      console.warn("Inquiries query warning:", err.message);
    }

    res.status(200).json({
      success: true,
      partner: partnerRes.rows[0],
      listings: listings,
      inquiries: inquiries,
    });
  } catch (error) {
    console.error("GetDashboard Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch dashboard data" });
  }
};

// =============================================
// GET SINGLE PUBLIC PARTNER PROFILE BY ID
// =============================================
exports.getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, email, phone, logo, website, about, 
              provider_type, country, status, is_published, 
              location, services, operating_hours, created_at 
       FROM partners 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    const partner = result.rows[0];

    // Build full URL for logo if it's a relative path
    if (partner.logo && partner.logo.startsWith("/uploads")) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      partner.logo = `${baseUrl}${partner.logo}`;
    }

    res.status(200).json({ success: true, data: partner });
  } catch (error) {
    console.error("GetPartnerById Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch partner details" });
  }
};