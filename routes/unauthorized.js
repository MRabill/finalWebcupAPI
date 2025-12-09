const { router } = require("../utils/routes.imports.utils");

/**
 * Get user + companies + services
 */
router.get("/UnAuthorized", (req, res, next) => {
  res.status(401).send({
    success: false,
    message: "You must be authenticated to use this api"
  });
});

module.exports = router;
