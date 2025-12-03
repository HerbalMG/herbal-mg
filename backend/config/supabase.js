const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;

// Configure postgres with proper connection handling
const sql = postgres(connectionString, {
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false, // Disable prepared statements to avoid "does not exist" errors
  onnotice: () => {}, // Suppress notices
});

module.exports = sql;