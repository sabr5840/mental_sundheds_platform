// src/routes/auth.js

const express        = require('express');
const router         = express.Router();
const flash          = require('connect-flash');
const authController = require('../controllers/authController');
const { body } = require('express-validator');

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

router.post(
  '/auth/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 60 }).withMessage('Navn skal være mellem 2 og 60 tegn'),
    body('email')
      .trim()
      .isEmail().withMessage('Ugyldig email'),
    body('password')
      .isLength({ min: 8 }).withMessage('Kodeord skal være mindst 8 tegn'),
    body('passwordConfirm')
      .custom((value, { req }) => value === req.body.password).withMessage('Koderordene matcher ikke'),
    body('birthdate')
      .isDate().withMessage('Ugyldig fødselsdato'),
    body('psychCode')
      .optional({ checkFalsy: true })
      .isLength({ min: 25, max: 25 }).withMessage('Psykologkode skal være 25 tegn'),
  ],
  authController.register
);

router.get('/auth/login', authController.showLogin);

router.post(
  '/auth/login',
  [
    body('email').trim().isEmail().withMessage('Ugyldig e-mail'),
    body('password').notEmpty().withMessage('Indtast kodeord')
  ],
  authController.login
);

// Logout (både roller)
router.post('/auth/logout',  authController.logout);

module.exports = router;
