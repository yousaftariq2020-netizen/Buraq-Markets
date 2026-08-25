const express = require('express');
const path = require('path');
const sendEmailHandler = require('./api/send-email.js');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email API handlers
app.all('/api/send-email', (req, res) => {
  return sendEmailHandler(req, res);
});

app.all('/send-email', (req, res) => {
  return sendEmailHandler(req, res);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Buraq Markets' });
});

// Serve static assets with .html extension resolution
app.use(express.static(path.join(__dirname), {
  extensions: ['html']
}));

// Fallback to index.html for unmatched routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Buraq Markets server running at http://${HOST}:${PORT}`);
});
