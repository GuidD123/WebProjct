const express = require('express');
const router = express.Router();
const dbPromise = require('../db');
const StandDAO = require('../daos/StandDAO');
const { onlyEspositore } = require('../middleware/auth');

// GET /stand - mostra gli stand disponibili
router.get("/", async (req, res) => {
  try {
    const db = await dbPromise;
    const standDao = new StandDAO(db);

    const tuttiGliStand = await standDao.getTutti();
    const standDisponibili = tuttiGliStand.filter(s => s.disponibile);

    const form = req.isAuthenticated?.() &&
                (req.user?.ruolo === 'espositore' || req.user?.ruolo === 'admin');

    res.render("stand", {
      stand: standDisponibili,
      form,
      query: req.query
    });
  } catch (err) {
    console.error('Errore caricamento stand:', err);
    res.status(500).send("Errore durante il caricamento degli stand.");
  }
});

// POST /stand/prenota - solo espositori
router.post('/prenota', onlyEspositore, async (req, res) => {
  const db = await dbPromise;
  const standDao = new StandDAO(db);
  const { standId } = req.body;
  const userId = req.user.id;

  try {
    if (!standId) {
      return res.status(400).send("Stand mancante!");
    }

    const stand = await standDao.getById(standId);
    if (!stand || !stand.disponibile) {
      return res.status(400).send("Stand non disponibile.");
    }

    const alreadyExist = await standDao.haPrenotato(userId, standId);
    if (alreadyExist) {
      return res.status(400).send("Hai già prenotato questo stand!");
    }

    await db.run('BEGIN');

    try {
      await standDao.prenota(userId, standId);
      await standDao.setDisponibile(standId, 0);
      await db.run('COMMIT');
      res.redirect('/stand?successo=1');
    } catch (transactionErr) {
      await db.run('ROLLBACK');
      throw transactionErr;
    }
  } catch (err) {
    console.error('Errore prenotazione stand:', err);
    res.status(500).send("Errore durante la prenotazione.");
  }
});

// POST /stand/annulla - solo espositori
router.post('/annulla', onlyEspositore, async (req, res) => {
  const db = await dbPromise;
  const standDao = new StandDAO(db);
  const { standId } = req.body;
  const userId = req.user.id;

  try {
    if (!standId) {
      return res.status(400).send("ID stand mancante!");
    }

    const prenotazione = await standDao.haPrenotato(userId, standId);
    if (!prenotazione) {
      return res.status(400).send("Prenotazione non trovata!");
    }

    await db.run('BEGIN');

    try {
      await standDao.annulla(userId, standId);
      await standDao.setDisponibile(standId, 1);
      await db.run('COMMIT');
      res.redirect('/areapersonale?annulla=ok');
    } catch (transactionErr) {
      await db.run('ROLLBACK');
      throw transactionErr;
    }
  } catch (err) {
    console.error('Errore annullamento prenotazione:', err);
    res.status(500).send("Errore durante l'annullamento.");
  }
});

module.exports = router;
