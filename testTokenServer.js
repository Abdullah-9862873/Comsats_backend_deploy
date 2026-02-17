const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

// Simple test endpoint
app.post('/test-token', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header received:', authHeader);
    
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    console.log('Extracted token:', token);
    console.log('Token length:', token ? token.length : 0);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    
    res.json({ 
      success: true, 
      decoded: decoded,
      tokenLength: token.length
    });
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ 
      error: error.message,
      tokenReceived: !!req.headers.authorization
    });
  }
});

const PORT = 5003;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
