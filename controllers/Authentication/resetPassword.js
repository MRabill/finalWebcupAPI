const { router, knexDb } = require("../../utils/routes.imports.utils");
const { checkUserExist } = require("./utils/checkUserExist");
const bcrypt = require("bcrypt");

const { verifyPasswordResetToken } = require("../../utils/emailVerification");

// Route to reset password
router.post("/V1/auth/reset-password", async function (req, res) {
  const { token, newPassword, confirmPassword } = req.body;

  try {
    // Validate required fields
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is required",
        code: "MISSING_TOKEN",
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
        code: "MISSING_PASSWORD",
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password confirmation is required",
        code: "MISSING_CONFIRMATION",
      });
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
        code: "PASSWORD_MISMATCH",
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
        code: "PASSWORD_TOO_SHORT",
      });
    }

    // Additional password validation
    const passwordValidation = {
      hasLength: newPassword.length >= 6,
      hasLower: /[a-z]/.test(newPassword),
      hasUpper: /[A-Z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[!@#$%^&*]/.test(newPassword),
    };

    const strengthScore =
      Object.values(passwordValidation).filter(Boolean).length;

    if (strengthScore < 3) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 3 of the following: lowercase letter, uppercase letter, number, special character",
        code: "PASSWORD_TOO_WEAK",
        validation: passwordValidation,
      });
    }

    // Verify the reset token
    const tokenVerification = await verifyPasswordResetToken(token);

    if (!tokenVerification.success) {
      return res.status(400).json({
        success: false,
        message: tokenVerification.message,
        code: "TOKEN_VERIFICATION_FAILED",
      });
    }

    const { email, username } = tokenVerification.payload;

    // Check if user still exists by email
    const userExists = await checkUserExist(null, email);
    if (!userExists.exists) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
        code: "USER_NOT_FOUND",
      });
    }

    const user = userExists.user;

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password in the database
    try {
      const updateResult = await knexDb("users").where("email", email).update({
        password: hashedPassword,
        password_reset_at: knexDb.fn.now(),
        password_reset_token_hash: null, // Clear the token hash
        updated_at: knexDb.fn.now(),
      });

      if (updateResult === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to update password",
          code: "UPDATE_FAILED",
        });
      }

      console.log(`Password successfully reset for user: ${email}`);

      // Log security event
      try {
        await knexDb("user_security_logs").insert({
          user_id: user.id,
          event_type: "password_reset",
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get("User-Agent"),
          created_at: knexDb.fn.now(),
          metadata: JSON.stringify({
            email: email,
            username: username,
            reset_method: "email_token",
          }),
        });
      } catch (logError) {
        console.warn("Failed to log security event:", logError.message);
        // Don't fail the request if logging fails
      }
    } catch (dbError) {
      console.error("Database error during password reset:", dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to update password. Please try again.",
        code: "DATABASE_ERROR",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Password has been reset successfully. You can now sign in with your new password.",
      payload: {
        email: email,
        username: username,
        passwordResetAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      code: "PASSWORD_RESET_ERROR",
    });
  }
});

module.exports = router;
