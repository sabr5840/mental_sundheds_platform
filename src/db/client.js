const { Pool } = require('pg');
const config = require('../config');

// Opret en pool med connection string fra .env
const pool = new Pool({
  connectionString: config.dbUrl
});

// Optional: test for en forbindelse ved opstart
pool.on('error', (err) => {
  console.error('UBEHANDLET DB-ERROR:', err);
  process.exit(-1);
});

module.exports = pool;
