// Simple test to see if the specific function is the issue
const controller = require('./controllers/internshipReportController');

console.log('Controller loaded');
console.log('submitReport type:', typeof controller.submitReport);
console.log('submitReport is function:', typeof controller.submitReport === 'function');

// Try to call it with mock parameters
if (typeof controller.submitReport === 'function') {
  console.log('✅ submitReport is a valid function');
} else {
  console.log('❌ submitReport is NOT a function');
  console.log('submitReport value:', controller.submitReport);
}
