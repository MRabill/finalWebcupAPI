const { router } = require("../../utils/routes.imports.utils");
const { authHeader } = require("../../middlewares");

router.get("/V1/dummy", authHeader, async function (req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: "Dummy endpoint reached",
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: req.user.fullName,
        role: req.user.role,
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
