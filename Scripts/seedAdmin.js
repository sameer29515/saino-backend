const pool = require("../Config/db");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    const email = process.env.SEED_ADMIN_EMAIL || "admin@saino.com";
    const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
    const name = "Saino Super Admin";

    // Check if admin already exists
    const existing = await pool.query(
      "SELECT * FROM admins WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      console.log(`✅ Admin with email "${email}" already exists. Nothing to do.`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin
    const result = await pool.query(
      `INSERT INTO admins (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, "superadmin"]
    );

    console.log("✅ Super admin created successfully:");
    console.log(`  email: ${result.rows[0].email}`);
    console.log(`  password: ${password}  (please change this after first login)`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();