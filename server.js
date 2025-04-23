const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser'); // ✅ To parse JSON bodies
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json()); // ✅ Add body parsing middleware

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
  if (accessToken) return accessToken;

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

// ✅ Create Salesforce Contact
const createSalesforceContact = async ({ name, email, phone }) => {
  const token = await getAccessToken();

  // Salesforce Contact object needs LastName (mandatory)
  const [firstName, ...lastNameParts] = name.split(" ");
  const lastName = lastNameParts.join(" ") || firstName;

  try {
    const response = await axios.post(
      process.env.SALESFORCE_CONTACT_URL, // e.g. https://yourInstance.salesforce.com/services/data/v60.0/sobjects/Contact
      {
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Phone: phone
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("✅ Salesforce Contact Created:", response.data.id);
    return response.data;
  } catch (err) {
    console.error("❌ Error creating Salesforce Contact:", err.response?.data || err.message);
    throw new Error("Failed to create Salesforce Contact");
  }
};


// ✅ Add Customer to MongoDB
app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    const newCustomer = { name, email, phone };
    await db.collection("customers_records").insertOne(newCustomer);
  
    // 2. Sync to Salesforce Contact
    const sfResponse = await createSalesforceContact(newCustomer);

    res.status(201).json({ message: '✅ Customer added successfully',
       customer: newCustomer });
  } catch (err) {
    console.error("❌ Failed to add customer:", err);
    res.status(500).json({ error: 'Server error adding customer' });
  }
});

// Test Route
app.get('/', (req, res) => {
  res.send("🔥 API is Live!");
});

// Fetch Customers from MongoDB or Salesforce
app.get('/api/customers', async (req, res) => {
  const useSalesforce = req.query.source === 'sf';

  try {
    if (useSalesforce) {
      const sfCustomers = await fetchSalesforceCustomers();
      return res.json(sfCustomers);
    }

    const customers = await db.collection("customers_records").find().toArray();
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to fetch customers");
  }
});

// Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
