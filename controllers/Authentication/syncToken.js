const { router, knexDb } = require("../../utils/routes.imports.utils");

// Endpoint to sync refresh token with backend
router.post("/V1/auth/sync-token", async function (req, res) {
  const { session } = req.body;

  if (!session || !session.access_token) {
    return res.status(400).json({
      success: false,
      message: "Session with access_token is required",
      code: "MISSING_SESSION",
    });
  }

  const { access_token, refresh_token, expires_at } = session;

  try {
    // Set the Authorization header with the access token
    req.headers.authorization = `Bearer ${access_token}`;

    // Decode the token to extract user email
    let userEmail;
    try {
      const payload = JSON.parse(
        Buffer.from(access_token.split(".")[1], "base64").toString()
      );
      userEmail = payload.email;
      //   console.log({ payload });
    } catch (decodeError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
        code: "INVALID_TOKEN",
      });
    }

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "User email not found in token",
        code: "INVALID_TOKEN",
      });
    }

    // Convert expires_at to proper MySQL datetime format if needed
    let formattedExpiresAt = expires_at;
    if (expires_at && typeof expires_at === "number") {
      // Convert timestamp to ISO string
      formattedExpiresAt = new Date(expires_at * 1000)
        .toISOString()
        .replace("T", " ")
        .replace(/\.\d{3}Z$/, "");
    } else if (expires_at && typeof expires_at === "string") {
      // Handle both ISO string and already formatted datetime
      if (expires_at.includes("T")) {
        formattedExpiresAt = expires_at
          .replace("T", " ")
          .replace(/\.\d{3}Z$/, "");
      }
    }

    // Update user's refresh token in database
    await knexDb("users").where("email", userEmail).update({
      refresh_token: refresh_token,
      refresh_token_expires_at: formattedExpiresAt,
      last_login: knexDb.fn.now(),
    });

    return res.status(200).json({
      success: true,
      message: "Refresh token synced successfully",
    });
  } catch (error) {
    console.error("Refresh token sync error:", error);
    console.error("Request body:", req.body);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to sync refresh token",
      code: "SYNC_FAILED",
    });
  }
});

module.exports = router;
