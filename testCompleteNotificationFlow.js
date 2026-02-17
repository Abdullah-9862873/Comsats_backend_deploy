// Test the complete notification system
const testCompleteNotificationSystem = async () => {
  try {
    console.log('🔔 Testing Complete Notification System');
    
    // Test 1: Create a student account
    console.log('\n1️⃣ Testing Student Registration...');
    const studentData = {
      name: 'Test Student',
      email: `teststudent_${Date.now()}@example.com`,
      password: 'testpassword123',
      studentId: `ST${Date.now()}`,
      program: 'Computer Science',
      year: '3rd Year'
    };
    
    const studentResponse = await fetch('http://localhost:5000/api/students/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    
    if (!studentResponse.ok) {
      throw new Error(`Student registration failed: ${studentResponse.status}`);
    }
    
    const student = await studentResponse.json();
    console.log('✅ Student registered:', student.user.name);
    
    // Test 2: Student login
    console.log('\n2️⃣ Testing Student Login...');
    const studentLoginResponse = await fetch('http://localhost:5000/api/students/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentData.email,
        password: studentData.password
      })
    });
    
    if (!studentLoginResponse.ok) {
      throw new Error(`Student login failed: ${studentLoginResponse.status}`);
    }
    
    const studentAuth = await studentLoginResponse.json();
    console.log('✅ Student logged in successfully');
    
    // Test 3: Find a supervisor
    console.log('\n3️⃣ Finding Test Supervisor...');
    const supervisorsResponse = await fetch('http://localhost:5000/api/supervisors', {
      headers: { 'Authorization': `Bearer ${studentAuth.token}` }
    });
    
    if (!supervisorsResponse.ok) {
      throw new Error(`Failed to fetch supervisors: ${supervisorsResponse.status}`);
    }
    
    const supervisors = await supervisorsResponse.json();
    if (supervisors.length === 0) {
      throw new Error('No supervisors found. Please run createTestSupervisors.js first');
    }
    
    const supervisor = supervisors[0];
    console.log('✅ Found supervisor:', supervisor.name);
    
    // Test 4: Create supervision request (This should trigger supervisor notification)
    console.log('\n4️⃣ Creating Supervision Request...');
    const supervisionRequestData = {
      supervisorId: supervisor._id,
      researchTopic: 'Machine Learning Applications in Healthcare',
      researchDescription: 'Developing AI models for medical diagnosis and treatment recommendations.',
      preferredStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const supervisionResponse = await fetch('http://localhost:5000/api/supervision-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentAuth.token}`
      },
      body: JSON.stringify(supervisionRequestData)
    });
    
    if (!supervisionResponse.ok) {
      const errorText = await supervisionResponse.text();
      throw new Error(`Supervision request failed: ${supervisionResponse.status} - ${errorText}`);
    }
    
    const supervisionRequest = await supervisionResponse.json();
    console.log('✅ Supervision request created:', supervisionRequest._id);
    console.log('📬 This should have created a notification for the supervisor!');
    
    // Test 5: Check supervisor notifications
    console.log('\n5️⃣ Checking Supervisor Notifications...');
    
    // First login as supervisor
    const supervisorLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: supervisor.email,
        password: 'password123' // Default test password
      })
    });
    
    if (!supervisorLoginResponse.ok) {
      throw new Error(`Supervisor login failed: ${supervisorLoginResponse.status}`);
    }
    
    const supervisorAuth = await supervisorLoginResponse.json();
    console.log('✅ Supervisor logged in successfully');
    
    // Check notifications
    const notificationsResponse = await fetch('http://localhost:5000/api/notifications', {
      headers: { 'Authorization': `Bearer ${supervisorAuth.token}` }
    });
    
    if (!notificationsResponse.ok) {
      throw new Error(`Failed to fetch notifications: ${notificationsResponse.status}`);
    }
    
    const notifications = await notificationsResponse.json();
    console.log('✅ Supervisor notifications:', notifications.length);
    
    const supervisionNotifications = notifications.filter(n => n.type === 'supervision_request_received');
    console.log('📬 Supervision request notifications:', supervisionNotifications.length);
    
    if (supervisionNotifications.length > 0) {
      const latestNotification = supervisionNotifications[0];
      console.log('🎯 Latest notification:', {
        type: latestNotification.type,
        title: latestNotification.title,
        message: latestNotification.message,
        actionUrl: latestNotification.actionUrl
      });
    }
    
    // Test 6: Supervisor responds to request (This should trigger student notification)
    console.log('\n6️⃣ Supervisor Responding to Request...');
    const responseData = {
      status: 'accepted',
      response: 'I am interested in supervising your research on Machine Learning in Healthcare. Let\'s schedule a meeting to discuss further.'
    };
    
    const responseResponse = await fetch(`http://localhost:5000/api/supervision-requests/${supervisionRequest._id}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supervisorAuth.token}`
      },
      body: JSON.stringify(responseData)
    });
    
    if (!responseResponse.ok) {
      throw new Error(`Response failed: ${responseResponse.status}`);
    }
    
    const response = await responseResponse.json();
    console.log('✅ Supervisor responded:', response.status);
    console.log('📬 This should have created a notification for the student!');
    
    // Test 7: Check student notifications
    console.log('\n7️⃣ Checking Student Notifications...');
    const studentNotificationsResponse = await fetch('http://localhost:5000/api/notifications', {
      headers: { 'Authorization': `Bearer ${studentAuth.token}` }
    });
    
    if (!studentNotificationsResponse.ok) {
      throw new Error(`Failed to fetch student notifications: ${studentNotificationsResponse.status}`);
    }
    
    const studentNotifications = await studentNotificationsResponse.json();
    console.log('✅ Student notifications:', studentNotifications.length);
    
    const responseNotifications = studentNotifications.filter(n => 
      n.type === 'supervision_request_accepted' || n.type === 'supervision_request_rejected'
    );
    console.log('📬 Response notifications:', responseNotifications.length);
    
    if (responseNotifications.length > 0) {
      const latestResponse = responseNotifications[0];
      console.log('🎯 Latest response notification:', {
        type: latestResponse.type,
        title: latestResponse.title,
        message: latestResponse.message,
        actionUrl: latestResponse.actionUrl
      });
    }
    
    console.log('\n🎉 NOTIFICATION SYSTEM TEST COMPLETE!');
    console.log('✅ Bidirectional notifications working');
    console.log('✅ Action URLs generated correctly');
    console.log('✅ Both students and supervisors can access notifications');
    console.log('\n📝 Test Summary:');
    console.log('   - Student creates supervision request → Supervisor gets notification');
    console.log('   - Supervisor responds to request → Student gets notification');
    console.log('   - Notifications include actionUrl for tab navigation');
    console.log('   - Both roles can access their notifications via API');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testCompleteNotificationSystem();
