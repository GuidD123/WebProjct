# 🎭 ComixCity - Applicazione Web per Fiere Comics & Games

ComixCity è un sito web sviluppato come progetto universitario per il corso **Metodologie di Programmazione per il Web** (A.A. 2024/2025).  
L’applicazione simula la gestione di una fiera di fumetti, cosplay e videogiochi, con funzionalità di acquisto biglietti, prenotazione stand e gestione utenti.

---

## 🚀 Tecnologie
- **Frontend** → HTML5, CSS3, Bootstrap, EJS, AOS  
- **Backend** → Node.js, Express.js  
- **Database** → SQLite (gestito con DBeaver)  
- **Autenticazione** → Passport.js + bcrypt  

---

## 🔑 Funzionalità
- 👤 **Gestione utenti**: registrazione, login, ruoli (visitatore, espositore, admin)  
- 🛒 **Carrello biglietti** con aggiunta, rimozione, aggiornamento quantità  
- 🎟️ **Acquisto biglietti** con storico ordini  
- 🧱 **Prenotazione stand** per espositori  
- 👑 **Pannello admin** con statistiche, utenti e ordini  
- 🔎 **Ricerca eventi** per keyword  
- 📱 **Responsive design** ottimizzato per desktop e mobile  

---

## 📂 Struttura progetto
- /public -> file statici (CSS, JS, immagini)
- /views -> pagine EJS (frontend dinamico)
- /routes -> router Express (carrello, login, eventi, stand, ecc.)
- /dao -> accesso al database (DAO pattern)
- /config -> configurazioni (passport, ecc.)
- app.js -> entry point principale

---

## 📄 Licenza
Uso didattico e personale.  
Non destinato alla distribuzione commerciale.  
