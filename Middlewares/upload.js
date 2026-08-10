const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const logoDir = path.join(__dirname, "..", "Uploads", "logos");
const docDir = path.join(__dirname, "..", "Uploads", "documents");
[logoDir, docDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "logo") return cb(null, logoDir);
    return cb(null, docDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${req.user ? req.user.id : "anon"}-${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|svg/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase());
  if (isValid) return cb(null, true);
  cb(new Error("Only image files (jpg, jpeg, png, webp, svg) are allowed for the logo"));
};

const documentFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const isValid = allowed.test(path.extname(file.originalname).toLowerCase());
  if (isValid) return cb(null, true);
  cb(new Error("Only image or PDF files are allowed for verification documents"));
};

exports.uploadLogo = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("logo");

exports.uploadDocuments = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB each
}).array("documents", 5);
