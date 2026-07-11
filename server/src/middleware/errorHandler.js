function notFound(req, res) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  // Every intentional, client-facing error is sent directly from a controller
  // via res.status(4xx).json(...) — anything reaching here is unexpected
  // (a crash, a DB outage, a bug), so never forward err.message to the client.
  res.status(500).json({ success: false, error: "Something went wrong. Please try again in a moment." });
}

module.exports = { notFound, errorHandler };
