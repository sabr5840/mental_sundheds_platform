
module.exports = (err, req, res, next) => {
  console.error('FEJL:', err);

  if (req.method === 'POST' && req.get('Referrer')) {
    req.flash('error', 'Der opstod en fejl – prøv igen!');
    return res.redirect('back');
  }
  res.status(500);
  res.render('error', {
    message: 'Der opstod en fejl. Prøv igen senere.',
    error: process.env.NODE_ENV === 'development' ? err : null
  });
};
