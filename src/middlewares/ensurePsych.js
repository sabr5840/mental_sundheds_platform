// src/middlewares/ensurePsych.js
module.exports = (req, res, next) => {
    if (req.session.role !== 'psychologist') {
      // Du kan også redirecte med en flash-fejl:
      return res.status(403).send('Adgang nægtet – kun psykologer.');
    }
    next();
  };
  