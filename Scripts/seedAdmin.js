// One-time script to create the first Super Admin account.
// Usage: node Scripts/seedAdmin.js
//
// Reads credentials from env vars so you don't hardcode secrets:
//   SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
// Falls back to sensible defaults for local dev if not set.

const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../Config/db");
const Admin = require("../Models/Admin");
const mongoose = require("mongoose");

const run = async () => {
  await connectDB();

  const name = process.env.SEED_ADMIN_NAME || "Saino Super Admin";
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@saino.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin with email "${email}" already exists. Nothing to do.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const admin = await Admin.create({ name, email, password, role: "superadmin" });
  console.log("Super admin created successfully:");
  console.log(`  email: ${admin.email}`);
  console.log(`  password: ${password}  (please change this after first login)`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
