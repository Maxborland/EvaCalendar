// @ts-nocheck
// back/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = path.resolve(__dirname, 'data.db');
const db = new sqlite3.Database(dbFile);

function initDb() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS event_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    const defaultEventCategories = [
      'Транспорт',
      'Еда',
      'Развлечения/подарки',
      'Канцтовары',
      'Другое'
    ];
    const stmt = db.prepare(`INSERT OR IGNORE INTO event_categories (name) VALUES (?)`);
    for (const name of defaultEventCategories) {
      stmt.run(name);
    }
    stmt.finalize();

    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT NOT NULL,
        title TEXT,
        time TEXT,
        address TEXT,
        child_name TEXT,
        hourly_rate REAL,
        amount REAL,
        comment TEXT,
        category_id INTEGER,
        day_of_week TEXT,
        date TEXT NOT NULL,
        position_in_day INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES event_categories(id)
      )
    `);
  }); // Close db.serialize()
}

module.exports = { db, initDb };