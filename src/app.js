// src/app.js

const express      = require('express');
const helmet       = require('helmet');
const session      = require('cookie-session');
const flash        = require('connect-flash');
const path         = require('path');
const config       = require('./config');
const ensureAuth   = require('./middlewares/ensureAuth');
const ensureRole   = require('./middlewares/ensureRole');
const errorHandler = require('./middlewares/errorHandler');
const csrf         = require('csurf');
const rateLimit    = require('express-rate-limit');
const crypto       = require('crypto');

const app = express();

app.set('trust proxy', 1);

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  [
        "'self'",
        (req, res) => `'nonce-${res.locals.nonce}'`
      ],
      styleSrc:   [
        "'self'",
        (req, res) => `'nonce-${res.locals.nonce}'`
      ],
      objectSrc:       ["'none'"],
      frameAncestors:  ["'none'"],
      
    }
  })
);

app.use(
  helmet.hsts({
    maxAge: 31536000,       // 1 år
    includeSubDomains: true,
    preload: true
  })
);

app.use(
  helmet.referrerPolicy({ policy: 'no-referrer' })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutter
  max: 10,
  message: 'For mange forsøg – prøv igen om lidt.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth/login',        authLimiter);
app.use('/auth/register',     authLimiter);
app.use('/psychologist/login', authLimiter);

app.use(
  session({
    name: 'session',
    keys: [config.sessionSecret],
    maxAge: 24 * 60 * 60 * 1000, // 1 dag
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
);

app.use(flash());
app.use((req, res, next) => {
  res.locals.error   = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

app.use(csrf());
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(require('./routes/auth'));
app.use(
  '/notes',
  ensureAuth,
  ensureRole('patient'),
  require('./routes/notes')
);
app.use(
  '/psychologist',
  require('./routes/psychologist')
);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server kører på http://localhost:${config.port}`);
});
