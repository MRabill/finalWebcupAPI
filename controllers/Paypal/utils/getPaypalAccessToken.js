// Import axios directly to avoid destructuring issues
const axios = require("axios");
const PAYPAL_API_BASE_URL = process.env.PAYPAL_API_BASE_URL;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const getPaypalAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error(
        "PayPal credentials are missing. Please check your environment variables."
      );
    }

    const auth = Buffer.from(
      `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const url = `${PAYPAL_API_BASE_URL}/v1/oauth2/token`;

    const res = await axios.post(url, "grant_type=client_credentials", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
    });

    return res.data.access_token;
  } catch (error) {
    console.error("Error fetching PayPal access token:", error.message);

    throw error;
  }
};

module.exports = getPaypalAccessToken;
