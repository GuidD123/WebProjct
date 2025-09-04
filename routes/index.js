const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("index", { titolo: "Benvenuto alla Fiera del Fumetto" });
});

// Rotta per la pagina "Chi Siamo"
router.get("/chisiamo", (req, res) => {
  res.render("chisiamo");
});

// rotta per pagina 'Privacy'
router.get("/privacy", (req, res) => {
  res.render("privacy");
});

// rotta per pagina 'Terms'
router.get("/terms", (req, res) => {
  res.render("terms");
});


module.exports = router;
