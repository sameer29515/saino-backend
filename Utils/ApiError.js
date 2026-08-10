// Lightweight custom error class so controllers can `throw new ApiError(404, "Not found")`
// and the global error handler will respond with the right status code + message.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
  }
}

module.exports = ApiError;
