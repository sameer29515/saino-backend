// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const connectDB = require("./Config/db");
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

// ---- MongoDB (Atlas) Connection via Mongoose ----
connectDB();

// ---- Static file serving for uploaded logos / documents ----
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

// ---- Health check ----
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Saino API is running" });
});

// ---- API Routes ----
app.use("/api/admin", adminRoutes);     // Saino super admin
app.use("/api/auth", authRoutes);       // partner/admin register & login
app.use("/api/partner", partnerRoutes); // healthcare partner portal
app.use("/api/public", publicRoutes);   // public website (directory, content, contact)

// ---- 404 + error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
