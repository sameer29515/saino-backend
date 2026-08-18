const pool = require("../Config/db");

// 1. Search & Filter Partners
exports.searchPartners = async (req, res) => {
  try {
    const { query, category, country } = req.query;
    let sql = `SELECT id, name, email, phone, logo, website, about, provider_type, country, location, services, status 
               FROM partners WHERE status = 'approved' AND is_published = true`;
    const params = [];

    if (query) {
      params.push(`%${query}%`);
      sql += ` AND (name ILIKE $${params.length} OR about ILIKE $${params.length})`;
    }

    if (category) {
      params.push(category);
      sql += ` AND provider_type = $${params.length}`;
    }

    if (country) {
      params.push(country);
      sql += ` AND country = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await pool.query(sql, params);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error("Search Partners Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 2. Get Single Partner Profile
exports.getPartnerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerResult = await pool.query(
      `SELECT id, name, email, phone, logo, website, about, provider_type, country, location, services, operating_hours, status, created_at 
       FROM partners WHERE id = $1 AND status = 'approved' AND is_published = true`,
      [id]
    );

    if (partnerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    const partner = partnerResult.rows[0];

    // Build full URL for logo if it's a relative path
    if (partner.logo && partner.logo.startsWith("/uploads")) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      partner.logo = `${baseUrl}${partner.logo}`;
    }

    res.json({ success: true, data: partner });
  } catch (error) {
    console.error("Get Partner Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 3. Get Countries List
exports.getCountries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT country FROM partners WHERE country IS NOT NULL AND country != ''`
    );
    const countries = result.rows.map((row) => row.country);
    res.json({ success: true, data: countries });
  } catch (error) {
    console.error("Get Countries Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};