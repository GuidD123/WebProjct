//Data Access Object per i biglietti.

class BigliettiDAO {
  constructor(db) {
    this.db = db;
  }

  //ritorna tutti i biglietti
  async getTutti() {
    const sql = "SELECT * FROM biglietti";
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Ritorna solo i biglietti disponibili (> 0)
  async getDisponibili() {
    const sql = "SELECT * FROM biglietti WHERE disponibili > 0";
    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Dato un ID, ritorna i dettagli del biglietto
  async getById(id) {
    const sql = "SELECT * FROM biglietti WHERE id = ?";
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Aggiorna la quantità disponibile (dopo acquisto)
  async aggiornaDisponibili(id, nuovaQuantita) {
    const sql = "UPDATE biglietti SET disponibili = ? WHERE id = ?";
    return new Promise((resolve, reject) => {
      this.db.run(sql, [nuovaQuantita, id], function (err) {
        if (err) reject(err);
        else resolve(this.changes); // numero righe modificate
      });
    });
  }


  // Cerca un biglietto per nome
  //async getByNome(nome) {
    //const sql = "SELECT * FROM biglietti WHERE nome = ?";
    //return new Promise((resolve, reject) => {
      //this.db.get(sql, [nome], (err, row) => {
        //if (err) reject(err);
        //else resolve(row);
      //});
    //});
  //}
}

module.exports = BigliettiDAO;
