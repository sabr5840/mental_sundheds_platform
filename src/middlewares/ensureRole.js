

module.exports = function ensureRole(requiredRole) {
    return (req, res, next) => {
      if (req.session.role !== requiredRole) {
        return res.status(403).send('Adgang nægtet');
      }
      next();
    };
  };



