/*PER AVVIO SERVER: npm run dev*/
require("dotenv").config();
const express = require("express");
const path = require("path");
const researchRoute = require("./routes/research");
const session = require("express-session");
const passport = require("passport");
const initializePassport = require("./config/passport");
const app = express();
const port = process.env.PORT || 3000;

if(!process.env.SESSION_SECRET){
  console.error('SESSION_SECRET non trovato nel file .env');
  process.exit(1); 
}

//rimanda al public in cui ho css e il resto
app.use(express.static("public"));

//Middleware per gestire i dati dei form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Usato per la ricerca nella search-form
app.use("/research", require("./routes/research"));

//EJS come motore di template
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Sessioni per login e ruoli utente
app.use(
  session({
    secret: process.env.SESSION_SECRET, // cambialo in produzione
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);



//PASSPORT
initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

//dati globali visibili nelle view
//mi permette nelle partials della navbar di mostrare il numero di articoli anche senza JS (SSR), e poi aggiornarlo lato client quando aggiungi con AJAX.
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.carrello = req.session.carrello || [];
  next();
});



//ROTTE
//login
const loginRouter = require("./routes/login");
app.use("/login", loginRouter);

//registrazione
const registerRouter = require("./routes/register");
app.use("/register", registerRouter);

//stand
const standRouter = require("./routes/stand");
app.use("/stand", standRouter);

//stand
const bigliettiRoutes = require("./routes/biglietti");
app.use("/biglietti", bigliettiRoutes);

//eventi
const eventiRoutes = require("./routes/eventi");
app.use("/eventi", eventiRoutes);

//carrello
const carrelloRoutes = require("./routes/carrello");
app.use("/carrello", carrelloRoutes);

//area personale
const areapersonaleRouter = require("./routes/areapersonale");
app.use("/areapersonale", areapersonaleRouter);

//logout
const logoutRouter = require("./routes/logout");
app.use("/logout", logoutRouter);

//admin
const adminRouter = require("./routes/admin");
app.use("/admin", adminRouter);


//Import delle rotte rimanenti -> terms, privacy, chisiamo
const indexRoutes = require("./routes/index");
app.use("/", indexRoutes);

//handler error 404
app.use((req, res) => {
  res.status(404).render("404", { titolo: "Pagina non trovata" });
});

//handler error 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("500", { titolo: "Errore interno" });
});



//Avvio del server
app.listen(port, () => {
  console.log(`Server attivo su http://localhost:${port}`);
  if (process.env.NODE_ENV !== "production") {
    import("open").then((open) => {
      open.default(`http://localhost:${port}`);
    });
  }
});
