// src/app.js

const express      = require('express');
const helmet       = require('helmet');
const session      = require('cookie-session');
const flash        = require('connect-flash');
const passport     = require('passport');
const path         = require('path');
const config       = require('./config');
const errorHandler = require('./middlewares/errorHandler');
const cron         = require('node-cron');
const pool         = require('./db/client');

const app = express();

// 1) Sikkerheds-headers + body-parser
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2) Sessions (cookie-session)
app.use(session({
  name: 'session',
  keys: [config.sessionSecret],
  maxAge: 24 * 60 * 60 * 1000
}));

// 3) Flash-beskeder
app.use(flash());
app.use((req, res, next) => {
  res.locals.error   = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

// 4) Passport-init (til senere OIDC)
app.use(passport.initialize());
app.use(passport.session());

// 5) EJS setup (uden layouts)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 6) Mount routers
app.use(require('./routes/auth'));
app.use('/notes', require('./routes/notes'));
app.use('/psychologist', require('./routes/psychologist'));

// 7) Global fejl-handler
app.use(errorHandler);

// 8) Start server
app.listen(config.port, () => {
  console.log(`Server kører på http://localhost:${config.port}`);
});

// 9) Cron-job: slet noter ældre end 1 måned hver nat kl. 03:00
cron.schedule('0 3 * * *', async () => {
  try {
    await pool.query(
      `DELETE FROM notes WHERE created_at < NOW() - INTERVAL '1 month'`
    );
    console.log('Ældre noter end 1 måned slettet.');
  } catch (err) {
    console.error('Kunne ikke rydde gamle noter:', err);
  }
});
