class StandDAO {
  constructor(db) {
    this.db = db;
  }

  async getTutti() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM stand', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM stand WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async haPrenotato(userId, standId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM prenotazioni WHERE utente_id = ? AND stand_id = ?',
        [userId, standId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async prenota(userId, standId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO prenotazioni (utente_id, stand_id, data_prenotazione)
         VALUES (?, ?, datetime('now'))`,
        [userId, standId],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async annulla(userId, standId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM prenotazioni WHERE utente_id = ? AND stand_id = ?',
        [userId, standId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  async setDisponibile(id, valore) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE stand SET disponibile = ? WHERE id = ?',
        [valore, id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
}

module.exports = StandDAO;
