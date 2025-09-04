class UtentiDAO {
  constructor(db) {
    this.db = db;
  }

  // Login: trova utente per email
  async getByEmail(email) {
    return new Promise((resolve, reject) => {
      //LOWER per cercare email nel db con lower così avviene la normalizzazione 
      this.db.get("SELECT * FROM utenti WHERE LOWER(email) = LOWER(?) LIMIT 1", [email], (err, row) => {
        if (err) reject(err);
        else resolve(row); // può essere null se non trovato
      });
    });
  }

  //Recupera utente per ID
  async getById(id) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM utenti WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  //Crea nuovo utente
  async creaUtente({ username, email, password, ruolo }) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO utenti (username, email, password, ruolo)
         VALUES (?, ?, ?, ?)`,
        [username, email, password, ruolo],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID); // id del nuovo utente
        }
      );
    });
  }

  //Modifica dati utente (username/email)
  async modificaUtente(id, { username, email }) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE utenti SET username = ?, email = ? WHERE id = ?`,
        [username, email, id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  //Cambia password
  async cambiaPassword(id, nuovaPassword) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE utenti SET password = ? WHERE id = ?`,
        [nuovaPassword, id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  //Admin: tutti gli utenti
  async getTutti() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT id, username, email, ruolo FROM utenti ORDER BY id", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = UtentiDAO;
