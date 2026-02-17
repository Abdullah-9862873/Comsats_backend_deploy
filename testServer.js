const express = require('express');
const app = express();
const path = require('path');

// Test static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working',
    uploadsPath: path.join(__dirname, 'uploads'),
    staticMount: '/uploads'
  });
});

const PORT = 5003;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/uploads/cvs/cv_688e46620974a2ce7d88ffa9_1754154647920.pdf`);
});
