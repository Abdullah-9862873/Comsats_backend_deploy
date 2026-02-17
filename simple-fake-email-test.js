const FakeEmailDetector = require('./services/fakeEmailDetector');

const detector = new FakeEmailDetector();

console.log('🧪 Testing Fake Email Detection...\n');

const tests = [
  ['user@gmail.com', false, 'Legitimate Gmail'],
  ['fake@10minutemail.com', true, 'Fake 10-minute mail'],
  ['test@tempmail.org', true, 'Temporary mail'],
  ['student@comsats.edu.pk', false, 'COMSATS email'],
  ['spam@mailinator.com', true, 'Mailinator fake'],
  ['', true, 'Empty email'],
  ['invalid-email', true, 'Invalid format']
];

tests.forEach(([email, shouldBlock, description]) => {
  const result = detector.checkEmail(email);
  const status = result.isFake === shouldBlock ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${description}`);
  console.log(`  Email: ${email}`);
  console.log(`  Expected: ${shouldBlock ? 'BLOCK' : 'ALLOW'}`);
  console.log(`  Got: ${result.isFake ? 'BLOCK' : 'ALLOW'}`);
  console.log(`  Reason: ${result.reason}`);
  console.log(`  Confidence: ${result.confidence}%\n`);
});

console.log('📊 Detector Stats:', detector.getStats());