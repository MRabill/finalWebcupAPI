const axios = require("axios");
const jwt = require("jsonwebtoken");
const { knexDb } = require("./routes.imports.utils");

/**
 * Generate a JWT verification token that expires in 10 minutes
 * @param {string} email - The user's email address
 * @param {string} username - The user's username
 * @returns {string} URL-friendly JWT token
 */
const generateVerificationToken = (email, username) => {
  const payload = {
    email,
    username,
    purpose: "email_verification",
    iat: Math.floor(Date.now() / 1000),
  };

  const secret = process.env.JWT_SECRET;
  const options = {
    expiresIn: "10m", // 10 minutes
    issuer: "testpapers.mu",
    audience: "email-verification",
  };

  return jwt.sign(payload, secret, options);
};

/**
 * Generate a JWT password reset token that expires in 15 minutes
 * @param {string} email - The user's email address
 * @param {string} username - The user's username
 * @returns {string} URL-friendly JWT token
 */
const generatePasswordResetToken = (email, username) => {
  const payload = {
    email,
    username,
    purpose: "password_reset",
    iat: Math.floor(Date.now() / 1000),
  };

  const secret = process.env.JWT_SECRET;
  const options = {
    expiresIn: "15m", // 15 minutes
    issuer: "testpapers.mu",
    audience: "password-reset",
  };

  return jwt.sign(payload, secret, options);
};

/**
 * Create HTML template for password reset
 */
const createPasswordResetEmailTemplate = (username, resetToken, baseUrl) => {
  const resetUrl = `${baseUrl}/forgot-password?token=${resetToken}`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body
    style='background-color:rgb(246,249,252);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
      Reset your password for Testpapers.mu
    </div>
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="background-color:rgb(255,255,255);border-radius:8px;margin-left:auto;margin-right:auto;padding:20px;max-width:600px">
      <tbody>
        <tr style="width:100%">
          <td>
            <!-- Header -->
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="margin-bottom:32px">
              <tbody>
                <tr>
                  <td>
                    <div style="text-align:center">
                      <h1 style="color:rgb(17,24,39);font-size:24px;font-weight:600;margin:0">
                        Testpapers.mu
                      </h1>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Content -->
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation">
              <tbody>
                <tr>
                  <td>
                    <h2 style="color:rgb(17,24,39);font-size:20px;font-weight:600;margin-bottom:16px">
                      Password Reset Request
                    </h2>
                    <p style="color:rgb(75,85,99);font-size:16px;line-height:24px;margin-bottom:24px">
                      Hi ${username || "there"},
                    </p>
                    <p style="color:rgb(75,85,99);font-size:16px;line-height:24px;margin-bottom:24px">
                      We received a request to reset your password for your Testpapers.mu account. 
                      If you made this request, click the button below to create a new password.
                    </p>
                    
                    <!-- Reset Button -->
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-bottom:32px">
                      <tbody>
                        <tr>
                          <td style="text-align:center">
                            <a
                              href="${resetUrl}"
                              style="background-color:rgb(147,51,234);border-radius:6px;color:rgb(255,255,255);display:inline-block;font-size:16px;font-weight:600;line-height:24px;padding:12px 24px;text-decoration:none"
                              target="_blank">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <p style="color:rgb(75,85,99);font-size:14px;line-height:20px;margin-bottom:16px">
                      If the button doesn't work, you can also reset your password by copying and pasting 
                      this link into your browser:
                    </p>
                    <p style="color:rgb(147,51,234);font-size:14px;line-height:20px;margin-bottom:24px;word-break:break-all">
                      ${resetUrl}
                    </p>
                    
                    <p style="color:rgb(107,114,128);font-size:14px;line-height:20px;margin-bottom:16px">
                      This password reset link will expire in 15 minutes for security purposes.
                    </p>
                    
                    <p style="color:rgb(75,85,99);font-size:16px;line-height:24px;margin-bottom:24px">
                      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                    </p>
                    
                    <!-- Security Notice -->
                    <div style="background-color:rgb(254,249,195);border:1px solid rgb(251,191,36);border-radius:6px;padding:16px;margin-bottom:24px">
                      <p style="color:rgb(146,64,14);font-size:14px;line-height:20px;margin:0">
                        <strong>Security Tip:</strong> Never share your password reset link with anyone. Our team will never ask for your password.
                      </p>
                    </div>
                    
                    <!-- Footer -->
                    <hr style="border:none;border-top:1px solid rgb(229,231,235);margin:32px 0" />
                    <p style="color:rgb(107,114,128);font-size:12px;line-height:16px;text-align:center">
                      © 2025 Testpapers.mu. All rights reserved.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
};

/**
 * Create HTML template for email verification
 */
const createVerificationEmailTemplate = (
  username,
  verificationToken,
  baseUrl
) => {
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body
    style='background-color:rgb(246,249,252);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
      Verify your email address for Testapers.mu
    </div>
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="background-color:rgb(255,255,255);border-radius:8px;margin-left:auto;margin-right:auto;padding:20px;max-width:600px">
      <tbody>
        <tr style="width:100%">
          <td>
            <!-- Header -->
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="margin-bottom:32px">
              <tbody>
                <tr>
                  <td>
                    <div style="text-align:center">
                      <h1 style="color:rgb(17,24,39);font-size:24px;font-weight:600;margin:0">
                        Testpapers.mu
                      </h1>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Content -->
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation">
              <tbody>
                <tr>
                  <td>
                    <h2 style="color:rgb(17,24,39);font-size:20px;font-weight:600;margin-bottom:16px">
                      Welcome to Testpapers.mu!
                    </h2>
                    <p style="color:rgb(75,85,99);font-size:16px;line-height:24px;margin-bottom:24px">
                      Hi ${username || "there"},
                    </p>
                    <p style="color:rgb(75,85,99);font-size:16px;line-height:24px;margin-bottom:24px">
                      Thank you for signing up! To complete your registration and start using Testpapers.mu, 
                      please verify your email address by clicking the button below.
                    </p>
                    
                    <!-- Verification Button -->
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-bottom:32px">
                      <tbody>
                        <tr>
                          <td style="text-align:center">
                            <a
                              href="${verificationUrl}"
                              style="background-color:rgb(59,130,246);border-radius:6px;color:rgb(255,255,255);display:inline-block;font-size:16px;font-weight:600;line-height:24px;padding:12px 24px;text-decoration:none"
                              target="_blank">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <p style="color:rgb(75,85,99);font-size:14px;line-height:20px;margin-bottom:16px">
                      If the button doesn't work, you can also verify your email by copying and pasting 
                      this link into your browser:
                    </p>
                    <p style="color:rgb(59,130,246);font-size:14px;line-height:20px;margin-bottom:24px;word-break:break-all">
                      ${verificationUrl}
                    </p>
                    
                    <p style="color:rgb(107,114,128);font-size:14px;line-height:20px;margin-bottom:16px">
                      This verification link will expire in 10 minutes for security purposes.
                    </p>
                    
                    <p style="color:rgb(75,85,99);font-size:16px;line-height:24px;margin-bottom:24px">
                      If you didn't create an account with Testpapers.mu, you can safely ignore this email.
                    </p>
                    
                    <!-- Footer -->
                    <hr style="border:none;border-top:1px solid rgb(229,231,235);margin:32px 0" />
                    <p style="color:rgb(107,114,128);font-size:12px;line-height:16px;text-align:center">
                      © 2025 Testpapers.mu. All rights reserved.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
};

/**
 * Send password reset email using Resend API
 * @param {string} email - The recipient's email address
 * @param {string} username - The user's username
 * @param {string} baseUrl - The base URL for reset links (optional)
 * @returns {Promise<{success: boolean, token?: string, message?: string}>}
 */
const sendPasswordResetEmail = async (
  email,
  username,
  baseUrl = process.env.REDIRECT_URL
) => {
  try {
    // Validate environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;

    // Generate JWT reset token
    const resetToken = generatePasswordResetToken(email, username);

    // Create email template
    const htmlContent = createPasswordResetEmailTemplate(
      username,
      resetToken,
      baseUrl
    );

    // Prepare email data
    const emailData = {
      from: resendFromEmail,
      to: email,
      subject: "Reset Your Password - TestPaper.mu",
      html: htmlContent,
    };

    // Send email via Resend API
    const response = await axios.post(
      "https://api.resend.com/emails",
      emailData,
      {
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update user password reset tracking in database
    try {
      const crypto = require("crypto");
      const tokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      await knexDb("users")
        .where("email", email)
        .update({
          password_reset_requested_at: knexDb.fn.now(),
          last_password_reset_email_sent_at: knexDb.fn.now(),
          password_reset_token_hash: tokenHash,
          password_reset_attempts: knexDb.raw(
            "COALESCE(password_reset_attempts, 0) + 1"
          ),
        });

      console.log(`Updated password reset tracking for user: ${email}`);
    } catch (dbError) {
      console.warn(
        "Failed to update password reset tracking:",
        dbError.message
      );
      // Continue even if DB update fails - email was sent successfully
    }

    console.log("Password reset email sent successfully:", {
      to: email,
      messageId: response.data?.id,
      token: resetToken,
    });

    return {
      success: true,
      token: resetToken,
      message: "Password reset email sent successfully",
    };
  } catch (error) {
    console.error("Failed to send password reset email:", {
      email,
      username,
      error: error.message,
      response: error.response?.data,
    });

    return {
      success: false,
      message: `Failed to send password reset email: ${error.message}`,
    };
  }
};

/**
 * Send email verification using Resend API
 * @param {string} email - The recipient's email address
 * @param {string} username - The user's username
 * @param {string} baseUrl - The base URL for verification links (optional)
 * @returns {Promise<{success: boolean, token?: string, message?: string}>}
 */
const sendVerificationEmail = async (
  email,
  username,
  baseUrl = process.env.REDIRECT_URL
) => {
  try {
    // Validate environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;

    // Generate JWT verification token
    const verificationToken = generateVerificationToken(email, username);

    // Create email template
    const htmlContent = createVerificationEmailTemplate(
      username,
      verificationToken,
      baseUrl
    );

    // Prepare email data
    const emailData = {
      from: resendFromEmail,
      to: email,
      subject: "Verify Your Email Address - TestPaper.mu",
      html: htmlContent,
    };

    // Send email via Resend API
    const response = await axios.post(
      "https://api.resend.com/emails",
      emailData,
      {
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update user verification tracking in database
    try {
      const crypto = require("crypto");
      const tokenHash = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

      await knexDb("users")
        .where("email", email)
        .update({
          email_verification_requested_at: knexDb.fn.now(),
          last_verification_email_sent_at: knexDb.fn.now(),
          verification_token_hash: tokenHash,
          verification_attempts: knexDb.raw("verification_attempts + 1"),
        });

      console.log(`Updated verification tracking for user: ${email}`);
    } catch (dbError) {
      console.warn("Failed to update verification tracking:", dbError.message);
      // Continue even if DB update fails - email was sent successfully
    }

    console.log("Verification email sent successfully:", {
      to: email,
      messageId: response.data?.id,
      token: verificationToken,
    });

    return {
      success: true,
      token: verificationToken,
      message: "Verification email sent successfully",
    };
  } catch (error) {
    console.error("Failed to send verification email:", {
      email,
      username,
      error: error.message,
      response: error.response?.data,
    });

    return {
      success: false,
      message: `Failed to send verification email: ${error.message}`,
    };
  }
};

/**
 * Decode JWT token without verification (for expired tokens)
 * @param {string} token - The JWT verification token
 * @returns {Promise<{success: boolean, message?: string, payload?: object, expired?: boolean}>}
 */
const decodeJWTPayload = async (token) => {
  try {
    if (!token) {
      return {
        success: false,
        message: "Token is required",
      };
    }

    const secret =
      process.env.JWT_SECRET || "fallback_secret_key_for_development";

    // First try to verify normally
    try {
      const decoded = jwt.verify(token, secret, {
        issuer: "testpapers.mu",
        audience: "email-verification",
      });

      if (decoded.purpose !== "email_verification") {
        return {
          success: false,
          message: "Invalid token purpose",
        };
      }

      return {
        success: true,
        payload: {
          email: decoded.email,
          username: decoded.username,
        },
        expired: false,
      };
    } catch (error) {
      // If token is expired, decode without verification to get payload
      if (error.name === "TokenExpiredError") {
        try {
          const decoded = jwt.decode(token, { complete: true });

          if (!decoded || !decoded.payload) {
            return {
              success: false,
              message: "Invalid token structure",
            };
          }

          const payload = decoded.payload;

          // Verify token structure and purpose
          if (
            payload.purpose !== "email_verification" ||
            payload.iss !== "testpapers.mu" ||
            payload.aud !== "email-verification"
          ) {
            return {
              success: false,
              message: "Invalid token purpose or issuer",
            };
          }

          return {
            success: true,
            payload: {
              email: payload.email,
              username: payload.username,
            },
            expired: true,
          };
        } catch (decodeError) {
          return {
            success: false,
            message: "Failed to decode expired token",
          };
        }
      }

      // Handle other JWT errors
      return {
        success: false,
        message:
          error.name === "JsonWebTokenError"
            ? "Invalid token"
            : "Token verification failed",
      };
    }
  } catch (error) {
    console.error("JWT decode error:", error);
    return {
      success: false,
      message: "Token processing failed",
    };
  }
};

/**
 * Verify JWT email token
 * @param {string} token - The JWT verification token
 * @returns {Promise<{success: boolean, message: string, payload?: object}>}
 */
const verifyEmailToken = async (token) => {
  try {
    if (!token) {
      return {
        success: false,
        message: "Verification token is required",
      };
    }

    const secret =
      process.env.JWT_SECRET || "fallback_secret_key_for_development";

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, secret, {
      issuer: "testpapers.mu",
      audience: "email-verification",
    });

    // Check if token is for email verification purpose
    if (decoded.purpose !== "email_verification") {
      return {
        success: false,
        message: "Invalid token purpose",
      };
    }

    // Token is valid and not expired (JWT handles expiration automatically)
    // Update user verification status in database
    try {
      const updateResult = await knexDb("users")
        .where("email", decoded.email)
        .andWhere("is_verified", false) // Only update if not already verified
        .update({
          is_verified: true,
          email_verified_at: knexDb.fn.now(),
          verification_token_hash: null, // Clear the token hash
        });

      if (updateResult === 0) {
        // Check if user is already verified
        const existingUser = await knexDb("users")
          .where("email", decoded.email)
          .first();

        if (existingUser?.is_verified) {
          return {
            success: true,
            message: "Email was already verified",
            payload: {
              email: decoded.email,
              username: decoded.username,
            },
          };
        } else {
          console.warn(
            `User not found for email verification: ${decoded.email}`
          );
        }
      } else {
        console.log(`Successfully verified email for user: ${decoded.email}`);
      }
    } catch (dbError) {
      console.error("Failed to update verification status:", dbError.message);
      // Continue with success response even if DB update fails
    }

    return {
      success: true,
      message: "Email verified successfully",
      payload: {
        email: decoded.email,
        username: decoded.username,
      },
    };
  } catch (error) {
    console.error("JWT verification error:", error);

    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return {
        success: false,
        message:
          "Verification token has expired. Please request a new verification email.",
      };
    }

    if (error.name === "JsonWebTokenError") {
      return {
        success: false,
        message: "Invalid verification token",
      };
    }

    if (error.name === "NotBeforeError") {
      return {
        success: false,
        message: "Token not active yet",
      };
    }

    return {
      success: false,
      message: "Token verification failed",
    };
  }
};

/**
 * Verify JWT password reset token
 * @param {string} token - The JWT password reset token
 * @returns {Promise<{success: boolean, message: string, payload?: object}>}
 */
const verifyPasswordResetToken = async (token) => {
  try {
    if (!token) {
      return {
        success: false,
        message: "Password reset token is required",
      };
    }

    const secret =
      process.env.JWT_SECRET || "fallback_secret_key_for_development";

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, secret, {
      issuer: "testpapers.mu",
      audience: "password-reset",
    });

    // Check if token is for password reset purpose
    if (decoded.purpose !== "password_reset") {
      return {
        success: false,
        message: "Invalid token purpose",
      };
    }

    // Token is valid and not expired (JWT handles expiration automatically)
    // Verify that the user still exists in database
    try {
      const user = await knexDb("users").where("email", decoded.email).first();

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      console.log(`Password reset token verified for user: ${decoded.email}`);
    } catch (dbError) {
      console.warn("Failed to verify user exists:", dbError.message);
      // Continue - we'll let the reset controller handle user validation
    }

    return {
      success: true,
      message: "Password reset token verified successfully",
      payload: {
        email: decoded.email,
        username: decoded.username,
      },
    };
  } catch (error) {
    console.error("JWT password reset verification error:", error);

    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return {
        success: false,
        message: "Password reset token has expired. Please request a new one.",
      };
    }

    if (error.name === "JsonWebTokenError") {
      return {
        success: false,
        message: "Invalid password reset token",
      };
    }

    if (error.name === "NotBeforeError") {
      return {
        success: false,
        message: "Password reset token not active yet",
      };
    }

    return {
      success: false,
      message: "Password reset token verification failed",
    };
  }
};

/**
 * Check if a user's email is verified
 * @param {string} email - The user's email address
 * @returns {Promise<{verified: boolean, user?: object}>}
 */
const checkEmailVerified = async (email) => {
  try {
    const user = await knexDb("users").where("email", email).first();

    if (!user) {
      return { verified: false };
    }

    return {
      verified: !!user.is_verified,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: !!user.is_verified,
        verifiedAt: user.email_verified_at,
        verificationAttempts: user.verification_attempts,
      },
    };
  } catch (error) {
    console.error("Error checking email verification status:", error);
    return { verified: false };
  }
};

/**
 * Get verification statistics for a user
 * @param {string} email - The user's email address
 * @returns {Promise<object>}
 */
const getVerificationStats = async (email) => {
  try {
    const user = await knexDb("users")
      .where("email", email)
      .select(
        "is_verified",
        "email_verification_requested_at",
        "email_verified_at",
        "verification_attempts",
        "last_verification_email_sent_at"
      )
      .first();

    if (!user) {
      return { exists: false };
    }

    return {
      exists: true,
      isVerified: !!user.is_verified,
      verificationRequestedAt: user.email_verification_requested_at,
      verifiedAt: user.email_verified_at,
      attempts: user.verification_attempts || 0,
      lastEmailSentAt: user.last_verification_email_sent_at,
      // Rate limiting helpers
      canSendEmail: true, // Could add rate limiting logic here
      nextEmailAllowedAt: null,
    };
  } catch (error) {
    console.error("Error getting verification statistics:", error);
    return { exists: false };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  verifyEmailToken,
  verifyPasswordResetToken,
  generateVerificationToken,
  generatePasswordResetToken,
  decodeJWTPayload,
  checkEmailVerified,
  getVerificationStats,
};
