class EventiDAO {
  constructor(db) {
    this.db = db;
  }

  async getTutti() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM eventi ORDER BY data', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM eventi WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async cerca(termine) {
    return new Promise((resolve, reject) => {
      const q = `%${termine}%`;
      this.db.all(
        `SELECT * FROM eventi WHERE titolo LIKE ? OR descrizione LIKE ? ORDER BY data`,
        [q, q],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async aggiungi({ titolo, descrizione, data, immagine, creato_da }) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO eventi (titolo, descrizione, data, immagine, creato_da)
         VALUES (?, ?, ?, ?, ?)`,
        [titolo, descrizione, data, immagine, creato_da],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async modifica(id, { titolo, descrizione, data, immagine }) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE eventi SET titolo = ?, descrizione = ?, data = ?, immagine = ? WHERE id = ?`,
        [titolo, descrizione, data, immagine, id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }

  async elimina(id) {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM eventi WHERE id = ?`, [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
}

module.exports = EventiDAO;
