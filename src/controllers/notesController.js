// src/controllers/notesController.js

const pool       = require('../db/client');
const categories = require('../config/categories');

/**
 * GET /notes
 * Dashboard: grupperede noter pr. kategori
 */
exports.dashboard = async (req, res, next) => {
  try {
    const userId = req.session.userId;

    // Hent brugerens navn
    const { rows: userRows } = await pool.query(
      `SELECT name FROM users WHERE id = $1`,
      [userId]
    );
    const userName = userRows[0]?.name || 'bruger';

    // Hent noter
    const { rows: noteRows } = await pool.query(
      `SELECT id, title, category, created_at
       FROM notes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    const notes = noteRows.map(r => ({
      id:        r.id,
      title:     r.title,
      category:  r.category,
      createdAt: new Date(r.created_at)
    }));

    // Gruppér noter pr. kategori
    const groupedNotes = {};
    categories.forEach(c => groupedNotes[c] = []);
    notes.forEach(n => {
      if (groupedNotes[n.category]) {
        groupedNotes[n.category].push(n);
      }
    });

    // Render dashboard-view
    res.render('notes/dashboard', {
      userName,
      categories,
      groupedNotes
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /notes/list
 * Lineær liste over alle noter
 */
exports.list = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { rows } = await pool.query(
      `SELECT id, title, created_at
       FROM notes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    const notes = rows.map(r => ({
      id:        r.id,
      title:     r.title,
      createdAt: new Date(r.created_at)
    }));
    res.render('notes/list', { notes });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /notes/new
 * Vis formular til at oprette ny note
 */
exports.showNewForm = (req, res) => {
  res.render('notes/new', { categories });
};

/**
 * POST /notes
 * Opret ny note
 */
exports.create = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { title, content, category } = req.body;
    await pool.query(
      `INSERT INTO notes (user_id, title, content, category)
       VALUES ($1, $2, $3, $4)`,
      [userId, title, content, category]
    );
    res.redirect('/notes');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /notes/:id
 * Vis en enkelt note
 */
exports.show = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const noteId = parseInt(req.params.id, 10);

    const { rows } = await pool.query(
      `SELECT id, title, content, category, created_at
       FROM notes
       WHERE id = $1 AND user_id = $2`,
      [noteId, userId]
    );
    if (!rows.length) {
      return res.status(404).send('Note ikke fundet');
    }
    const note = {
      id:        rows[0].id,
      title:     rows[0].title,
      content:   rows[0].content,
      category:  rows[0].category,
      createdAt: new Date(rows[0].created_at)
    };
    res.render('notes/show', { note });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /notes/:id/edit
 * Vis formular til at redigere en note
 */
exports.showEditForm = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const noteId = parseInt(req.params.id, 10);

    const { rows } = await pool.query(
      `SELECT id, title, content, category
       FROM notes
       WHERE id = $1 AND user_id = $2`,
      [noteId, userId]
    );
    if (!rows.length) {
      return res.status(404).send('Note ikke fundet');
    }
    res.render('notes/edit', { note: rows[0], categories });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notes/:id/edit
 * Opdater en eksisterende note
 */
exports.update = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const noteId = parseInt(req.params.id, 10);
    const { title, content, category } = req.body;

    const result = await pool.query(
      `UPDATE notes
       SET title = $1, content = $2, category = $3
       WHERE id = $4 AND user_id = $5`,
      [title, content, category, noteId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).send('Note ikke fundet eller ingen adgang');
    }
    res.redirect(`/notes/${noteId}`);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notes/:id/delete
 * Slet en note
 */
exports.remove = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const noteId = parseInt(req.params.id, 10);

    const result = await pool.query(
      `DELETE FROM notes
       WHERE id = $1 AND user_id = $2`,
      [noteId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).send('Note ikke fundet eller ingen adgang');
    }
    res.redirect('/notes');
  } catch (err) {
    next(err);
  }
};
