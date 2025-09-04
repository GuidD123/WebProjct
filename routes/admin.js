const express = require("express");
const router = express.Router();
const dbPromise = require("../db");
const { onlyAdmin } = require("../middleware/auth");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

// Middleware per validare formato di export
function validateExportFormat(req, res, next) {
  const acceptedFormats = ['csv'];
  const format = req.query.format || 'csv';
  
  if (!acceptedFormats.includes(format.toLowerCase())) {
    return res.status(400).json({
      error: 'Formato non supportato',
      accepted: acceptedFormats
    });
  }
  
  req.exportFormat = format.toLowerCase();
  next();
}

// Directory temporanea PRIVATA (fuori da public)
const tempDir = path.join(__dirname, "../temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Funzione per generare nome file unico
function generateUniqueFilename(prefix) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(6).toString('hex');
  return `${prefix}_${timestamp}_${random}.csv`;
}

// Funzione per pulire file dopo download
function cleanupFile(filePath, delay = 5000) {
  setTimeout(() => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Errore pulizia file:', err);
        else console.log('File temporaneo eliminato:', filePath);
      });
    }
  }, delay);
}



//GET
router.get("/", onlyAdmin, async (req, res) => {
  const db = await dbPromise;

  try {
    const users = await db.all(
      "SELECT id, username, email, ruolo FROM utenti"
    );
    const bookings = await db.all(
      `SELECT p.id, p.data_prenotazione, u.username AS espositore, s.nome AS stand FROM prenotazioni p JOIN utenti u ON p.utente_id = u.id JOIN stand s ON p.stand_id = s.id`
    );

    const purchases = await db.all(
      `SELECT o.id, o.data, o.totale, u.username AS acquirente FROM ordini o JOIN utenti u ON o.utente_id = u.id`
    );

    const totalTickets = await db.get(
      `SELECT COALESCE(SUM(quantita), 0) AS totale FROM dettagli_ordine`
    );
    const totalRevenue = await db.get(
      `SELECT COALESCE(SUM(totale), 0) AS totale FROM ordini`
    );

    const [totalUsers, totalBookings] = await Promise.all([
      db.get("SELECT COUNT(*) AS totale FROM utenti"),
      db.get("SELECT COUNT(*) AS totale FROM prenotazioni"),
    ]);

    res.render("admin", {
      utenti: users,
      prenotazioni: bookings,
      acquisti: purchases,
      stats: {
        utenti: totalUsers.totale || 0,
        prenotazioni: totalBookings.totale || 0,
        biglietti: totalTickets.totale || 0,
        incasso: totalRevenue.totale?.toFixed(2) || "0.00",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore nel pannello admin");
  }
});



//esporta utenti
router.get("/csv/utenti", onlyAdmin, async (req, res) => {
  const filename = generateUniqueFilename('utenti');
  const filePath = path.join(tempDir, filename);

  try {
    const db = await dbPromise;
    const users = await db.all(
      "SELECT id, username, email, ruolo FROM utenti"
    );

    
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "id", title: "ID" },
        { id: "username", title: "Username" },
        { id: "email", title: "Email" },
        { id: "ruolo", title: "Ruolo" },
      ],
    });

    await csvWriter.writeRecords(users);

    // Download con nome originale
    res.download(filePath, 'utenti.csv', (err) => {
      if (err) {
        console.error("Errore download:", err);
      }
      // Pulisci il file dopo il download (o dopo 5 secondi)
      cleanupFile(filePath);
    });

  } catch (err) {

    // Pulisci il file anche in caso di errore
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
    console.error("Errore export utenti:", err);
    res.status(500).send("Errore durante l'esportazione");
  }
});



//esporta biglietti_acquistati
router.get("/csv/biglietti_acquistati", onlyAdmin, async (req, res) => {

  const filename = generateUniqueFilename('biglietti');
  const filePath = path.join(tempDir, filename);

  try {
    const db = await dbPromise;

    const purchasedTickets = await db.all(`
      SELECT d.id, u.username, b.tipo_biglietto, d.quantita, o.data
      FROM dettagli_ordine d
      JOIN ordini o ON d.ordine_id = o.id
      JOIN utenti u ON o.utente_id = u.id
      JOIN biglietti b ON d.biglietto_id = b.id
    `);

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "id", title: "ID" },
        { id: "username", title: "Username" },
        { id: "tipo_biglietto", title: "Tipo Biglietto" },
        { id: "quantita", title: "Quantita" },
        { id: "data", title: "Data Acquisto" },
      ],
    });

    await csvWriter.writeRecords(purchasedTickets);

    res.download(filePath, 'biglietti_acquistati.csv', (err) => {
      if (err) {
        console.error("Errore download:", err);
      }
      cleanupFile(filePath);
    });

  } catch (err) {

    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
    console.error("Errore export biglietti:", err);
    res.status(500).send("Errore durante l'esportazione");
  }
});



//esporta prenotazioni - stand
router.get("/csv/prenotazioni", onlyAdmin, async (req, res) => {

  const filename = generateUniqueFilename('prenotazioni');
  const filePath = path.join(tempDir, filename);

  try {

    const db = await dbPromise;
    
    const standBookings = await db.all(
      "SELECT p.id, u.username AS espositore, s.nome AS stand, p.data_prenotazione FROM prenotazioni p JOIN utenti u ON p.utente_id = u.id JOIN stand s ON p.stand_id = s.id"
    );

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "id", title: "ID Prenotazione" },
        { id: "espositore", title: "Espositore" },
        { id: "stand", title: "Stand" },
        { id: "data_prenotazione", title: "Data Prenotazioni" },
      ],
    });

    await csvWriter.writeRecords(standBookings);

    res.download(filePath, 'prenotazioni.csv', (err) => {
      if (err) {
        console.error("Errore download:", err);
      }
      cleanupFile(filePath);
    });

  } catch (err) {

    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }

    console.error("Errore export prenotazioni:", err);
    res.status(500).send("Errore durante l'esportazione");
  }
});


// Task di pulizia opzionale - esegui periodicamente
function cleanupOldTempFiles() {
  fs.readdir(tempDir, (err, files) => {
    if (err) return;
    
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        // Elimina file più vecchi di 1 ora
        if (now - stats.mtime.getTime() > 3600000) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}

// Esegui pulizia ogni ora
setInterval(cleanupOldTempFiles, 3600000);

module.exports = router;
