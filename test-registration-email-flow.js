// Test full registration flow with email integration
const testFullRegistrationFlow = async () => {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing Full Registration Flow with Email Integration...\n');

  // Test 1: Student Registration with Email
  console.log('1️⃣ Testing Student Registration with Welcome Email...');
  try {
    const studentData = {
      name: 'Test Student',
      email: 'abdullahjaveda47@gmail.com', // Your email for testing
      password: 'password123',
      role: 'student',
      department: 'computer-science',
      semester: '6',
      regNo: 'SP22-BCS-042'
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
      console.log('📧 Welcome email should be sent to:', result.user.email);
    } else {
      const error = await studentResponse.json();
      console.log('❌ Student registration failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Student registration error:', error.message);
  }

  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Company Registration with Email
  console.log('\n2️⃣ Testing Company Registration with Welcome Email...');
  try {
    const companyData = {
      name: 'Test Company Ltd',
      email: 'abdullahjaveda47@gmail.com', // Your email for testing
      password: 'password123',
      role: 'company',
      companyName: 'Test Company Ltd',
      industry: 'technology',
      website: 'https://testcompany.com',
      about: 'We are a leading technology company specializing in innovative solutions.'
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
      console.log('📧 Welcome email should be sent to:', result.user.email);
    } else {
      const error = await companyResponse.json();
      console.log('❌ Company registration failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Company registration error:', error.message);
  }

  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Supervisor Registration with Email
  console.log('\n3️⃣ Testing Supervisor Registration with Welcome Email...');
  try {
    const supervisorData = {
      name: 'Dr. Test Supervisor',
      email: 'abdullahjaveda47@gmail.com', // Your email for testing
      password: 'password123',
      role: 'supervisor',
      department: 'computer-science',
      designation: 'Assistant Professor'
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
      console.log('📧 Welcome email should be sent to:', result.user.email);
    } else {
      const error = await supervisorResponse.json();
      console.log('❌ Supervisor registration failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Supervisor registration error:', error.message);
  }

  console.log('\n🏁 Full registration flow tests completed!');
  console.log('📧 Check your email inbox at: abdullahjaveda47@gmail.com');
  console.log('You should have received 3 beautiful welcome emails (student, company, supervisor)');
};

// Run the test
testFullRegistrationFlow().catch(console.error);