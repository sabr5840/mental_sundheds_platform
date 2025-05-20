// src/app.js

const express      = require('express');
const helmet       = require('helmet');
const session      = require('cookie-session');
const flash        = require('connect-flash');
const passport     = require('passport');
const path         = require('path');
const cron         = require('node-cron');
const pool         = require('./db/client');
const config       = require('./config');
const ensureAuth   = require('./middlewares/ensureAuth');
const ensureRole   = require('./middlewares/ensureRole');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// 1) Security headers + body parser
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2) Sessions (cookie-session)
app.use(session({
  name: 'session',
  keys: [config.sessionSecret],
  maxAge: 24 * 60 * 60 * 1000,     // 1 dag
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
}));

// 3) Flash messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.error   = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

// 4) Passport init
app.use(passport.initialize());
app.use(passport.session());

// 5) EJS setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 6) Mount routers

// Public auth routes
app.use(require('./routes/auth'));

// Patient routes (kun patienter)
app.use(
  '/notes',
  ensureAuth,
  ensureRole('patient'),
  require('./routes/notes')
);

// Psykolog routes
app.use(
  '/psychologist',
  require('./routes/psychologist')
);

// 7) Global error handler
app.use(errorHandler);

// 8) Start server
app.listen(config.port, () => {
  console.log(`Server kører på http://localhost:${config.port}`);
});

