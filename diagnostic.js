// Basic diagnostic script
console.log('=== DIAGNOSTIC SCRIPT ===');
console.log('Environment Variables:');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);

// Test filesystem
const fs = require('fs');
const path = require('path');

console.log('\nFilesystem check:');
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Uploads directory exists:', fs.existsSync(uploadsPath));

if (fs.existsSync(uploadsPath)) {
  const subdirs = ['cvs', 'certificates', 'profiles'];
  subdirs.forEach(dir => {
    const dirPath = path.join(uploadsPath, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      console.log(`${dir} directory: ${files.length} files`);
      if (files.length > 0) {
        console.log(`  First file: ${files[0]}`);
      }
    } else {
      console.log(`${dir} directory: NOT EXISTS`);
    }
  });
}

// Test URL generation
console.log('\nURL Generation Test:');
const mockReq = {
  protocol: 'http',
  get: (header) => header === 'host' ? 'localhost:5002' : null
};

const testPath = 'uploads/cvs/cv_688e46620974a2ce7d88ffa9_1754154647920.pdf';
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  return `${req.protocol}://${req.get('host')}/${filePath.replace(/\\/g, '/')}`;
};

const generatedUrl = getFileUrl(mockReq, testPath);
console.log('Test file path:', testPath);
console.log('Generated URL:', generatedUrl);

console.log('\n=== END DIAGNOSTIC ===');
