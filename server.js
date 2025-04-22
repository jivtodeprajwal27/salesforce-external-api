const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
  }
}

connectDB();

// Route to get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const collection = client.db('agentforceDB').collection('customers_records');
    const customers = await collection.find().toArray();
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch customer data' });
  }
});

// Root route (optional)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
