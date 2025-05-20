

// src/middlewares/ensureRole.js
module.exports = function ensureRole(requiredRole) {
    return (req, res, next) => {
      if (req.session.role !== requiredRole) {
        // enten en 403 eller redirect til en "adgang nægtet"-side
        return res.status(403).send('Adgang nægtet');
      }
      next();
    };
  };

//Dette wrapper-mønster gør det let at genbruge på alle ruter, hvor en bestemt rolle kræves.


