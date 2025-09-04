// db.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

module.exports = open({
  filename: path.join(__dirname, 'database.db'), // o './db/database.db'
  driver: sqlite3.Database
});


//ogni file userà: const db = await dbPromise;
