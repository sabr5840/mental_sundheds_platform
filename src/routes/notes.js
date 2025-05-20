// src/routes/notes.js
const express         = require('express');
const router          = express.Router();
const ensureAuth      = require('../middlewares/ensureAuth');
const notesController = require('../controllers/notesController');

// Dashboard – grupperede notes
router.get('/',               ensureAuth, notesController.dashboard);
// Lineær liste
router.get('/list',           ensureAuth, notesController.list);
// Opret ny
router.get('/new',            ensureAuth, notesController.showNewForm);
router.post('/',              ensureAuth, notesController.create);
// Vis enkelt note
router.get('/:id',            ensureAuth, notesController.show);
// Rediger
router.get('/:id/edit',       ensureAuth, notesController.showEditForm);
router.post('/:id/edit',      ensureAuth, notesController.update);
// Slet
router.post('/:id/delete',    ensureAuth, notesController.remove);

module.exports = router;
