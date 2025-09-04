//Accesso DB centralizzato con UtentiDAO, che:

    //recupera l’utente (getById)

    //aggiorna username/email (modificaUtente)

    //cambia la password (cambiaPassword)

//Le query per biglietti_acquistati e prenotazioni restano nella route


//Aggiornamento sessione dopo modifica profilo fatto con:

    //req.login({ ...req.user, username, email }, callback)

//Questo mantiene aggiornata req.user, evitando di avere dati vecchi in sessione.


//Controlli robusti:

    //email già in uso? → errore

    //nuova password uguale alla conferma? → se no: errore

   //password attuale? → verificata con bcrypt.compare()






const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const dbPromise = require("../db");
const bcrypt = require("bcrypt");
const UtentiDAO = require("../daos/UtentiDAO");

// Rotta area personale
router.get("/areapersonale", ensureAuthenticated, async (req, res) => {
  const db = await dbPromise;
  const user = req.user;
  const utentiDAO = new UtentiDAO(db);

  let biglietti = [];
  let stand = [];

  try {
    if (user.ruolo === "utente") {
      biglietti = await db.all(
        `SELECT ob.*, b.nome, b.prezzo
         FROM biglietti_acquistati ob
         JOIN biglietti b ON ob.biglietto_id = b.id
         WHERE ob.utente_id = ?`,
        [user.id]
      );
    }

    if (user.ruolo === "espositore") {
      stand = await db.all(
        `SELECT s.*, p.data_prenotazione
         FROM prenotazioni p
         JOIN stand s ON s.id = p.stand_id
         WHERE p.utente_id = ?`,
        [user.id]
      );
    }

    res.render("areapersonale", { user, biglietti, stand, query: req.query });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore nel caricamento dell'area personale.");
  }
});

// Modifica username/email
router.post("/areapersonale/modifica", ensureAuthenticated, async (req, res) => {
  const db = await dbPromise;
  const utentiDAO = new UtentiDAO(db);
  const { username, email } = req.body;
  const userId = req.user.id;

  try {
    const emailEsistente = await db.get(
      "SELECT * FROM utenti WHERE email = ? AND id != ?",
      [email, userId]
    );
    if (emailEsistente)
      return res.status(400).send("Email già in uso da un altro utente");

    await utentiDAO.modificaUtente(userId, { username, email });

    // aggiorna sessione
    req.login({ ...req.user, username, email }, (err) => {
      if (err) console.error("Errore aggiornamento sessione:", err);
      res.redirect("/areapersonale?modifica=ok");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante la modifica del profilo.");
  }
});

// Cambio password
router.post("/areapersonale/cambia-password", ensureAuthenticated, async (req, res) => {
  const db = await dbPromise;
  const utentiDAO = new UtentiDAO(db);
  const { passwordAttuale, nuovaPassword, confermaPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await utentiDAO.getById(userId);
    const match = await bcrypt.compare(passwordAttuale, user.password);

    if (!match || nuovaPassword !== confermaPassword) {
      return res.redirect("/areapersonale?password=err");
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT || "10");
    const hash = await bcrypt.hash(nuovaPassword, saltRounds);

    await utentiDAO.cambiaPassword(userId, hash);
    res.redirect("/areapersonale?password=ok");
  } catch (err) {
    console.error(err);
    res.redirect("/areapersonale?password=err");
  }
});

module.exports = router;
