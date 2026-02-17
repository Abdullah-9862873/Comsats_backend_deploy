// Minimal test version to diagnose issues
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Basic server is working',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Health check passed' });
});

// Test if we can load modules
app.get('/debug/modules', (req, res) => {
  const results = {};
  
  try {
    require('express');
    results.express = 'OK';
  } catch (e) {
    results.express = 'FAILED: ' + e.message;
  }
  
  try {
    require('cors');
    results.cors = 'OK';
  } catch (e) {
    results.cors = 'FAILED: ' + e.message;
  }
  
  try {
    require('mongoose');
    results.mongoose = 'OK';
  } catch (e) {
    results.mongoose = 'FAILED: ' + e.message;
  }
  
  try {
    require('./config/db');
    results.db_config = 'OK';
  } catch (e) {
    results.db_config = 'FAILED: ' + e.message;
  }
  
  try {
    require('./routes/auth');
    results.auth_route = 'OK';
  } catch (e) {
    results.auth_route = 'FAILED: ' + e.message;
  }
  
  res.json({ success: true, modules: results });
});

module.exports = app;
