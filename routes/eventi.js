const express = require("express");
const router = express.Router();
const dbPromise = require("../db");
const EventiDAO = require('../daos/EventiDAO');
const { onlyAdmin } = require("../middleware/auth");


// GET /eventi - mostra lista eventi o risultati ricerca
router.get("/", async (req, res) => {
  const db = await dbPromise;
  const eventiDao = new EventiDAO(db);
  const query = req.query.q;
  let eventi = [];

  try {
    if (query && query.trim().length > 0) {
      eventi = await eventiDao.cerca(query);
    } else {
      eventi = await eventiDao.getTutti();
    }

    res.render("eventi", { eventi, query });
  } catch (err) {
    console.error("Errore durante il caricamento degli eventi:", err);
    res.status(500).send("Errore durante il caricamento degli eventi.");
  }
});

//GET /eventi/nuovo → form creazione evento
router.get("/nuovo", onlyAdmin, (req, res) => {
  res.render("admin/evento-form", { evento: null });
});

//POST /eventi/nuovo → salvataggio nuovo evento
router.post("/nuovo", onlyAdmin, async (req, res) => {
  const db = await dbPromise;
  const eventiDao = new EventiDAO(db);
  const { titolo, descrizione, data, immagine } = req.body;

  try {
    await eventiDao.aggiungi({ titolo, descrizione, data, immagine, creato_da: req.user.id });
    res.redirect("/eventi");
  } catch (err) {
    console.error("Errore creazione evento:", err);
    res.status(500).send("Errore durante la creazione dell’evento.");
  }
});

//GET /eventi/modifica/:id → form modifica evento
router.get("/modifica/:id", onlyAdmin, async (req, res) => {
  const db = await dbPromise;
  const eventiDao = new EventiDAO(db);

  try {
    const evento = await eventiDao.getById(req.params.id);
    if (!evento) return res.status(404).send("Evento non trovato");
    res.render("admin/evento-form", { evento });
  } catch (err) {
    console.error("Errore caricamento evento:", err);
    res.status(500).send("Errore durante il caricamento.");
  }
});

//POST /eventi/modifica/:id → salva modifiche
router.post("/modifica/:id", onlyAdmin, async (req, res) => {
  const db = await dbPromise;
  const eventiDao = new EventiDAO(db);
  const { titolo, descrizione, data, immagine } = req.body;

  try {
    await eventiDao.modifica(req.params.id, { titolo, descrizione, data, immagine });
    res.redirect("/eventi");
  } catch (err) {
    console.error("Errore modifica evento:", err);
    res.status(500).send("Errore durante la modifica.");
  }
});

//POST /eventi/elimina/:id → elimina evento
router.post("/elimina/:id", onlyAdmin, async (req, res) => {
  const db = await dbPromise;
  const eventiDao = new EventiDAO(db);

  try {
    await eventiDao.elimina(req.params.id);
    res.redirect("/eventi");
  } catch (err) {
    console.error("Errore eliminazione evento:", err);
    res.status(500).send("Errore durante l’eliminazione.");
  }
});




module.exports = router;
