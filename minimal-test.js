const express = require('express');
const app = express();

app.use(express.json());

// Simple test route
app.post('/api/offer-letters/send', (req, res) => {
  console.log('Request received:', req.body);
  res.json({ success: true, message: 'Test successful' });
});

app.listen(5004, () => {
  console.log('Test server running on port 5004');
});