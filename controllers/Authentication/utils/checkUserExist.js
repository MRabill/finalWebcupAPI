const { knexDb } = require("../../../utils/routes.imports.utils");

/**
 * Check if a user exists by username or email
 * @param {string} username - The username to check
 * @param {string} email - The email to check
 * @returns {Promise<Object>} Result object with existence status and user data
 */
async function checkUserExist(username, email) {
  try {
    // Check if user exists by username or email
    const existingUser = await knexDb("users")
      .where("username", username)
      .orWhere("email", email)
      .first();

    if (existingUser) {
      // Determine which field caused the conflict
      const conflictField =
        existingUser.username === username ? "username" : "email";

      return {
        exists: true,
        user: existingUser,
        conflictField,
        message: `An account with this ${conflictField} already exists`,
      };
    }

    return {
      exists: false,
      user: null,
      conflictField: null,
      message: "Account does not exist",
    };
  } catch (error) {
    console.error("Error checking user existence:", error);
    throw new Error("Database error while checking user existence");
  }
}

module.exports = { checkUserExist };
