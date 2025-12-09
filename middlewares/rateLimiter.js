const rateLimit = require("express-rate-limit");
const SECURITY_CONFIG = require("../configs/security.config");

/**
 * Rate limiter for health check endpoint
 */
const healthCheckLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMITS.HEALTH_CHECK.windowMs,
  max: SECURITY_CONFIG.RATE_LIMITS.HEALTH_CHECK.max,
  message: {
    success: false,
    message: "Too many health check requests, please try again later",
    timestamp: new Date().toISOString(),
    retryAfter: Math.ceil(
      SECURITY_CONFIG.RATE_LIMITS.HEALTH_CHECK.windowMs / 1000
    ),
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment
  skip: (req) => process.env.NODE_ENV === "test",
});

/**
 * Rate limiter for system status endpoint (admin only)
 */
const systemStatusLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMITS.SYSTEM_STATUS.windowMs,
  max: SECURITY_CONFIG.RATE_LIMITS.SYSTEM_STATUS.max,
  message: {
    success: false,
    message: "Too many system status requests, please try again later",
    timestamp: new Date().toISOString(),
    retryAfter: Math.ceil(
      SECURITY_CONFIG.RATE_LIMITS.SYSTEM_STATUS.windowMs / 1000
    ),
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment
  skip: (req) => process.env.NODE_ENV === "test",
});

module.exports = {
  healthCheckLimiter,
  systemStatusLimiter,
};
