const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testSupAPIDirectly() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Find ALL supervisors first
        const supervisors = await User.find({ role: 'supervisor' }).select('-password');
        
        console.log('\n=== ALL SUPERVISORS IN DATABASE ===');
        supervisors.forEach((sup, index) => {
            console.log(`${index + 1}. ID: ${sup._id}`);
            console.log(`   Name: ${sup.name}`);
            console.log(`   Email: ${sup.email}`);
            console.log(`   Designation: ${sup.supervisor?.designation || 'Not found'}`);
            console.log('');
        });
        
        if (supervisors.length === 0) {
            console.log('No supervisors found in database');
            return;
        }
        
        // Use the first supervisor found
        const supervisor = supervisors[0];
        const supervisorId = supervisor._id.toString();
        
        console.log('\n=== RAW DATABASE DATA ===');
        console.log('Supervisor ID:', supervisorId);
        console.log('Name:', supervisor.name);
        console.log('Email:', supervisor.email);
        console.log('Role:', supervisor.role);
        console.log('\n=== SUPERVISOR NESTED OBJECT ===');
        console.log(JSON.stringify(supervisor.supervisor, null, 2));
        
        console.log('\n=== FIELD ACCESS TEST ===');
        console.log('supervisor.supervisor?.department:', supervisor.supervisor?.department);
        console.log('supervisor.supervisor?.designation:', supervisor.supervisor?.designation);
        
        console.log('\n=== WHAT THE API WOULD RETURN ===');
        const apiResponse = {
            success: true,
            data: supervisor
        };
        
        console.log('API response data.supervisor?.designation:', apiResponse.data.supervisor?.designation);
        
        console.log('\n=== FRONTEND PROCESSING SIMULATION ===');
        const data = apiResponse.data;
        const profileData = {
            name: data.name || '',
            email: data.email || '',
            department: data.supervisor?.department || 'Not specified',
            designation: data.supervisor?.designation || 'Not specified',
            phone: data.supervisor?.phone || '',
            office: data.supervisor?.office || '',
            officeHours: data.supervisor?.officeHours || '',
            maxStudents: data.supervisor?.maxStudents || 10,
            expertise: data.supervisor?.expertise || []
        };
        
        console.log('Final designation value:', profileData.designation);
        
        if (profileData.designation === 'Not specified') {
            console.log('\n❌ ISSUE FOUND: Designation is "Not specified"');
            console.log('Debugging:');
            console.log('- data.supervisor exists:', !!data.supervisor);
            console.log('- data.supervisor.designation value:', data.supervisor?.designation);
            console.log('- typeof designation:', typeof data.supervisor?.designation);
        } else {
            console.log('\n✅ SUCCESS: Designation found:', profileData.designation);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testSupAPIDirectly();
