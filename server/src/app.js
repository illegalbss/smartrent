const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const routes = require("./routes");
const { apiLimiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
// Captures the raw request body alongside the parsed one — needed to verify
// the Paystack webhook's HMAC signature, which must be computed over the
// exact bytes Paystack sent, not a re-serialized copy.
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(morgan("dev"));

app.use("/api/v1", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
