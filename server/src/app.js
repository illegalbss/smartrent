const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const routes = require("./routes");
const { apiLimiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Vercel (and most PaaS) sit behind exactly one proxy. Trust only that one
// hop: trusting every X-Forwarded-For entry (`true`) lets a client make up
// its own IP per request and dodge the login rate limit.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS) || 1);

app.use(helmet());

// Only our own frontend(s) may call the API from a browser. Set
// CORS_ORIGINS to a comma-separated list (e.g. "https://rentaflow.ng,
// https://www.rentaflow.ng"). Left unset, any origin is allowed — the API
// uses bearer tokens, not cookies, so that isn't a CSRF hole, but set it.
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);
if (allowedOrigins.length === 0) {
  console.warn("CORS_ORIGINS is not set — the API accepts browser requests from any website.");
}
app.use(
  cors(
    allowedOrigins.length
      ? { origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)) }
      : undefined
  )
);
// Captures the raw request body alongside the parsed one — needed to verify
// the Paystack webhook's HMAC signature, which must be computed over the
// exact bytes Paystack sent, not a re-serialized copy.
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(morgan("dev"));

app.use("/api/v1", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
