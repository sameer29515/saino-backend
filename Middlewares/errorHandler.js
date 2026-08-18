const multer = require("multer");

// 404 handler - placed after all routes
exports.notFound = (req, res, next) => {
  res.status(404).json({ 
    success: false, 
    message: `Route not found: ${req.originalUrl}` 
  });
};

// Centralized error handler - must be registered last with 4 args
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // =============================================
  // PostgreSQL-specific errors
  // =============================================

  // Unique constraint violation (duplicate key)
  if (err.code === "23505") {
    statusCode = 400;
    const field = err.constraint || "field";
    message = `Duplicate value for "${field}". Please use a different value.`;
  }

  // Not null violation (required field missing)
  if (err.code === "23502") {
    statusCode = 400;
    const field = err.column || "field";
    message = `"${field}" is required. Please provide a value.`;
  }

  // Foreign key violation
  if (err.code === "23503") {
    statusCode = 400;
    message = "Referenced record does not exist.";
  }

  // Invalid input syntax (e.g., wrong data type)
  if (err.code === "22P02") {
    statusCode = 400;
    message = "Invalid input format. Please check your data types.";
  }

  // =============================================
  // JWT errors
  // =============================================
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired, please log in again";
  }

  // =============================================
  // Multer upload errors
  // =============================================
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.message;
  }

  // =============================================
  // Custom ApiError
  // =============================================
  if (err.statusCode && err.message) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // =============================================
  // Log error (development only)
  // =============================================
  if (process.env.NODE_ENV !== "production") {
    console.error("❌ Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};