// Test auth middleware import
try {
  console.log('Testing auth middleware import...');
  const auth = require('./middleware/auth');
  console.log('✅ Auth middleware imported successfully');
  console.log('Auth type:', typeof auth);
  
  // Test if it's a function
  if (typeof auth === 'function') {
    console.log('✅ Auth is a function - can be used as middleware');
  } else {
    console.log('❌ Auth is not a function - this will cause route errors');
  }
  
} catch (error) {
  console.error('❌ Auth middleware import failed:', error.message);
  console.error('Stack:', error.stack);
}
