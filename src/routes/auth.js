// src/routes/auth.js

const express        = require('express');
const router         = express.Router();
const flash          = require('connect-flash');
const authController = require('../controllers/authController');

// Flash-middleware
router.use(flash());
router.use((req, res, next) => {
  res.locals.error   = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

// Hjem / rollevælger
router.get('/', authController.showHome);

// Patient-registrering & login
router.get('/auth/register', authController.showRegister);
router.post('/auth/register', authController.register);
router.get('/auth/login',    authController.showLogin);
router.post('/auth/login',   authController.login);

// Logout (både roller)
router.post('/auth/logout',  authController.logout);

module.exports = router;
