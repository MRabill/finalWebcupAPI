const { mainKnex, router, knexDb } = require("../utils/routes.imports.utils");

router.get("/test", async function (req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: "Api running successfully",
      payload: {},
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to run API",
      error: error.message,
    });
  }
});

module.exports = router;
