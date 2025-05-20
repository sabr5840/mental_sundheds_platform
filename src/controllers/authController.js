// src/controllers/authController.js

const pool    = require('../db/client');
const bcrypt  = require('bcryptjs');

exports.showHome = (req, res) => {
  res.render('home');  // en simpel EJS med to knapper: Patient / Psykolog
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
    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Opret bruger
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, email, hash]
    );
    const userId = rows[0].id;

    // Opret patient_profile (inkl. birthdate og psych linkage via code)
    await pool.query(
      `INSERT INTO patient_profiles (user_id, birthdate)
       VALUES ($1, $2)`,
      [userId, birthdate]
    );

    // Hvis klinikken-kode indtastet, link patient til psykolog
    if (psychCode) {
      await pool.query(
        `UPDATE patient_profiles p
         SET psychologist_id = pc.psychologist_id
         FROM psychologist_codes pc
         WHERE p.user_id = $1 AND pc.code = $2`,
        [userId, psychCode]
      );
    }

    // Sæt session og send til eget dashboard
    req.session.userId = userId;
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
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      req.flash('error', 'Forkert e-mail eller kodeord');
      return res.redirect('/auth/login');
    }
    req.session.userId = user.id;
    // Redirect baseret på rolle
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
