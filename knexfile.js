/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

// Load environment variables from the appropriate .env file
require("dotenv-flow").config({ silent: true });

// Load knex configuration
const knexConfig = require("./configs/db");

module.exports = {
  ...knexConfig,
  migrations: {
    directory: "./configs/migrations",
  },
  seeds: {
    directory: "./configs/seeds",
  },
};
