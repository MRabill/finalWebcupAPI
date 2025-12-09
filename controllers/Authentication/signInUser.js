const { router, knexDb } = require("../../utils/routes.imports.utils");
const { checkUserExist } = require("./utils/checkUserExist");
const { createUser } = require("./utils/createUser");
const { loginUser } = require("./utils/loginUser");
const {
  sendVerificationEmail,
  verifyEmailToken,
  checkEmailVerified,
} = require("../../utils/emailVerification");

router.post("/V1/auth/sign-in", async function (req, res) {
  const {
    username,
    email,
    password,
    action,
    firstname,
    lastname,
    supabaseUserId,
  } = req.body;
  console.log("Received auth request:", req.body);

  try {
    // Handle registration
    if (action === "register") {
      // Validate required fields
      if (!username || !email) {
        return res.status(400).json({
          success: false,
          message: "Username and email are required",
          code: "MISSING_REQUIRED_FIELDS",
        });
      }

      // Check if user already exists
      const userCheck = await checkUserExist(username, email);
      if (userCheck.exists) {
        return res.status(409).json({
          success: false,
          message: userCheck.message,
          code: "USER_EXISTS",
          conflictField: userCheck.conflictField,
        });
      }

      // Create new user
      const newUser = await createUser({
        supabaseUserId,
        username,
        email,
        firstname,
        lastname,
      });

      // Send verification email
      const verificationResult = await sendVerificationEmail(email, username);
      if (!verificationResult.success) {
        console.warn(
          "Failed to send verification email:",
          verificationResult.message
        );
      }

      return res.status(201).json({
        success: true,
        message: verificationResult.success
          ? "User registered successfully. Please check your email to verify your account."
          : "User registered successfully. Verification email could not be sent - please contact support.",
        payload: {
          user: {
            ...newUser.user,
            isVerified: false, // New users are not verified
            requiresVerification: true,
          },
          emailVerificationSent: verificationResult.success,
        },
      });
    }

    // Handle sign-in
    if (action === "signin") {
      if (!username && !email) {
        return res.status(400).json({
          success: false,
          message: "Username or email is required",
          code: "MISSING_IDENTIFIER",
        });
      }

      // Use username if provided, otherwise use email
      const identifier = username || email;

      // Authenticate user
      const loginResult = await loginUser(identifier, password);

      if (!loginResult.success) {
        return res.status(401).json({
          success: false,
          message: loginResult.message,
          code: loginResult.code,
        });
      }

      // Check verification status
      const verificationStatus = await checkEmailVerified(
        loginResult.user.email
      );

      return res.status(200).json({
        success: true,
        message: "User signed in successfully",
        payload: {
          user: {
            ...loginResult.user,
            isVerified: verificationStatus.verified,
            requiresVerification: !verificationStatus.verified,
          },
        },
      });
    }

    if (action === "oauth-signin") {
      // Handle OAuth sign-in
      const { email, username, session } = req.body;

      // Check if user exists in the database
      const userCheck = await checkUserExist(username, email);
      if (!userCheck.exists) {
        // If user doesn't exist, create a new user
        const newUser = await createUser({
          supabaseUserId: session.user.id,
          username,
          email,
        });

        // Send verification email for OAuth users too
        const verificationResult = await sendVerificationEmail(email, username);
        if (!verificationResult.success) {
          console.warn(
            "Failed to send verification email:",
            verificationResult.message
          );
        }

        return res.status(201).json({
          success: true,
          message: verificationResult.success
            ? "User registered successfully. Please check your email to verify your account."
            : "User registered successfully. Verification email could not be sent - please contact support.",
          payload: {
            user: {
              ...newUser.user,
              isVerified: false, // New OAuth users are not verified
              requiresVerification: true,
            },
            emailVerificationSent: verificationResult.success,
          },
        });
      }

      // If user exists, log them in
      const loginResult = await loginUser(email);
      if (!loginResult.success) {
        return res.status(401).json({
          success: false,
          message: loginResult.message,
          code: loginResult.code,
        });
      }

      // Check verification status for existing OAuth user
      const verificationStatus = await checkEmailVerified(email);

      return res.status(200).json({
        success: true,
        message: "User signed in successfully",
        payload: {
          user: {
            ...loginResult.user,
            isVerified: verificationStatus.verified,
            requiresVerification: !verificationStatus.verified,
          },
        },
      });
    }

    // Default response for backwards compatibility
    return res.status(201).json({
      success: true,
      message: "User sign in successfully",
      payload: {},
    });
  } catch (error) {
    console.error("User authentication error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process authentication",
      code: "AUTH_FAILED",
    });
  }
});

module.exports = router;
