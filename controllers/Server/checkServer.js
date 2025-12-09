const { knexDb, router } = require("../../utils/routes.imports.utils");
const { accessControl, authHeader } = require("../../middlewares");
const versionManager = require("../../utils/version.utils");
const SECURITY_CONFIG = require("../../configs/security.config");
const {
  healthCheckLimiter,
  systemStatusLimiter,
} = require("../../middlewares/rateLimiter");

router.get("/health", healthCheckLimiter, async function (req, res) {
  const startTime = Date.now();

  // Basic health response - minimal information exposure
  const healthCheck = {
    success: true,
    message: "Service operational",
    timestamp: new Date().toISOString(),
    status: "healthy",
    api: {
      version: versionManager.getVersionWithBuild(),
      responseTime: null,
    },
    services: {
      database: "unknown",
    },
  };

  // Test database connection - minimal information exposure
  try {
    // Simple connectivity test without exposing database details
    await knexDb.raw("SELECT 1 as health_check");
    healthCheck.services.database = "operational";
  } catch (error) {
    // Log full error details server-side but don't expose to client
    console.error("[Health Check] Database connection failed:", {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    });

    healthCheck.services.database = "degraded";
    healthCheck.status = "degraded";
    healthCheck.success = false;
    healthCheck.message = "Service partially degraded";
  }

  // Calculate total response time
  const endTime = Date.now();
  healthCheck.api.responseTime = `${endTime - startTime}ms`;

  // Determine HTTP status based on service health
  const httpStatus = healthCheck.success ? 200 : 503;

  // Set security headers
  res.set(SECURITY_CONFIG.SECURITY_HEADERS);

  return res.status(httpStatus).json(healthCheck);
});
router.get("/", healthCheckLimiter, async function (req, res) {
  const startTime = Date.now();

  // Basic health response - minimal information exposure
  const healthCheck = {
    success: true,
    message: "Service operational",
    timestamp: new Date().toISOString(),
    status: "healthy",
    api: {
      version: versionManager.getVersionWithBuild(),
      responseTime: null,
    },
    services: {
      database: "unknown",
    },
  };

  // Test database connection - minimal information exposure
  try {
    // Simple connectivity test without exposing database details
    await knexDb.raw("SELECT 1 as health_check");
    healthCheck.services.database = "operational";
  } catch (error) {
    // Log full error details server-side but don't expose to client
    console.error("[Health Check] Database connection failed:", {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    });

    healthCheck.services.database = "degraded";
    healthCheck.status = "degraded";
    healthCheck.success = false;
    healthCheck.message = "Service partially degraded";
  }

  // Calculate total response time
  const endTime = Date.now();
  healthCheck.api.responseTime = `${endTime - startTime}ms`;

  // Determine HTTP status based on service health
  const httpStatus = healthCheck.success ? 200 : 503;

  // Set security headers
  res.set(SECURITY_CONFIG.SECURITY_HEADERS);

  return res.status(httpStatus).json(healthCheck);
});

module.exports = router;
