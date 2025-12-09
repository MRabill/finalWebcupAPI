const { router, axios } = require("../../utils/routes.imports.utils");
const { authHeader } = require("../../middlewares");
const getPaypalAccessToken = require("./utils/getPaypalAccessToken");
const PAYPAL_API_BASE_URL = process.env.PAYPAL_API_BASE_URL;
const REDIRECT_URL = process.env.REDIRECT_URL;

router.post("/V1/payment/create/order", authHeader, async function (req, res) {
  try {
    const { 
      amount = "10.00", 
      currency = "USD", 
      items = [],
      description = "Purchase of TestPaper.mu"
    } = req.body;

    console.log("Create Order Request:", req.body);

    const accessToken = await getPaypalAccessToken();

    console.log("PayPal Access Token:", accessToken);

    // Build purchase unit with item details
    const purchaseUnit = {
      amount: {
        currency_code: currency,
        value: amount,
        breakdown: {
          item_total: {
            currency_code: currency,
            value: amount
          }
        }
      },
      description: description
    };

    // Add items if provided
    if (items && items.length > 0) {
      purchaseUnit.items = items.map(item => ({
        name: item.name || "Test Paper",
        description: item.description || "Digital Test Paper",
        unit_amount: {
          currency_code: currency,
          value: item.price || amount
        },
        quantity: item.quantity || "1",
        category: item.category || "DIGITAL_GOODS"
      }));
    }

    //Create Order
    const orderResponse = await axios.post(
      `${PAYPAL_API_BASE_URL}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [purchaseUnit],
        application_context: {
          return_url: `${REDIRECT_URL}/return`,
          cancel_url: `${REDIRECT_URL}/cancel`,
          brand_name: "TestPaper.mu",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log("Order Response from PayPal:", orderResponse.data);

    const orderId = orderResponse.data.id;

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      payload: {
        orderId,
      },
    });
  } catch (error) {
    console.error("Error occurred while accessing dummy endpoint:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unknown error occurred",
      code: "DUMMY_ENDPOINT_ERROR",
    });
  }
});

module.exports = router;
