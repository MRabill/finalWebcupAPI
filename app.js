require("dotenv-flow").config({ silent: true });
const compression = require("compression");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const helmet = require("helmet"); //secure headers

const corsRouter = require("./routes/cors");
const cacheControl = require("./routes/cacheControl");
// const indexRouter = require("./routes/index");

const { readRecursively, knexDb } = require("./utils/routes.imports.utils");

// const passport = require("passport");

// const strategy = require("./middlewares/passport");
const path = require("path");
const app = express();
app.use(compression());

app.use(
  logger(":method :url :status :res[content-length] - :response-time ms ")
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//helmet middleware
app.use(helmet());
console.log("Initializing Passport.js with JWT strategy");

// passport.use(strategy);

console.log("Connecting to the database using Knex.js");

// import cors & cache routes
app.use(corsRouter);
app.use(cacheControl);

// Set EJS as the templating engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// import index route
// app.get("/", indexRouter);

// import other routes
try {
  // automatically import from folder router
  readRecursively("./controllers").then((result) => {
    result.map(async (item) => {
      if (
        !item.split(path.sep).includes("utils") &&
        item.split(".")[item.split(".").length - 1] != "xlsx"
      ) {
        let file = null;
        try {
          // Use path.join to resolve the file path correctly across different OS
          const modulePath = path.join(__dirname, item);
          console.log(`Importing module: ${modulePath}`);
          file = require(modulePath);
          app.use(file._router);
        } catch (err) {
          // eslint-disable-next-line
          console.error({ item, err });
        }
      }
    });
  });
} catch (err) {
  // eslint-disable-next-line
  console.error({ err });
}

// const employeeRouter = require('./controllers/Database/employee');
// app.use('/fetch-and-send-data', employeeRouter);

module.exports = app;
