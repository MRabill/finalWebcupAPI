const { router } = require("../../utils/routes.imports.utils");
const { authHeader } = require("../../middlewares");

// Endpoint to check login status using authHeader middleware
// The authHeader middleware will:
// 1. Extract the token from session in request body
// 2. Verify the token with Supabase
// 3. Update refresh token in the database if needed
// 4. Populate the user object in the request

console.log("Setting up /V1/auth/check-login route");
router.post("/V1/auth/check-login", authHeader, async function (req, res) {
  try {
    // At this point, authentication was successful and req.user has been populated by the authHeader middleware
    // The authHeader middleware has already updated the refresh token if it was provided

    // Return user information along with success message
    return res.status(200).json({
      success: true,
      message: "User authenticated successfully",
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: req.user.fullName,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Authentication check error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to check authentication",
      code: "AUTH_CHECK_FAILED",
    });
  }
});

module.exports = router;
