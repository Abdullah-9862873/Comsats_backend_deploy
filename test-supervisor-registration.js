const axios = require('axios');

const BASE_URL = 'http://localhost:5005/api';

async function testSupervisorRegistration() {
    console.log('🧪 Testing Supervisor Registration Fix...\n');
    
    const supervisorData = {
        name: 'Test Supervisor',
        email: `test.supervisor.${Date.now()}@comsats.edu.pk`,
        password: 'testpass123',
        role: 'supervisor',
        department: 'electrical-engineering',
        designation: 'Assistant Professor'
    };
    
    try {
        console.log('1️⃣ Testing supervisor registration...');
        console.log('   Data:', JSON.stringify(supervisorData, null, 2));
        
        const response = await axios.post(`${BASE_URL}/auth/register`, supervisorData);
        
        if (response.data.success) {
            console.log('✅ Supervisor registration successful!');
            console.log(`   Name: ${response.data.user.name}`);
            console.log(`   Email: ${response.data.user.email}`);
            console.log(`   Role: ${response.data.user.role}`);
            console.log(`   Verified: ${response.data.user.isVerified}`);
            console.log(`   Message: ${response.data.message}`);
        }
    } catch (error) {
        console.log('❌ Supervisor registration failed:');
        console.log('   Error:', error.response?.data?.message || error.message);
        console.log('   Status:', error.response?.status);
    }
}

testSupervisorRegistration();