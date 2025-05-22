// src/routes/notes.js
const express         = require('express');
const router          = express.Router();
const ensureAuth      = require('../middlewares/ensureAuth');
const notesController = require('../controllers/notesController');
const { body }        = require('express-validator');

// Inputvalidering til noter
const noteValidation = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 80 }).withMessage('Titel skal være mellem 2 og 80 tegn'),
  body('category')
    .isString().isLength({ min: 2, max: 50 }).withMessage('Vælg en kategori'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('Indhold kan ikke være tomt og maks 2000 tegn')
];

// Dashboard – grupperede notes
router.get('/',               ensureAuth, notesController.dashboard);
// Lineær liste
router.get('/list',           ensureAuth, notesController.list);
// Opret ny
router.get('/new',            ensureAuth, notesController.showNewForm);
router.post('/',              ensureAuth, noteValidation, notesController.create);
// Vis enkelt note
router.get('/:id',            ensureAuth, notesController.show);
// Rediger
router.get('/:id/edit',       ensureAuth, notesController.showEditForm);
router.post('/:id/edit',      ensureAuth, noteValidation, notesController.update);
// Slet
router.post('/:id/delete',    ensureAuth, notesController.remove);

module.exports = router;
