const express = require("express");
const router = express.Router();
const dbPromise = require("../db");
const { onlyAdmin } = require("../middleware/auth");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const path = require("path");
const csvDir = path.join(__dirname, "../public/csv");

if (!fs.existsSync(csvDir)) {
  fs.mkdirSync(csvDir, { recursive: true });
}

//GET
router.get("/", onlyAdmin, async (req, res) => {
  const db = await dbPromise;

  //QUERY DA RIVEDERE!!!!
  try {
    const utenti = await db.all(
      "SELECT id, username, email, ruolo FROM utenti"
    );
    const prenotazioni = await db.all(
      `SELECT p.id, p.data_prenotazione, u.username AS espositore, s.nome AS stand FROM prenotazioni p JOIN utenti u ON p.utente_id = u.id JOIN stand s ON p.stand_id = s.id`
    );

    const acquisti = await db.all(
      `SELECT o.id, o.data, o.totale, u.username AS acquirente FROM ordini o JOIN utenti u ON o.utente_id = u.id`
    );

    const bigliettiTotali = await db.get(
      `SELECT COALESCE(SUM(quantita), 0) AS totale FROM dettagli_ordine`
    );
    const incassoTotale = await db.get(
      `SELECT COALESCE(SUM(totale), 0) AS totale FROM ordini`
    );

    const [utentiTotali, prenotazioniTotali] = await Promise.all([
      db.get("SELECT COUNT(*) AS totale FROM utenti"),
      db.get("SELECT COUNT(*) AS totale FROM prenotazioni"),
    ]);

    res.render("admin", {
      utenti,
      prenotazioni,
      acquisti,
      stats: {
        utenti: utentiTotali.totale || 0,
        prenotazioni: prenotazioniTotali.totale || 0,
        biglietti: bigliettiTotali.totale || 0,
        incasso: incassoTotale.totale?.toFixed(2) || "0.00",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore nel pannello admin");
  }
});

//esporta utenti
router.get("/csv/utenti", onlyAdmin, async (req, res) => {
  try {
    const db = await dbPromise;
    const utenti = await db.all(
      "SELECT id, username, email, ruolo FROM utenti"
    );

    const filePath = path.join(__dirname, "../public/csv/utenti.csv");

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "id", title: "ID" },
        { id: "username", title: "Username" },
        { id: "email", title: "Email" },
        { id: "ruolo", title: "Ruolo" },
      ],
    });

    await csvWriter.writeRecords(utenti);

    res.download(filePath);
  } catch (err) {
    console.error("Errore export utenti:", err);
    res.status(500).send("Errore durante l'esportazione");
  }
});

//esporta biglietti_acquistati
router.get("/csv/biglietti_acquistati", onlyAdmin, async (req, res) => {
  try {
    const db = await dbPromise;

    const biglietti_acquistati = await db.all(`
    SELECT ba.id, u.username, b.tipo_biglietto, ba.quantita, ba.data_acquisto 
    FROM biglietti_acquistati ba
    JOIN utenti u ON ba.utente_id = u.id
    JOIN biglietti b ON ba.biglietto_id = b.id
    `);

    const filePath = path.join(
      __dirname,
      "../public/csv/biglietti_acquistati.csv"
    );

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "id", title: "ID" },
        { id: "username", title: "Username" },
        { id: "tipo_biglietto", title: "Tipo Biglietto" },
        { id: "quantita", title: "Quantita" },
        { id: "data_acquisto", title: "Data Acquisto" },
      ],
    });

    await csvWriter.writeRecords(biglietti_acquistati);

    res.download(filePath);
  } catch (err) {
    console.error("Errore export biglietti:", err);
    res.status(500).send("Errore durante l'esportazione");
  }
});

//esporta prenotazioni - stand
router.get("/csv/prenotazioni", onlyAdmin, async (req, res) => {
  try {
    const db = await dbPromise;
    const stand_prenotati = await db.all(
      "SELECT p.id, u.username AS espositore, s.nome AS stand, p.data_prenotazione FROM prenotazioni p JOIN utenti u ON p.utente_id = u.id JOIN stand s ON p.stand_id = s.id"
    );

    const filePath = path.join(__dirname, "../public/csv/prenotazioni.csv");

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "id", title: "ID Prenotazione" },
        { id: "espositore", title: "Espositore" },
        { id: "stand", title: "Stand" },
        { id: "data_prenotazione", title: "Data Prenotazioni" },
      ],
    });

    await csvWriter.writeRecords(stand_prenotati);

    res.download(filePath);
  } catch (err) {
    console.error("Errore export prenotazioni:", err);
    res.status(500).send("Errore durante l'esportazione");
  }
});

module.exports = router;
