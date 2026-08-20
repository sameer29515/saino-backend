const express = require("express");
const router = express.Router();
const pool = require("../Config/db");

// 1. GET /api/public/partners
router.get("/partners", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM partners
       WHERE status = 'approved' AND COALESCE(is_published, true) = true
       ORDER BY id DESC`
    );

    console.log("DB se kitne partners mile:", result.rows.length);

    const formattedData = result.rows.map((row) => ({
      id: row.id,
      name: row.name || row.title || row.company_name || 'Healthcare Facility',
      provider_type: row.category || row.provider_type || 'Hospital',
      country: row.country || 'Pakistan',
      location: { city: row.city || row.location || 'N/A' },

      phone: row.phone || row.contact_number || row.phone_number || row.mobile || row.contact || 'N/A',
      email: row.email || row.contact_email || row.email_address || 'N/A',

      logo: row.logo && row.logo.startsWith('/uploads')
        ? `${req.protocol}://${req.get('host')}${row.logo}`
        : (row.logo || ''),

      description: row.description || row.about || '',
      services: Array.isArray(row.services)
        ? row.services
        : typeof row.services === 'string'
        ? row.services.split(',')
        : ['General Medical'],
      status: row.status || 'approved',
      is_verified: row.is_verified ?? true,
      is_247: row.is_247 ?? row.is_24_7 ?? false,
      
      // 🟢 Rating Fix: Hardcoded '5.0' hata kar DB rating ya '0.0' set kiya hai
      rating: row.rating ? String(row.rating) : '0.0',
      review_count: Number(row.review_count || 0),
      views_count: Number(row.views_count || 0),
    }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (err) {
    console.error("Error fetching public partners:", err);
    res.status(500).json({
      success: false,
      error: "Server error fetching partners",
      data: [],
    });
  }
});

// 2. POST /api/public/contact & /api/public/queries
router.post(["/contact", "/queries"], async (req, res) => {
  try {
    const partner_id = req.body.partner_id || req.body.partnerId || null;
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    const insertQuery = `
      INSERT INTO inquiries (partner_id, name, email, phone, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [partner_id, name, email, phone || null, message];

    const result = await pool.query(insertQuery, values);

    return res.status(201).json({
      success: true,
      message: "Query successfully submitted!",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error submitting contact query:", err);
    return res.status(500).json({
      success: false,
      message: "Server error submitting query",
      error: err.message,
    });
  }
});

// 3. POST /api/public/partners/:id/view (Alag independent route)
router.post("/partners/:id/view", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE partners SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1`,
      [id]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error incrementing views:", err);
    res.status(500).json({ success: false });
  }
});

const { getPartnerById } = require("../Controllers/partnerController");

// 4. GET /api/public/partner/:id — single partner public profile
router.get("/partner/:id", getPartnerById);

// 5. GET /api/public/partners/:id/reviews — fetch reviews for a partner
router.get("/partners/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, reviewer_name, rating, comment, created_at
       FROM reviews WHERE partner_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Get Reviews Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. POST /api/public/partners/:id/reviews — submit a review (no login needed)
router.post("/partners/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer_name, rating, comment } = req.body;

    if (!reviewer_name || !reviewer_name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    // Check partner exists
    const partnerCheck = await pool.query(`SELECT id FROM partners WHERE id = $1`, [id]);
    if (partnerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Partner not found." });
    }

    // Insert review
    const result = await pool.query(
      `INSERT INTO reviews (partner_id, reviewer_name, rating, comment)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, reviewer_name.trim(), ratingNum, comment?.trim() || null]
    );

    // Update partner's avg rating and review_count atomically
    await pool.query(`
      UPDATE partners SET
        review_count = (SELECT COUNT(*) FROM reviews WHERE partner_id = $1),
        rating       = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE partner_id = $1)
      WHERE id = $1
    `, [id]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Post Review Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;