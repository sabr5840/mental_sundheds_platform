// TODO ryd op, alt for ryddet og uoverskueligt kode

const pool       = require('../db/client');
const crypto     = require('crypto');
const categories = require('../config/categories');

/**
 * Helper: Genererer en tilfældig 25-tegns-kode
 */
function generateCode(length = 25) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * GET /psychologist
 * Dashboard: vis alle patient-kort
 */
exports.dashboard = async (req, res, next) => {
  try {
    const psychId = req.session.userId;

    const { rows: patients } = await pool.query(
      `SELECT u.id AS id, u.name AS name
       FROM patient_profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.psychologist_id = $1
       ORDER BY u.name`,
      [psychId]
    );

    res.render('psychologist/dashboard', { patients });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /psychologist/patients/new
 * Generér en ny, unik psykolog-kode og vis den
 */
exports.showNewPatient = async (req, res, next) => {
  try {
    const psychId = req.session.userId;
    let code;

    while (true) {
      code = generateCode(25);
      try {
        await pool.query(
          `INSERT INTO psychologist_codes (psychologist_id, code)
           VALUES ($1, $2)`,
          [psychId, code]
        );
        break;
      } catch (err) {
        if (err.code === '23505') {
          continue;
        }
        throw err;
      }
    }

    res.render('psychologist/newPatient', { code });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /psychologist/patients/:id
 * Vis én patients profil + alle noter grupperet efter kategori
 */
exports.showPatient = async (req, res, next) => {
  try {
    const psychId   = req.session.userId;
    const patientId = parseInt(req.params.id, 10);

    const { rows: profRows } = await pool.query(
      `SELECT u.name, p.birthdate, p.start_date
       FROM patient_profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1 AND p.psychologist_id = $2`,
      [patientId, psychId]
    );
    if (!profRows.length) {
      return res.status(404).send('Adgang nægtet til denne patient');
    }
    const profile = {
      name:      profRows[0].name,
      birthdate: profRows[0].birthdate,
      startDate: new Date(profRows[0].start_date)
    };

    const { rows: noteRows } = await pool.query(
      `SELECT id, title, category, created_at
       FROM notes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [patientId]
    );
    const notes = noteRows.map(r => ({
      id:        r.id,
      title:     r.title,
      category:  r.category,
      createdAt: new Date(r.created_at)
    }));

    const groupedNotes = {};
    categories.forEach(c => { groupedNotes[c] = []; });
    notes.forEach(n => {
      if (groupedNotes[n.category]) {
        groupedNotes[n.category].push(n);
      }
    });

    res.render('psychologist/viewPatient', {
      profile,
      categories,
      groupedNotes,
      patientId
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /psychologist/patients/:patientId/notes/:noteId
 * Vis en enkelt note for psykologen
 */
exports.viewNote = async (req, res, next) => {
  try {
    const psychId   = req.session.userId;
    const patientId = parseInt(req.params.patientId, 10);
    const noteId    = parseInt(req.params.noteId, 10);

    const { rowCount: profCount } = await pool.query(
      `SELECT 1
       FROM patient_profiles
       WHERE user_id = $1 AND psychologist_id = $2`,
      [patientId, psychId]
    );
    if (!profCount) {
      return res.status(404).send('Adgang nægtet til denne patient');
    }

    const { rows } = await pool.query(
      `SELECT title, content, category, created_at
       FROM notes
       WHERE id = $1 AND user_id = $2`,
      [noteId, patientId]
    );
    if (!rows.length) {
      return res.status(404).send('Note ikke fundet');
    }
    const note = {
      title:     rows[0].title,
      content:   rows[0].content,
      category:  rows[0].category,
      createdAt: new Date(rows[0].created_at)
    };

    // 3) Render view
    res.render('psychologist/viewNote', {
      patientId,
      note
    });
  } catch (err) {
    next(err);
  }
};
