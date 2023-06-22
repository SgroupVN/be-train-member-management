const knex = require('knex');

const knexConnection = knex({
  client: process.env.DB_DRIVER ?? 'mysql',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 5000,
    query_timeout: 5000,
    requestTimeout: 5000,
  },
  pool: {
    max: 7,
    min: 3,
  }
});

module.exports = knexConnection;
