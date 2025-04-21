const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// GET all customers
app.get('/get-all-customers', (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// POST to add a customer
app.post('/add-customer', (req, res) => {
  const { name, email } = req.body;
  const query = 'INSERT INTO customers (name, email) VALUES (?, ?)';
  db.query(query, [name, email], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Customer added successfully!', id: result.insertId });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
