// Test admin login functionality
const testAdminLogin = async () => {
  try {
    console.log('🧪 Testing Admin Login...');
    
    const response = await fetch('http://localhost:5003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@fyp.com',
        password: 'admin123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin login successful!');
      console.log('👤 User:', data.user);
      console.log('🔑 Token received:', data.token ? 'Yes' : 'No');
      console.log('👨‍💼 Role:', data.user.role);
      
      if (data.user.role === 'admin') {
        console.log('🎯 Admin role confirmed - Dashboard access granted!');
      }
    } else {
      const error = await response.text();
      console.log('❌ Login failed:', error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAdminLogin();
