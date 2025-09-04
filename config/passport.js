const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const dbPromise = require('../db');
const UtentiDAO = require('../daos/UtentiDAO');

async function initialize(passport) {
  const db = await dbPromise;
  const utentiDAO = new UtentiDAO(db);

  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await utentiDAO.getByEmail(email);

      if (!user) {
        return done(null, false, { message: 'Email non registrata' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: 'Password errata' });
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
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
