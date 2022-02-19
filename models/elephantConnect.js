const { Pool } = require('pg');

const PG_URI = process.env.DB_elephant;

const pool = new Pool({
  connectionString: PG_URI,
});

pool.on('connect', () => {
  console.log('connected to database');
});

module.exports = {
  PG_URI,
  query: (text, params, callback) => {
    console.log('executed query', text);
    return pool.query(text, params, callback);
  },
};
