const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    "https://vercel-fronted.onrender.com", // ✅ Replace with your deployed frontend URL
    "http://localhost:3000"             // ✅ Local development
  ],
  credentials: true
}));

app.use(bodyParser.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/auth/users', require('./routes/users'));
app.use('/api/session', require('./routes/session'));

// Export the app for deployment (Render or Vercel)
module.exports = app;
