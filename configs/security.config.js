/**
 * Security configuration for API endpoints
 * Centralizes security settings and information disclosure policies
 */

const SECURITY_CONFIG = {
  // Information disclosure levels
  DISCLOSURE_LEVELS: {
    PUBLIC: "public", // Minimal info for public endpoints
    AUTHENTICATED: "authenticated", // Basic info for authenticated users
    ADMIN: "admin", // Detailed info for admin users only
  },

  // Rate limiting settings
  RATE_LIMITS: {
    HEALTH_CHECK: {
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
    },
    SYSTEM_STATUS: {
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 requests per minute (admin only)
    },
  },

  // Headers for security
  SECURITY_HEADERS: {
    CACHE_CONTROL: "no-cache, no-store, must-revalidate",
    PRAGMA: "no-cache",
    EXPIRES: "0",
    X_CONTENT_TYPE_OPTIONS: "nosniff",
    X_FRAME_OPTIONS: "DENY",
    X_XSS_PROTECTION: "1; mode=block",
  },

  // Allowed admin roles for detailed system information
  ADMIN_ROLES: ["admin", "superadmin", "system_admin"],

  // Fields to exclude from error responses
  ERROR_FIELD_BLACKLIST: [
    "stack",
    "sqlState",
    "errno",
    "syscall",
    "hostname",
    "port",
    "path",
    "code",
    "address",
  ],

  // Environment-specific settings
  getDisclosureLevel: (userRole = null, endpoint = "health") => {
    if (
      endpoint === "system-status" &&
      SECURITY_CONFIG.ADMIN_ROLES.includes(userRole?.toLowerCase())
    ) {
      return SECURITY_CONFIG.DISCLOSURE_LEVELS.ADMIN;
    }

    if (userRole) {
      return SECURITY_CONFIG.DISCLOSURE_LEVELS.AUTHENTICATED;
    }

    return SECURITY_CONFIG.DISCLOSURE_LEVELS.PUBLIC;
  },

  // Sanitize error for client response
  sanitizeError: (error, disclosureLevel = "public") => {
    if (disclosureLevel === SECURITY_CONFIG.DISCLOSURE_LEVELS.ADMIN) {
      // Admin users get more details but still filtered
      return {
        message: error.message || "Unknown error",
        type: error.code ? "database_error" : "application_error",
        timestamp: new Date().toISOString(),
      };
    }

    // Public and authenticated users get minimal error info
    return {
      message: "Service temporarily unavailable",
      type: "service_error",
      timestamp: new Date().toISOString(),
    };
  },
};

module.exports = SECURITY_CONFIG;
