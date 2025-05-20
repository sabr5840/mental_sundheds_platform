// src/routes/psychologist.js
const express              = require('express');
const router               = express.Router();
const flash                = require('connect-flash');
const ensureAuth           = require('../middlewares/ensureAuth');
const ensurePsych          = require('../middlewares/ensurePsych');
const psychController      = require('../controllers/psychController');
const psychAuthController  = require('../controllers/psychAuthController');

// 1) Psykolog-login (offentligt)
router.use(flash());
router.use((req, res, next) => {
  res.locals.error = req.flash('error');
  next();
});

router.get('/login',  psychAuthController.showLogin);
router.post('/login', psychAuthController.login);

// Beskyt alle nedenstående ruter med både login + psykolog-rolle
const guard = [ensureAuth, ensurePsych];

// 2) Dashboard
router.get('/', ...guard, psychController.dashboard);

// 3) Opret ny patient – generér og vis kode
router.get('/patients/new', ...guard, psychController.showNewPatient);

// 4) Vis én patients dashboard
router.get('/patients/:id', ...guard, psychController.showPatient);

// NY LINJE – én note
router.get(
  '/patients/:patientId/notes/:noteId',
  ...guard,
  psychController.viewNote
);

module.exports = router;
