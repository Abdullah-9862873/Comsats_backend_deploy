// Test middleware import
try {
  console.log('Testing middleware import...');
  const upload = require('./middleware/internshipReportUpload');
  console.log('✅ Upload middleware imported successfully');
  console.log('Upload type:', typeof upload);
  console.log('Upload.single type:', typeof upload.single);
  
  const auth = require('./middleware/auth');
  console.log('✅ Auth middleware imported successfully');
  console.log('Auth type:', typeof auth);
  
} catch (error) {
  console.error('❌ Middleware import failed:', error.message);
  console.error('Stack:', error.stack);
}
