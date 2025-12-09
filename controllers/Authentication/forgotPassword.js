const { router, knexDb } = require("../../utils/routes.imports.utils");
const { checkUserExist } = require("./utils/checkUserExist");

const { sendPasswordResetEmail } = require("../../utils/emailVerification");

// Route to request password reset
router.post("/V1/auth/forgot-password", async function (req, res) {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
        code: "MISSING_EMAIL",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
        code: "INVALID_EMAIL",
      });
    }

    // Check if user exists by email
    const userExists = await checkUserExist(null, email);
    if (!userExists.exists) {
      // For security reasons, we don't want to reveal if an email exists or not
      // So we always return success, but don't actually send an email
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
        payload: {
          email: email,
        },
      });
    }

    const user = userExists.user;

    // Check rate limiting - prevent spam requests
    try {
      const recentResetAttempt = await knexDb("users")
        .where("email", email)
        .where(
          "last_password_reset_email_sent_at",
          ">=",
          knexDb.raw("NOW() - INTERVAL 1 MINUTE")
        )
        .first();

      if (recentResetAttempt) {
        return res.status(429).json({
          success: false,
          message:
            "Password reset email was already sent recently. Please wait before requesting another.",
          code: "RATE_LIMITED",
        });
      }
    } catch (rateLimitError) {
      console.warn("Rate limit check failed:", rateLimitError.message);
      // Continue with the request if rate limit check fails
    }

    // Send password reset email
    const resetResult = await sendPasswordResetEmail(user.email, user.username);

    if (!resetResult.success) {
      console.error(
        "Failed to send password reset email:",
        resetResult.message
      );
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
        code: "EMAIL_SEND_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Password reset link has been sent to your email address. Please check your inbox and spam folder.",
      payload: {
        email: user.email,
        username: user.username,
        resetTokenSent: true,
      },
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
      code: "PASSWORD_RESET_ERROR",
    });
  }
});

module.exports = router;
