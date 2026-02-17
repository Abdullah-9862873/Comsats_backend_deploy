const jwt = require('jsonwebtoken');
const JWT_SECRET = 'abcqwe123rtyh6';

console.log('🔍 Testing different token formats...\n');

// 1. Test the format our direct API test uses (which works)
const workingToken = jwt.sign(
  { 
    id: '68a9a8b4313ff7f3433e7880', 
    role: 'company',
    email: 'company123@gmail.com'
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('✅ Working token format (from our test):');
try {
  const decoded = jwt.verify(workingToken, JWT_SECRET);
  console.log('   Decoded:', decoded);
} catch (error) {
  console.log('   Error:', error.message);
}

// 2. Test the format that might be coming from frontend auth
// (checking common variations that might be used)
const frontendStyleToken1 = jwt.sign(
  { 
    userId: '68a9a8b4313ff7f3433e7880',  // Note: userId instead of id
    role: 'company',
    email: 'company123@gmail.com'
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('\n❓ Frontend style token 1 (userId field):');
try {
  const decoded = jwt.verify(frontendStyleToken1, JWT_SECRET);
  console.log('   Decoded:', decoded);
  console.log('   Has id field?', decoded.id ? 'YES' : 'NO');
  console.log('   Has userId field?', decoded.userId ? 'YES' : 'NO');
} catch (error) {
  console.log('   Error:', error.message);
}

// 3. Test token with additional fields that might be in frontend
const frontendStyleToken2 = jwt.sign(
  { 
    id: '68a9a8b4313ff7f3433e7880',
    userId: '68a9a8b4313ff7f3433e7880',
    role: 'company',
    email: 'company123@gmail.com',
    name: 'Tech Pro',
    iat: Math.floor(Date.now() / 1000)
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('\n❓ Frontend style token 2 (with extra fields):');
try {
  const decoded = jwt.verify(frontendStyleToken2, JWT_SECRET);
  console.log('   Decoded:', decoded);
  console.log('   Has id field?', decoded.id ? 'YES' : 'NO');
} catch (error) {
  console.log('   Error:', error.message);
}

console.log('\n🎯 The key is that auth middleware looks for decoded.id');
console.log('   If frontend token uses "userId" instead of "id", it will fail');
