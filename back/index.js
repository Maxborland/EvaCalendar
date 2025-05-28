// @ts-nocheck
// back/index.js
const express = require('express');
const cors = require('cors');
const { db, initDb } = require('./database');
const { getStartOfWeek, getEndOfWeek } = require('./utils');

initDb();

const app = express();
app.use(cors());
app.use(express.json());

// Get all event categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM event_categories', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get all events for a given week
app.get('/api/events', (req, res) => {
  const { week_date } = req.query;
  if (!week_date) {
    return res.status(400).json({ error: 'week_date is required' });
  }

  const weekStartDate = getStartOfWeek(week_date);
  const weekEndDate = getEndOfWeek(week_date);

  db.all(
    `SELECT * FROM events WHERE date BETWEEN ? AND ? ORDER BY date, position_in_day`,
    [weekStartDate, weekEndDate],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Create a new event
app.post('/api/events', (req, res) => {
  const {
    user_id,
    type,
    title,
    time,
    address,
    child_name,
    hourly_rate,
    amount,
    comment,
    category_id,
    day_of_week,
    date,
    position_in_day
  } = req.body;

  // Basic validation
  if (!type || !date || position_in_day === undefined) {
    return res.status(400).json({ error: 'Missing required event fields: type, date, position_in_day' });
  }
  if (type === 'заказ' && (!title || !time || !address || !child_name || hourly_rate === undefined)) {
    return res.status(400).json({ error: 'Missing required fields for "заказ" event' });
  }
  if (type === 'трата' && (!title || amount === undefined || category_id === undefined)) {
    return res.status(400).json({ error: 'Missing required fields for "трата" event' });
  }

  const sql = `INSERT INTO events (user_id, type, title, time, address, child_name, hourly_rate, amount, comment, category_id, day_of_week, date, position_in_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(
    sql,
    [user_id, type, title, time, address, child_name, hourly_rate, amount, comment, category_id, day_of_week, date, position_in_day],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Get a single event by ID
app.get('/api/events/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Event not found' });
    res.json(row);
  });
});

// Update an existing event
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const {
    user_id,
    type,
    title,
    time,
    address,
    child_name,
    hourly_rate,
    amount,
    comment,
    category_id,
    day_of_week,
    date,
    position_in_day
  } = req.body;

  // Basic validation
  if (!type || !date || position_in_day === undefined) {
    return res.status(400).json({ error: 'Missing required event fields: type, date, position_in_day' });
  }
  if (type === 'заказ' && (!title || !time || !address || !child_name || hourly_rate === undefined)) {
    return res.status(400).json({ error: 'Missing required fields for "заказ" event' });
  }
  if (type === 'трата' && (!title || amount === undefined || category_id === undefined)) {
    return res.status(400).json({ error: 'Missing required fields for "трата" event' });
  }

  const sql = `UPDATE events SET user_id = ?, type = ?, title = ?, time = ?, address = ?, child_name = ?, hourly_rate = ?, amount = ?, comment = ?, category_id = ?, day_of_week = ?, date = ?, position_in_day = ? WHERE id = ?`;
  db.run(
    sql,
    [user_id, type, title, time, address, child_name, hourly_rate, amount, comment, category_id, day_of_week, date, position_in_day, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

// Delete an event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM events WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// Duplicate an event
app.post('/api/events/:id/duplicate', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Event not found' });

    // Create a new event with the same data, incrementing position_in_day
    const newPosition = row.position_in_day + 1;
    const sql = `INSERT INTO events (user_id, type, title, time, address, child_name, hourly_rate, amount, comment, category_id, day_of_week, date, position_in_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(
      sql,
      [row.user_id, row.type, row.title, row.time, row.address, row.child_name, row.hourly_rate, row.amount, row.comment, row.category_id, row.day_of_week, row.date, newPosition],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
      }
    );
  });
});

// Reorder events (and move between days/weeks)
app.post('/api/events/reorder', (req, res) => {
  const { eventId, newDayOfWeek, newDate, newPositionInDay } = req.body;

  if (eventId === undefined || newDayOfWeek === undefined || !newDate || newPositionInDay === undefined) {
    return res.status(400).json({ error: 'Missing required fields for reorder: eventId, newDayOfWeek, newDate, newPositionInDay' });
  }

  db.serialize(() => {
    db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, eventToMove) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!eventToMove) return res.status(404).json({ error: 'Event not found' });

      const oldDayOfWeek = eventToMove.day_of_week;
      const oldDate = eventToMove.date;
      const oldPositionInDay = eventToMove.position_in_day;

      // Adjust positions in the old day/date
      db.run(
        'UPDATE events SET position_in_day = position_in_day - 1 WHERE date = ? AND day_of_week = ? AND position_in_day > ?',
        [oldDate, oldDayOfWeek, oldPositionInDay],
        (err) => {
          if (err) {
            console.error("Error adjusting old positions:", err.message);
            return res.status(500).json({ error: err.message });
          }

          // Update the moved event
          db.run(
            'UPDATE events SET day_of_week = ?, date = ?, position_in_day = ? WHERE id = ?',
            [newDayOfWeek, newDate, newPositionInDay, eventId],
            (err) => {
              if (err) {
                console.error("Error updating moved event:", err.message);
                return res.status(500).json({ error: err.message });
              }

              // Adjust positions in the new day/date (if different from old)
              if (oldDate !== newDate || oldDayOfWeek !== newDayOfWeek) {
                db.run(
                  'UPDATE events SET position_in_day = position_in_day + 1 WHERE date = ? AND day_of_week = ? AND position_in_day >= ? AND id != ?',
                  [newDate, newDayOfWeek, newPositionInDay, eventId],
                  (err) => {
                    if (err) {
                      console.error("Error adjusting new positions:", err.message);
                      return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: 'Event reordered successfully' });
                  }
                );
              } else {
                // If moving within the same day, just update positions between old and new
                if (newPositionInDay < oldPositionInDay) {
                  db.run(
                    'UPDATE events SET position_in_day = position_in_day + 1 WHERE date = ? AND day_of_week = ? AND position_in_day >= ? AND position_in_day < ? AND id != ?',
                    [newDate, newDayOfWeek, newPositionInDay, oldPositionInDay, eventId],
                    (err) => {
                      if (err) {
                        console.error("Error adjusting positions (same day, move up):", err.message);
                        return res.status(500).json({ error: err.message });
                      }
                      res.json({ message: 'Event reordered successfully' });
                    }
                  );
                } else if (newPositionInDay > oldPositionInDay) {
                  db.run(
                    'UPDATE events SET position_in_day = position_in_day - 1 WHERE date = ? AND day_of_week = ? AND position_in_day <= ? AND position_in_day > ? AND id != ?',
                    [newDate, newDayOfWeek, newPositionInDay, oldPositionInDay, eventId],
                    (err) => {
                      if (err) {
                        console.error("Error adjusting positions (same day, move down):", err.message);
                        return res.status(500).json({ error: err.message });
                      }
                      res.json({ message: 'Event reordered successfully' });
                    }
                  );
                } else {
                  res.json({ message: 'Event reordered successfully (no position change)' });
                }
              }
            }
          );
        }
      );
    });
  });
});

// Get daily summary
app.get('/api/summary/daily', (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Date is required for daily summary' });
  }
  const sql = `
    SELECT
      SUM(CASE WHEN type = 'заказ' THEN hourly_rate ELSE 0 END) AS totalEarnings,
      SUM(CASE WHEN type = 'трата' THEN amount ELSE 0 END) AS totalExpenses
    FROM events
    WHERE date = ?
  `;
  db.get(sql, [date], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      totalEarnings: row.totalEarnings || 0,
      totalExpenses: row.totalExpenses || 0
    });
  });
});

// Get weekly summary
app.get('/api/summary/weekly', (req, res) => {
  const { any_date_in_week } = req.query;
  if (!any_date_in_week) {
    return res.status(400).json({ error: 'any_date_in_week is required for weekly summary' });
  }

  const weekStartDate = getStartOfWeek(any_date_in_week);
  const weekEndDate = getEndOfWeek(any_date_in_week);

  const sql = `
    SELECT
      SUM(CASE WHEN type = 'заказ' THEN hourly_rate ELSE 0 END) AS totalEarnings,
      SUM(CASE WHEN type = 'трата' THEN amount ELSE 0 END) AS totalExpenses
    FROM events
    WHERE date BETWEEN ? AND ?
  `;
  db.get(sql, [weekStartDate, weekEndDate], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      totalEarnings: row.totalEarnings || 0,
      totalExpenses: row.totalExpenses || 0
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); // Corrected template literal
});