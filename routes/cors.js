const { router } = require("../utils/routes.imports.utils");

/**
 * setting headers
 */
router.use((req, res, next) => {
  // Set allowed origins - specifically add the moderator domain
  const allowedOrigins = ["https://serveur4.webcup.hodi.cloud"];

  const origin = req.headers.origin;

  // Check if the origin is in our allowed list
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  // res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,DELETE,PUT,POST,PATCH"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorization,GALLERY_API_KEY,Cache-Control"
  );

  // Handle preflight OPTIONS requests
  // if (req.method === "OPTIONS") {
  //   return res.status(200).end();
  // }

  next();
});

module.exports = router;

// const { router } = require("../utils/routes.imports.utils");

// /**
//  * setting headers
//  */
// router.use((req, res, next) => {
//   // Commented due to security reasons
//   //Comment as cors will be set in IIS / NGINX
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET,HEAD,OPTIONS,DELETE,PUT,POST"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin,X-Requested-With,contentType,Content-Type,Accept,Authorization,GALLERY_API_KEY"
//   );
//   next();
// });

// module.exports = router;
