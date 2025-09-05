const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const dbPromise = require("../db");
const UtentiDAO = require("../daos/UtentiDAO");
const validator = require('validator');

// GET /register → mostra il form
router.get("/", (req, res) => {
  res.render("register");
});


// POST /register → salva nel DB
router.post("/", async (req, res) => {
  const db = await dbPromise;
  const utentiDAO = new UtentiDAO(db);
  const email = String(req.body.email || "").trim().toLowerCase(); //quando si riceve mail dal form viene normalizzata 
  const username = String(req.body.username || "").trim();
  const password = req.body.password;
  const ruolo = req.body.ruolo;

  //validazione inserimenti 
  if (!username || !email || !password || !ruolo) {
    return res.status(400).send("Tutti i campi sono obbligatori.");
  }

  // email valida? 
  if (!validator.isEmail(email)) {
    return res.status(400).render("register", { errore: "Email non valida." });
  }

  // Username: solo lettere/numeri, 3-30 caratteri
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return res.status(400).render("register", { errore: "Username non valido. Solo lettere, numeri, underscore (3-30 caratteri)." });
  }

  // Password: minimo 8 caratteri, almeno una lettera e un numero
  if (
    !validator.isLength(password, { min: 8 }) ||
    !/[a-zA-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return res.status(400).render("register", { errore: "Password troppo debole. Minimo 8 caratteri, almeno una lettera e un numero." });
  }

  // Ruolo valido (selezione dal form, evita hack)
  const ruoliValidi = ["visitatore", "espositore", "admin"];
  if (!ruoliValidi.includes(ruolo)) {
    return res.status(400).render("register", { errore: "Ruolo non valido." });
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
    res.status(500).render("register", { errore: "Errore interno durante la registrazione." });
  }
});

module.exports = router;
