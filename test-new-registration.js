// Test script for new registration functionality
const testRegistration = async () => {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing Registration System with New Requirements...\n');

  // Test 1: Student Registration with Dropdown System
  console.log('1️⃣ Testing Student Registration with Dropdowns...');
  try {
    const studentData = {
      name: 'Test Student',
      email: 'test.student@comsats.edu.pk',
      password: 'password123',
      role: 'student',
      department: 'computer-science',
      semester: '6',
      regNo: 'SP22-BCS-042' // This will be constructed from sessionYear, regDepartment, rollNumber
    };

    const studentResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData)
    });

    if (studentResponse.ok) {
      const result = await studentResponse.json();
      console.log('✅ Student registration successful:', result.user.name);
    } else {
      const error = await studentResponse.json();
      console.log('❌ Student registration failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Student registration error:', error.message);
  }

  // Test 2: Company Registration with Website and About
  console.log('\n2️⃣ Testing Company Registration with Website and About...');
  try {
    const companyData = {
      name: 'TechNoob Solutions',
      email: 'hr@technoob.com',
      password: 'password123',
      role: 'company',
      companyName: 'TechNoob Solutions',
      industry: 'technology',
      website: 'https://technoob.com',
      about: 'We are a leading technology company specializing in software development and innovation.'
    };

    const companyResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData)
    });

    if (companyResponse.ok) {
      const result = await companyResponse.json();
      console.log('✅ Company registration successful:', result.user.name);
      
      // Test if company profile auto-populates with website and about
      console.log('   Testing auto-population of company profile...');
      const token = result.token;
      
      const profileResponse = await fetch(`${baseUrl}/api/company-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        console.log('   ✅ Website saved:', profile.data.website);
        console.log('   ✅ About saved:', profile.data.about ? 'Yes' : 'No');
      }
    } else {
      const error = await companyResponse.json();
      console.log('❌ Company registration failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Company registration error:', error.message);
  }

  // Test 3: Supervisor Registration (no semester/regNo)
  console.log('\n3️⃣ Testing Supervisor Registration (simplified)...');
  try {
    const supervisorData = {
      name: 'Dr. Test Supervisor',
      email: 'supervisor@comsats.edu.pk',
      password: 'password123',
      role: 'supervisor',
      department: 'computer-science',
      designation: 'Assistant Professor'
      // Note: No semester or regNo fields
    };

    const supervisorResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(supervisorData)
    });

    if (supervisorResponse.ok) {
      const result = await supervisorResponse.json();
      console.log('✅ Supervisor registration successful:', result.user.name);
    } else {
      const error = await supervisorResponse.json();
      console.log('❌ Supervisor registration failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Supervisor registration error:', error.message);
  }

  console.log('\n🏁 Registration tests completed!');
};

// Run the test
testRegistration().catch(console.error);