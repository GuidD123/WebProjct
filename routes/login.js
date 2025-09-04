const express = require('express');
const passport = require('passport');
const router = express.Router();


// GET /login → mostra il form login
router.get('/', (req, res) => {
  const errore = req.session.messages?.[0] || null; 
  req.session.messages = []; //reset messaggi 
  res.render('login', { errore });
});

// POST
//mi permette di passare info.message (tipo "email non registrata") come query string 
router.post('/', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.redirect('/login?errore=' + encodeURIComponent(info.message));
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect('/areapersonale');
    });
  })(req, res, next);
});


// GET /logout → termina sessione
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;
