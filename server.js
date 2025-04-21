const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MongoDB Connection
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

let customersCollection;

async function connectToMongoDB() {
  try {
    await client.connect();
    const db = client.db("agentforceDB");
    customersCollection = db.collection("customers_records");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

// Routes

// Test route
app.get("/api/health", (req, res) => {
  res.send("🚀 API is working!");
});

// Get all customer records
app.get("/api/customers", async (req, res) => {
  try {
    const customers = await customersCollection.find({}).toArray();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customer records" });
  }
});

// Add a new customer record
app.post("/api/customers", async (req, res) => {
  try {
    const result = await customersCollection.insertOne(req.body);
    res.json({ message: "Customer added", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add customer" });
  }
});

app.listen(port, async () => {
  await connectToMongoDB();
  console.log(`🌐 Server running at http://localhost:${port}`);
});
