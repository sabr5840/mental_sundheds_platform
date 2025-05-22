require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET
};
