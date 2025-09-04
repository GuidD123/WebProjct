const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const dbPromise = require("../db");
const UtentiDAO = require("../daos/UtentiDAO");

// GET /register → mostra il form
router.get("/", (req, res) => {
  res.render("register");
});

// POST /register → salva nel DB
router.post("/", async (req, res) => {
  const db = await dbPromise;
  const utentiDAO = new UtentiDAO(db);
  const { username, email, password, ruolo } = req.body;

  if (!username || !email || !password || !ruolo) {
    return res.status(400).send("Tutti i campi sono obbligatori.");
  }

  try {
    const utenteEsistente = await utentiDAO.getByEmail(email);

    if (utenteEsistente) {
      return res.status(409).send("Email già registrata.");
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT || "10");
    const hash = await bcrypt.hash(password, saltRounds);

    await utentiDAO.creaUtente({
      username,
      email,
      password: hash,
      ruolo, // 'visitatore', 'espositore', 'admin' ecc. – dipende da form
    });


    res.redirect("/login"); // login.ejs già previsto nel tuo progetto
  } catch (err) {
    console.error("Errore durante la registrazione:", err);
    res.status(500).send("Errore interno durante la registrazione.");
  }
});

module.exports = router;
