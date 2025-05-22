// src/controllers/authController.js
const { validationResult } = require('express-validator');
const pool    = require('../db/client');
const bcrypt  = require('bcryptjs');

exports.showHome = (req, res) => {
  res.render('home');
};

exports.showRegister = (req, res) => {
  res.render('auth/register', { error: [], old: {} });
};

exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  const { name, email, password, passwordConfirm, birthdate, psychCode } = req.body;
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/register', {
      error: errors.array().map(e => e.msg),
      old: req.body
    });
  }
  try {
    const hash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, role`,
      [name, email, hash]
    );
    const userId = rows[0].id;

    await pool.query(
      `INSERT INTO patient_profiles (user_id, birthdate)
       VALUES ($1, $2)`,
      [userId, birthdate]
    );

    if (psychCode) {
      await pool.query(
        `UPDATE patient_profiles p
         SET psychologist_id = pc.psychologist_id
         FROM psychologist_codes pc
         WHERE p.user_id = $1 AND pc.code = $2`,
        [userId, psychCode]
      );
    }

    req.session.userId = userId;
    req.session.role   = 'patient';
    res.redirect('/notes');
  } catch (err) {
    if (err.code === '23505') {
      return res.status(422).render('auth/register', {
        error: ['E-mailen er allerede registreret'],
        old: req.body
      });
    }
    next(err);
  }
};

exports.showLogin = (req, res) => {
  res.render('auth/login', { error: [], old: {} });
};

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      error: errors.array().map(e => e.msg),
      old: req.body
    });
  }

  const { email, password } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT id, password_hash, role
       FROM users
       WHERE email = $1`,
      [email]
    );
    if (!rows.length) {
      return res.status(422).render('auth/login', {
        error: ['Forkert e-mail eller kodeord'],
        old: req.body
      });
    }
    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(422).render('auth/login', {
        error: ['Forkert e-mail eller kodeord'],
        old: req.body
      });
    }

    req.session.userId = user.id;
    req.session.role   = user.role;

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
