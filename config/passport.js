const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const dbPromise = require('../db');
const UtentiDAO = require('../daos/UtentiDAO');

async function initialize(passport) {
  const db = await dbPromise;
  const utentiDAO = new UtentiDAO(db);

  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const e = String(email || '').trim().toLowerCase();
      const user = await utentiDAO.getByEmail(e);

      if (!user) {
        return done(null, false, { message: 'Credenziali non valide' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: 'Credenziali non valide' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await utentiDAO.getById(id);
      if (!user) return done(null, false);
      const { password, ...safeUser } = user; //tolgo password prima di passare oggetto all'app
      //per non avere mai la password hashata in req.user cioè nelle var accessibili dalle view e dal codice server 
      done(null, safeUser);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
