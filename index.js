const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// ✅ Load Environment Variables at top
dotenv.config();

// ✅ PostgreSQL connection
const pool = require("./Config/db");

const { notFound, errorHandler } = require("./Middlewares/errorHandler");

const authRoutes = require("./Routers/authRoutes");
const partnerRoutes = require("./Routers/partnerRoutes");
const adminRoutes = require("./Routers/adminRoutes");
const publicRoutes = require("./Routers/publicRoutes");

const app = express();

// ---- Core Middleware ----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Static file serving ----
// Standardized to lowercase 'uploads' to avoid Linux server casing issues
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- Health check ----
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Saino API is running" });
});

// ---- Public partner profile by ID (no auth) — must be BEFORE partnerRoutes ----
const { getPartnerById } = require("./Controllers/partnerController");
app.get("/api/partner/:id", getPartnerById);
app.get("/api/public/partner/:id", getPartnerById);

// ---- API Routes ----
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/public", publicRoutes);

// ---- 404 + error handling ----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});