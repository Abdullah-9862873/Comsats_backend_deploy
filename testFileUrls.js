// Test script to check file URL generation
const path = require('path');

// Simulate the getFileUrl function
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  return `${req.protocol}://${req.get('host')}/${filePath.replace(/\\/g, '/')}`;
};

// Simulate a request object
const mockReq = {
  protocol: 'http',
  get: (header) => {
    if (header === 'host') return 'localhost:5002';
    return null;
  }
};

// Test with actual file paths
const testFilePaths = [
  'uploads/cvs/cv_688e46620974a2ce7d88ffa9_1754154647920.pdf',
  'uploads\\cvs\\cv_688e46620974a2ce7d88ffa9_1754154647920.pdf',
  'uploads/certificates/cert_688e46620974a2ce7d88ffa9_1754154647956_sp22-bcs-063.pdf'
];

console.log('Testing file URL generation:');
testFilePaths.forEach(filePath => {
  const url = getFileUrl(mockReq, filePath);
  console.log(`File path: ${filePath}`);
  console.log(`Generated URL: ${url}`);
  console.log('---');
});
