const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testSupervisorLogin() {
    try {
        console.log('Testing Supervisor Login and Profile...\n');
        
        // First login to get a proper token
        console.log('1. Testing login for supervisor');
        const loginResponse = await fetch('http://localhost:5002/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test.supervisor@comsats.edu.pk',
                password: 'test123'
            })
        });
        
        console.log('Login Response Status:', loginResponse.status);
        const loginData = await loginResponse.json();
        console.log('Login Response Data:');
        console.log(JSON.stringify(loginData, null, 2));
        
        if (loginData.token) {
            console.log('\n2. Testing supervisor profile with real token');
            const profileResponse = await fetch('http://localhost:5002/api/supervisors/profile', {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`
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
                console.log('Role:', supervisor.role);
                console.log('Department:', supervisor.department);
                console.log('Designation:', supervisor.designation);
                console.log('Phone:', supervisor.phone);
                console.log('Office:', supervisor.office);
                
                // Check supervisor object nested fields
                if (supervisor.supervisor) {
                    console.log('\nSupervisor Object Fields:');
                    console.log('Department:', supervisor.supervisor.department);
                    console.log('Designation:', supervisor.supervisor.designation);
                    console.log('Phone:', supervisor.supervisor.phone);
                    console.log('Office:', supervisor.supervisor.office);
                }
                
                if (!supervisor.designation && !supervisor.supervisor?.designation) {
                    console.log('\n❌ DESIGNATION IS MISSING OR UNDEFINED');
                } else {
                    console.log('\n✅ Designation found:', supervisor.designation || supervisor.supervisor?.designation);
                }
            }
        }
        
    } catch (error) {
        console.error('Error testing supervisor API:');
        console.error('Error:', error.message);
    }
}

testSupervisorLogin();
