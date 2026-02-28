const { Pool } = require("pg");
const env = require("./env");

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString: env.databaseUrl,
  // Render Postgres requires TLS even internally
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
