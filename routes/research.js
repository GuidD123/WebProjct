const express = require("express");
const router = express.Router();
const dbPromise = require("../db");

router.get("/", async (req, res) => {
  const q = req.query.q?.trim();

  if (!q) return res.json([]); // risposta vuota se query vuota

  try {
    const db = await dbPromise;
    const like = `%${q}%`;

    const risultati = await db.all(
      `SELECT id, titolo, descrizione 
       FROM eventi 
       WHERE titolo LIKE ? OR descrizione LIKE ? 
       ORDER BY data`,
      [like, like]
    );

    res.json(risultati); // ✅ risposta JSON
  } catch (err) {
    console.error("Errore nella ricerca:", err);
    res.status(500).json({ error: "Errore durante la ricerca" });
  }
});

module.exports = router;
