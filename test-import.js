// Test to import and inspect the controller
try {
  console.log('Attempting to import controller...');
  const controller = require('./controllers/internshipReportController');
  
  console.log('✅ Import successful!');
  console.log('Controller type:', typeof controller);
  console.log('Controller keys:', Object.keys(controller));
  
  // Test each function
  Object.keys(controller).forEach(key => {
    const func = controller[key];
    console.log(`${key}: ${typeof func} ${typeof func === 'function' ? '✅' : '❌'}`);
  });
  
} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Stack:', error.stack);
}
