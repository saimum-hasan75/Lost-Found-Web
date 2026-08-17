const express = require('express');
const cors = require('cors');
require('dotenv').config();

const itemRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');
const migrate = require('./config/migrate');

const app = express();

app.use(cors());
app.use(express.json());

// Run auto migration on startup
migrate();

app.get('/', (_req, res) => {
  res.json({ message: 'Pinboard Lost & Found API is running.' });
});

// Robust mount points for auth and items
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/auth', authRoutes);
app.use('/api', itemRoutes);
app.use('/', itemRoutes);

// Fallback 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
