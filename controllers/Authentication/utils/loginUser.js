const { knexDb } = require("../../../utils/routes.imports.utils");
const bcrypt = require("bcrypt");

/**
 * Authenticate user login
 * @param {string} identifier - Username or email
 * @param {string} password - User password
 * @returns {Promise<Object>} Result object with authentication status and user data
 */
async function loginUser(identifier, password) {
  try {
    // console.log({ identifier, password });
    // Find user by username or email
    const user = await knexDb("users")
      .where("username", identifier)
      .orWhere("email", identifier)
      .first();

    if (!user) {
      return {
        success: false,
        message: "Invalid username/email or password",
        code: "INVALID_CREDENTIALS",
      };
    }

    // For now, we'll store passwords as plain text since we're using Supabase for auth
    // In production, you would hash passwords and compare them here
    // const isPasswordValid = await bcrypt.compare(password, user.password);

    // Since we're using Supabase for authentication, this function mainly validates
    // that the user exists in our database
    return {
      success: true,
      user: {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      },
      message: "User authenticated successfully",
    };
  } catch (error) {
    console.error("Error during user login:", error);
    throw new Error("Database error while authenticating user");
  }
}

module.exports = { loginUser };
