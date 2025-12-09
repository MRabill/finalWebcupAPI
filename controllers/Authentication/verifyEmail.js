const { router, knexDb } = require("../../utils/routes.imports.utils");
const { checkUserExist } = require("./utils/checkUserExist");

const {
  sendVerificationEmail,
  verifyEmailToken,
} = require("../../utils/emailVerification");

// Route to verify email
router.post("/V1/auth/verify-email", async function (req, res) {
  const { token } = req.body;

  try {
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
        code: "MISSING_TOKEN",
      });
    }

    const verificationResult = await verifyEmailToken(token);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message,
        code: "VERIFICATION_FAILED",
      });
    }

    // In a production app, you would update the user's email_verified status in the database
    // Example: await knexDb('users').where('email', verificationResult.payload.email).update({ email_verified: true });

    return res.status(200).json({
      success: true,
      message: verificationResult.message,
      payload: {
        verifiedEmail: verificationResult.payload?.email,
        username: verificationResult.payload?.username,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify email",
      code: "VERIFICATION_ERROR",
    });
  }
});

module.exports = router;
