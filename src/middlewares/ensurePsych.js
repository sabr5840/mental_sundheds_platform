module.exports = (req, res, next) => {
    if (req.session.role !== 'psychologist') {
      return res.status(403).send('Adgang nægtet – kun psykologer.');
    }
    next();
  };
  