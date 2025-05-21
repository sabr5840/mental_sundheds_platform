// src/controllers/authController.js

const pool    = require('../db/client');
const bcrypt  = require('bcryptjs');

exports.showHome = (req, res) => {
  res.render('home');  // EJS med to knapper: Patient / Psykolog
};

exports.showRegister = (req, res) => {
  res.render('auth/register');
};

exports.register = async (req, res, next) => {
  const { name, email, password, passwordConfirm, birthdate, psychCode } = req.body;
  if (password !== passwordConfirm) {
    req.flash('error', 'Koderordene matcher ikke');
    return res.redirect('/auth/register');
  }
  try {
    // 1) Hash password
    const hash = await bcrypt.hash(password, 12);

    // 2) Opret bruger
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, role`,
      [name, email, hash]
    );
    const userId = rows[0].id;

    // 3) Opret patient_profile (uden psykolog‐link foreløbig)
    await pool.query(
      `INSERT INTO patient_profiles (user_id, birthdate)
       VALUES ($1, $2)`,
      [userId, birthdate]
    );

    // 4) Hvis kode indtastet, link til psykolog
    if (psychCode) {
      await pool.query(
        `UPDATE patient_profiles p
         SET psychologist_id = pc.psychologist_id
         FROM psychologist_codes pc
         WHERE p.user_id = $1 AND pc.code = $2`,
        [userId, psychCode]
      );
    }

    // 5) Sæt session + rolle, og redirect til patient‐dashboard
    req.session.userId = userId;
    req.session.role   = 'patient';
    res.redirect('/notes');
  } catch (err) {
    if (err.code === '23505') {
      req.flash('error', 'E-mailen er allerede registreret');
      return res.redirect('/auth/register');
    }
    next(err);
  }
};

exports.showLogin = (req, res) => {
  res.render('auth/login');
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Hent bruger og rolleanvisning
    const { rows } = await pool.query(
      `SELECT id, password_hash, role
       FROM users
       WHERE email = $1`,
      [email]
    );
    if (!rows.length) {
      req.flash('error', 'Forkert e-mail eller kodeord');
      return res.redirect('/auth/login');
    }
    const user = rows[0];

    // 1) Verificér password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      req.flash('error', 'Forkert e-mail eller kodeord');
      return res.redirect('/auth/login');
    }

    // 2) Sæt session‐data
    req.session.userId = user.id;
    req.session.role   = user.role;

    // 3) Redirect pr. rolle
    if (user.role === 'psychologist') {
      return res.redirect('/psychologist');
    }
    res.redirect('/notes');
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  req.session = null;
  res.redirect('/');
};
