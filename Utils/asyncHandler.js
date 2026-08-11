// Wraps an async controller function and forwards any error to Express's
// error-handling middleware instead of needing try/catch in every controller.





// ✅ Sahi Code
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;