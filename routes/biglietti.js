const express = require("express");
const router = express.Router();
const dbPromise = require("../db");
const { ensureAuthenticated } = require("../middleware/auth");
const BigliettiDAO = require("../daos/BigliettiDAO");

// rotta per pagina 'biglietti'
router.get("/", async (req, res) => {
  try {
    const db = await dbPromise;
    const carrello = req.session.carrello || [];
    const dao = new BigliettiDAO(db);
    const biglietti = await dao.getDisponibili();

    res.render("biglietti", { biglietti, carrello });
  } catch (err) {
    console.error("Errore nella GET /biglietti", err);
    res.status(500).render("500", { titolo: "Errore Interno" });
  }
});

//rotta acquisto biglietto
router.post("/acquista", ensureAuthenticated, async (req, res) => {
  const db = await dbPromise;
  const { bigliettoId, quantita } = req.body;
  const userId = req.user.id;

  if (!bigliettoId || !quantita) {
    return res.status(400).send("Dati mancanti");
  }

  try {
    const biglietto = await dao.getById(bigliettoId);

    if (!biglietto) {
      return res.status(400).send("Biglietto non trovato.");
    }

    if (biglietto.disponibili < quantita) {
      return res.status(400).send("Biglietti esauriti");
    }

    //inserisce acquisto
    //Verifica quanti biglietti ha già acquistato per quel tipo
    const acquistiPrecedenti = await db.get(
      `SELECT SUM(quantita) AS totale
      FROM biglietti_acquistati
      WHERE utente_id = ? AND biglietto_id = ?
      `,
      [userId, bigliettoId]
    );

    const totalePrecedente = acquistiPrecedenti.totale || 0;
    const totaleDopo = totalePrecedente + parseInt(quantita);

    const limiteMassimo = 5;

    if (totaleDopo > limiteMassimo) {
      return res.status(400).send(`Limite massimo di ${limiteMassimo} biglietti per persona superato.`);
    }

    //aggiorna disponibilità
    await dao.aggiornaDisponibili(
      bigliettoId,
      biglietto.disponibili - quantita
    );

    //caso true ho acquistato
    res.redirect("/carrello?success=1");

    //altrimenti mi da errore
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante acquisto del biglietto.");
  }
});

module.exports = router;

/*
DA FARE:

MOSTRA TIPI BIGLIETTI
GESTIONE AGGIUNTA CARRELLO: POST
TOGLIERE BIGLIETTO
PREZZI DINAMICI O DISPONIBILITA'
CONFERMA ACQUISTO 

TIPO BIGLIETTO DA AGGIUNGERE:
BIGLIETTO PERSONE CON DISABILITA' 
*/
