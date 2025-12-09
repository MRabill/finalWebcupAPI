const { knexDb, axios } = require("../utils/routes.imports.utils");

// Supabase configuration
const SUPABASE_PUBLISHABLE = process.env.SUPABASE_PUBLISHABLE; // from Supabase project settings
const SUPABASE_TOKEN_VERIFICATION_URL =
  process.env.SUPABASE_TOKEN_VERIFICATION_URL;

/**
 * Enhanced authentication middleware that:
 * 1. Extracts token from either Authorization header OR session object in request body
 * 2. Verifies the token with Supabase
 * 3. Populates the user object in the request
 * 4. Stores session data in req.sessionData if provided in the request body
 */
const authHeader = async (req, res, next) => {
  try {
    let accessToken = null;

    // STEP 1: Extract token from Authorization header or request body
    const authHeader = req.headers.authorization;

    // console.log("Auth Header:", authHeader);

    // Check if token is in Authorization header
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }
    // // If not in header, check if token is in session object in request body
    // else if (req.body && req.body.session && req.body.session.access_token) {
    //   accessToken = req.body.session.access_token;

    //   // Store session data for later use (e.g., refresh token updates)
    //   req.sessionData = req.body.session;

    //   // Also set the Authorization header for any downstream middleware that might expect it
    //   req.headers.authorization = `Bearer ${accessToken}`;
    // }

    // If no token found in either place, return error
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message:
          "Authorization token required (either in header or session object)",
        code: "MISSING_TOKEN",
      });
    }

    // STEP 2: Verify token with Supabase
    const response = await axios.get(SUPABASE_TOKEN_VERIFICATION_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_PUBLISHABLE,
      },
    });

    // console.log("Supabase verification response:", response.data);

    if (!response.data || !response.data.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
        code: "INVALID_ACCESS_TOKEN",
      });
    }

    // STEP 3: Get user data from Supabase response
    const supabaseUser = response.data;

    // console.log("Supabase user data:", supabaseUser);

    // STEP 4: Check if user exists in our database and get additional info
    const userFromDb = await knexDb("users")
      .select(
        "id",
        "username",
        // "first_name as firstName",
        // "last_name as lastName",
        "email",
        // "role",
        "refresh_token",
        "refresh_token_expires_at"
      )
      .where({ uuid: supabaseUser.id })
      // .where("row_status", 1)
      .first();

    // console.log("User from DB:", userFromDb);

    if (!userFromDb) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
        code: "USER_INACTIVE",
      });
    }

    // STEP 5: Update refresh token if provided in session data
    if (
      req.sessionData &&
      req.sessionData.refresh_token &&
      req.sessionData.expires_at
    ) {
      const { refresh_token, expires_at } = req.sessionData;

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
      await knexDb("users").where("email", userFromDb.email).update({
        refresh_token: refresh_token,
        refresh_token_expires_at: formattedExpiresAt,
        last_login: knexDb.fn.now(),
      });

      // Update the refresh token in userFromDb to reflect the latest value
      userFromDb.refresh_token = refresh_token;
      userFromDb.refresh_token_expires_at = formattedExpiresAt;
    }

    // STEP 6: Populate req.user with combined user info from Supabase and our database
    req.user = {
      id: userFromDb.id,
      email: userFromDb.email,
      firstName: userFromDb.firstName,
      lastName: userFromDb.lastName,
      role: userFromDb.role,
      supabaseId: supabaseUser.id,
      fullName: `${userFromDb.firstName} ${userFromDb.lastName}`,
      metadata: supabaseUser.user_metadata || {},
      refreshToken: userFromDb.refresh_token,
      refreshTokenExpiresAt: userFromDb.refresh_token_expires_at,
    };

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    // Determine what kind of error occurred and return appropriate response
    if (error.response && error.response.status === 401) {
      return res.status(401).json({
        success: false,
        message: "Failed to verify access token",
        code: "TOKEN_VERIFICATION_FAILED",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
};

module.exports = authHeader;
