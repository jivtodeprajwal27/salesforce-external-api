const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

let db;

// MongoDB Connection Setup
const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db("agentforcedb");
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err);
  }
};

// Get Salesforce Access Token
let accessToken = null;
const getAccessToken = async () => {
  if (accessToken) return accessToken; // cache reuse

  try {
    const res = await axios.post(process.env.SALESFORCE_TOKEN_URL, null, {
      params: {
        grant_type: 'client_credentials',
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET
      }
    });

    accessToken = res.data.access_token;
    return accessToken;
  } catch (err) {
    console.error("❌ Error getting access token", err.response?.data || err.message);
    throw new Error("Access token failed");
  }
};

// Fetch Customers from Salesforce API
const fetchSalesforceCustomers = async () => {
  const token = await getAccessToken();

  try {
    const res = await axios.get(process.env.SALESFORCE_REST_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return res.data;
  } catch (err) {
    console.error("❌ Salesforce API error:", err.response?.data || err.message);
    throw new Error("Salesforce API failed");
  }
};

// API Endpoints
app.get('/', (req, res) => {
  res.send("🔥 API is Live!");
});

// Fetch Customers from MongoDB or Salesforce based on query
app.get('/api/customers', async (req, res) => {
  const useSalesforce = req.query.source === 'sf'; // Query parameter to use Salesforce data

  try {
    if (useSalesforce) {
      const sfCustomers = await fetchSalesforceCustomers();
      return res.json(sfCustomers);
    }

    // Fetch customers from MongoDB if Salesforce flag is not passed
    const customers = await db.collection("customers_records").find().toArray();
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to fetch customers");
  }
});

// MongoDB connection and server initialization
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
