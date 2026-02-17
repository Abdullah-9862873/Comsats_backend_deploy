const axios = require('axios');

const BASE_URL = 'http://localhost:5005/api';

async function testDoubleVerification() {
    console.log('🧪 Testing Double Verification Issue...\n');
    
    // First, register a test user
    const timestamp = Date.now();
    const testUser = {
        name: 'Double Test User',
        email: `double.test.${timestamp}@gmail.com`,
        password: 'testpass123',
        role: 'student',
        department: 'Computer Science',
        semester: '8th',
        regNo: `FA21-BSE-${timestamp}`
    };
    
    try {
        console.log('1️⃣ Registering test user...');
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
        
        if (registerResponse.data.success) {
            console.log('✅ Registration successful');
            console.log(`   Email: ${testUser.email}`);
            
            // Extract token from response (if available) or simulate one
            // For this test, we'll need to check the database or logs for the actual token
            console.log('\n2️⃣ Simulating double verification calls...');
            console.log('   (You would need the actual verification token from the email)');
            console.log('   This test demonstrates the issue you\'re experiencing:');
            console.log('   • React StrictMode causes useEffect to run twice');
            console.log('   • First call: Token valid → User verified → Token cleared → Success');
            console.log('   • Second call: Token cleared → 400 error → But user already verified');
            console.log('\n✅ The fix with useRef should prevent the double API call');
        }
    } catch (error) {
        console.log('❌ Registration failed:', error.response?.data?.message);
    }
}

testDoubleVerification();