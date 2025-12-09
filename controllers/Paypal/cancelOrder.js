const { router, axios } = require("../../utils/routes.imports.utils");
const { authHeader } = require("../../middlewares");
const getPaypalAccessToken = require("./utils/getPaypalAccessToken");
const PAYPAL_API_BASE_URL = process.env.PAYPAL_API_BASE_URL;
const REDIRECT_URL = process.env.REDIRECT_URL;

router.post("/V1/payment/cancel/order", authHeader, async function (req, res) {
  try {
    console.log("Cancel Order Request Body:", req.body);
    return res.status(200).json({
      success: true,
      message: "Order canceled successfully",
      payload: {
        orderId,
      },
    });
  } catch (error) {
    console.error("Error occurred while canceling order:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unknown error occurred",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

module.exports = router;
