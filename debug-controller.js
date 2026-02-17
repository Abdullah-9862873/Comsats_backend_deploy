// Debug script to check controller import
console.log('Starting debug...');

try {
  const controller = require('./controllers/internshipReportControllerTest');
  console.log('Controller imported successfully');
  console.log('Controller type:', typeof controller);
  console.log('Controller keys:', Object.keys(controller));
  
  // Check each function
  Object.keys(controller).forEach(key => {
    console.log(`${key}: ${typeof controller[key]}`);
  });
  
  // Try calling a function
  if (typeof controller.getStudentReport === 'function') {
    console.log('getStudentReport is a function');
  } else {
    console.log('getStudentReport is NOT a function');
  }
  
} catch (error) {
  console.error('Error importing controller:', error);
}
