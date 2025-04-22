const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db("agentforceDB");
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err);
  }
};

app.get('/', (req, res) => {
  res.send("🔥 API is Live!");
});

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await db.collection("customers").find().toArray();
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to fetch customers");
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
