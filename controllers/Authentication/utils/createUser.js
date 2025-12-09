const { knexDb } = require("../../../utils/routes.imports.utils");

/**
 * Create a new user in the database
 * @param {Object} userData - User data object
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email
 * @param {string} [userData.firstname] - First name (optional, for Google auth)
 * @param {string} [userData.lastname] - Last name (optional, for Google auth)
 * @returns {Promise<Object>} Result object with created user data
 */
async function createUser(userData) {
  try {
    const {
      supabaseUserId,
      username,
      email,
      firstname = null,
      lastname = null,
    } = userData;

    // Insert user into database
    const [userId] = await knexDb("users").insert({
      uuid: supabaseUserId,
      username: username.trim(),
      email: email.toLowerCase().trim(),
      firstname: firstname ? firstname.trim() : null,
      lastname: lastname ? lastname.trim() : null,
    });

    // Fetch the created user with UUID
    const createdUser = await knexDb("users").where("id", userId).first();

    if (!createdUser) {
      throw new Error("Failed to retrieve created user");
    }

    return {
      success: true,
      user: {
        id: createdUser.id,
        uuid: supabaseUserId,
        username: createdUser.username,
        email: createdUser.email,
        firstname: createdUser.firstname,
        lastname: createdUser.lastname,
      },
      message: "User created successfully",
    };
  } catch (error) {
    console.error("Error creating user:", error);

    // Handle specific database errors
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Username or email already exists");
    }

    throw new Error("Database error while creating user");
  }
}

module.exports = { createUser };
