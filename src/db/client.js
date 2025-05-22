const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.dbUrl
});

pool.on('error', (err) => {
  console.error('UBEHANDLET DB-ERROR:', err);
  process.exit(-1);
});

module.exports = pool;
