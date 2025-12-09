const { router, knexDb } = require("../../utils/routes.imports.utils");
const { checkUserExist } = require("./utils/checkUserExist");

const {
  sendVerificationEmail,
  decodeJWTPayload,
} = require("../../utils/emailVerification");

// Route to resend verification email
router.post("/V1/auth/resend-verification", async function (req, res) {
  const { email, username, token } = req.body;

  try {
    let userEmail = email;
    let userName = username;

    // If token is provided, try to extract email and username from it (even if expired)
    if (token && !email) {
      const tokenPayload = await decodeJWTPayload(token);

      if (tokenPayload.success && tokenPayload.payload) {
        userEmail = tokenPayload.payload.email;
        userName = tokenPayload.payload.username;

        console.log(
          `Extracted from JWT - Email: ${userEmail}, Username: ${userName}, Expired: ${tokenPayload.expired}`
        );
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid token provided and no email specified",
          code: "INVALID_TOKEN_NO_EMAIL",
        });
      }
    }

    // Validate that we have an email
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required (either directly or via valid token)",
        code: "MISSING_EMAIL",
      });
    }

    // Check if user exists
    const userCheck = await checkUserExist(userName, userEmail);
    if (!userCheck.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Send verification email
    const verificationResult = await sendVerificationEmail(userEmail, userName);

    if (!verificationResult.success) {
      return res.status(500).json({
        success: false,
        message: verificationResult.message,
        code: "EMAIL_SEND_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
      payload: {
        email: userEmail,
        username: userName,
        sentViaToken: !!token && !email,
      },
    });
  } catch (error) {
    console.error("Resend verification email error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
      code: "RESEND_FAILED",
    });
  }
});

module.exports = router;
