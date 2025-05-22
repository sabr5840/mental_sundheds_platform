// src/routes/psychologist.js

const express             = require('express');
const router              = express.Router();
const flash               = require('connect-flash');
const ensureAuth          = require('../middlewares/ensureAuth');
const ensureRole          = require('../middlewares/ensureRole');
const psychController     = require('../controllers/psychController');
const psychAuthController = require('../controllers/psychAuthController');
const { body }            = require('express-validator');

// Flash‐middleware til login‐sider
router.use(flash());
router.use((req, res, next) => {
  res.locals.error = req.flash('error');
  next();
});

// 1) Offentlige ruter: psykolog‐login
router.get('/login',  psychAuthController.showLogin);
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Ugyldig e-mail'),
    body('password').notEmpty().withMessage('Indtast kodeord'),
    body('psychId').isInt().withMessage('Psykolog-ID skal være et tal')
  ],
  psychAuthController.login
);

// 2) Beskyttede ruter – kun psykologer
const guard = [ensureAuth, ensureRole('psychologist')];

router.get('/',                     ...guard, psychController.dashboard);
router.get('/patients/new',        ...guard, psychController.showNewPatient);
router.get('/patients/:id',        ...guard, psychController.showPatient);
router.get(
  '/patients/:patientId/notes/:noteId',
   ...guard,
   psychController.viewNote
);

module.exports = router;
