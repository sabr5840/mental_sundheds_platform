const pool   = require('../db/client');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

exports.showLogin = (req, res) => {
  res.render('psychologist/login');
};

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array().map(e => e.msg));
    return res.redirect('/psychologist/login');
  }

  const { email, password, psychId } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT id, password_hash, role
       FROM users
       WHERE email = $1 AND role = 'psychologist'`,
      [email]
    );
    if (rows.length === 0) {
      req.flash('error', 'Forkert e-mail eller ikke psykolog');
      return res.redirect('/psychologist/login');
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      req.flash('error', 'Forkert kodeord');
      return res.redirect('/psychologist/login');
    }
    if (parseInt(psychId, 10) !== user.id) {
      req.flash('error', 'Forkert psykolog-ID');
      return res.redirect('/psychologist/login');
    }
    req.session.userId = user.id;
    req.session.role   = user.role;
    res.redirect('/psychologist');
  } catch (err) {
    next(err);
  }
};
