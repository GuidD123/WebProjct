const express = require("express");
const router = express.Router();
const dbPromise = require("../db");
const { ensureAuthenticated } = require("../middleware/auth");
const BigliettiDAO = require("../daos/BigliettiDAO");

// Middleware per inizializzare il carrello se non esiste
function initCarrello(req, res, next) {
  if (!req.session.carrello) {
    req.session.carrello = [];
  }
  next();
}

// GET /carrello - mostra il carrello
router.get("/", ensureAuthenticated, initCarrello, (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  const carrello = req.session.carrello;
  const totale = carrello.reduce(
    (sum, item) => sum + item.prezzo * item.quantita,
    0
  );
  res.render("carrello", { carrello, totale, query: req.query });
});

// POST /carrello/aggiungi
router.post(
  "/aggiungi",
  ensureAuthenticated,
  initCarrello,
  async (req, res) => {
    const id = parseInt(req.body.id);
    const quantita = parseInt(req.body.quantita);
    const prezzo = parseFloat(req.body.prezzo);

    // Validazione ID e quantità PRIMA della query
    if (
      !id ||
      isNaN(id) ||
      id <= 0 ||
      !quantita ||
      isNaN(quantita) ||
      quantita < 1 ||
      quantita > 5
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Dati non validi" });
    }

    const db = await dbPromise;
    const biglietto = await db.get("SELECT * FROM biglietti WHERE id = ?", [
      id,
    ]);
    if (!biglietto) {
      return res
        .status(400)
        .json({ success: false, message: "Biglietto non trovato" });
    }

    try {
      if (!id || isNaN(quantita) || isNaN(prezzo)) {
        return res
          .status(400)
          .json({ success: false, message: "Dati non validi" });
      }

      const qta = parseInt(quantita);
      const prezzoF = parseFloat(biglietto.prezzo);

      // Cerca se già presente
      const esiste = req.session.carrello.find(
        (item) => item.id === parseInt(id)
      );

      if (qta > 5) {
        return res
          .status(400)
          .json({ success: false, message: "Massimo 5 biglietti per tipo" });
      }

      if ((esiste && esiste.quantita + qta > 5) || (!esiste && qta > 5)) {
        return res
          .status(400)
          .json({ success: false, message: "Massimo 5 biglietti per tipo" });
      }

      if (esiste) {
        esiste.quantita += qta;
      } else {
        req.session.carrello.push({
          id: biglietto.id,
          nome: biglietto.nome,
          quantita: qta,
          prezzo: prezzoF,
        });
      }
      return res.json({
        success: true,
        carrelloLength: req.session.carrello.length,
      });
    } catch (err) {
      console.error("Errore aggiunta carrello:", err);
      res.status(500).json({ success: false, message: "Errore interno" });
    }
  }
);

// POST /carrello/incrementa/:index
router.post(
  "/incrementa/:index",
  ensureAuthenticated,
  initCarrello,
  (req, res) => {

    const i = parseInt(req.params.index);

    // Validazione index
    if (isNaN(i) || i < 0 || i >= req.session.carrello.length) {
      return res.redirect("/carrello?errore=index_non_valido");
    }

    if (req.session.carrello[i]) {
      if (req.session.carrello[i].quantita < 5) {
        req.session.carrello[i].quantita += 1;
      }
    }
    res.redirect("/carrello");
  }
);

// POST /carrello/decrementa/:index
router.post(
  "/decrementa/:index",
  ensureAuthenticated,
  initCarrello,
  (req, res) => {

    const i = parseInt(req.params.index);

    // Validazione index
    if (isNaN(i) || i < 0 || i >= req.session.carrello.length) {
      return res.redirect("/carrello?errore=index_non_valido");
    }

    if (req.session.carrello[i]) {
      if (req.session.carrello[i].quantita > 1) {
        req.session.carrello[i].quantita -= 1;
      } else {
        req.session.carrello.splice(i, 1);
      }
    }
    res.redirect("/carrello");
  }
);

// POST /carrello/rimuovi/:index
router.post(
  "/rimuovi/:index",
  ensureAuthenticated,
  initCarrello,
  (req, res) => {

    const i = parseInt(req.params.index);

    // Validazione index
    if (isNaN(i) || i < 0 || i >= req.session.carrello.length) {
      return res.redirect("/carrello?errore=index_non_valido");
    }
    
    if (req.session.carrello[i]) {
      req.session.carrello.splice(i, 1);
    }
    res.redirect("/carrello?rimosso=ok");
  }
);

// POST /carrello/svuota
router.post("/svuota", ensureAuthenticated, (req, res) => {
  req.session.carrello = [];
  res.redirect("/carrello?svuotato=ok");
});

// GET /carrello/checkout - mostra riepilogo e metodo di pagamento
router.get("/checkout", ensureAuthenticated, initCarrello, (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  const carrello = req.session.carrello;
  const totale = carrello.reduce(
    (sum, item) => sum + item.prezzo * item.quantita,
    0
  );

  if (!carrello || carrello.length === 0) {
    return res.redirect("/carrello?errore=carrello_vuoto");
  }

  res.render("checkout", { carrello, totale });
});

// POST /carrello/checkout
router.post(
  "/checkout",
  ensureAuthenticated,
  initCarrello,
  async (req, res) => {
    const db = await dbPromise;
    const bigliettiDao = new BigliettiDAO(db);
    const userId = req.user.id;
    const carrello = req.session.carrello;

    if (!carrello || carrello.length === 0) {
      return res.redirect("/carrello?errore=carrello_vuoto");
    }

    try {
      const totale = carrello.reduce(
        (sum, item) => sum + item.quantita * item.prezzo,
        0
      );
      if (isNaN(totale) || totale <= 0) {
        return res.redirect("/carrello?errore=totale_invalido");
      }

      await db.run("BEGIN");

      const acquistoId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO acquisti (utente_id, data, totale) VALUES (?, datetime("now"), ?)',
          [userId, totale],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      for (const item of carrello) {
        const bigliettoDB = await bigliettiDao.getById(item.id);

        if (!bigliettoDB) {
          await db.run("ROLLBACK");
          return res.redirect("/carrello?errore=biglietto_non_trovato");
        }

        if (bigliettoDB.disponibili < item.quantita) {
          await db.run("ROLLBACK");
          return res.redirect("/carrello?errore=disponibilita_insufficiente");
        }

        if (parseFloat(bigliettoDB.prezzo) !== parseFloat(item.prezzo)) {
          await db.run("ROLLBACK");
          return res.redirect("/carrello?errore=prezzo_manomesso");
        }

        await db.run(
          "INSERT INTO biglietti_acquistati (acquisto_id, nome, quantita, prezzo_unitario) VALUES (?, ?, ?, ?)",
          [acquistoId, item.nome, item.quantita, item.prezzo]
        );

        const nuovaDisponibilita = bigliettoDB.disponibili - item.quantita;
        await bigliettiDao.aggiornaDisponibili(
          bigliettoDB.id,
          nuovaDisponibilita
        );
      }

      await db.run("COMMIT");
      req.session.carrello = [];
      res.redirect("/carrello?success=1");
    } catch (err) {
      console.error("Errore durante checkout:", err);
      await db.run("ROLLBACK");
      res.status(500).send("Errore durante il checkout.");
    }
  }
);

module.exports = router;
