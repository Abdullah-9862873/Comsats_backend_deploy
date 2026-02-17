const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testSupervisorAPI() {
    try {
        console.log('Testing Supervisor API Endpoints...\n');
        
        // Generate a test supervisor token first
        const supervisorId = '678bd30031103b0c6859f1b3';
        const token = jwt.sign(
            {
                id: supervisorId,
                role: 'supervisor'
            },
            process.env.JWT_SECRET
        );
        
        console.log('Generated supervisor token:', token);
        
        // Test getting supervisor profile
        console.log('\n1. Testing GET /api/supervisors/profile');
        const profileResponse = await fetch('http://localhost:5002/api/supervisors/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        
        console.log('Profile Response Status:', profileResponse.status);
        const profileData = await profileResponse.json();
        console.log('Profile Response Data:');
        console.log(JSON.stringify(profileData, null, 2));
        
        // Check if designation exists in the response
        if (profileData.success && profileData.data) {
            const supervisor = profileData.data;
            console.log('\nSpecific Field Check:');
            console.log('Name:', supervisor.name);
            console.log('Email:', supervisor.email);
            console.log('Department:', supervisor.department);
            console.log('Designation:', supervisor.designation);
            console.log('Phone:', supervisor.phone);
            console.log('Office:', supervisor.office);
            
            if (!supervisor.designation) {
                console.log('\n❌ DESIGNATION IS MISSING OR UNDEFINED');
            } else {
                console.log('\n✅ Designation found:', supervisor.designation);
            }
        }
        
    } catch (error) {
        console.error('Error testing supervisor API:');
        console.error('Error:', error.message);
    }
}

testSupervisorAPI();
