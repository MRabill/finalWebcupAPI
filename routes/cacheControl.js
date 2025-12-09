const { router } = require("../utils/routes.imports.utils");

/**
 * setting headers
 */
router.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache");
    next();
});

module.exports = router;
