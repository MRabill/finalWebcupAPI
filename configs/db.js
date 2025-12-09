/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const db = {
  client: "pg",
  connection: {
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
};

module.exports = db;
