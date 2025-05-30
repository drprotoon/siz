// Test script to verify authentication is working
const fetch = require('node-fetch');

async function testAuth() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('Testing authentication system...\n');
  
  try {
    // Test 1: Login with admin credentials
    console.log('1. Testing login with admin credentials...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login-jwt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.ok && loginData.session?.access_token) {
      const token = loginData.session.access_token;
      console.log('✅ Login successful, token received');
      
      // Test 2: Access admin route with token
      console.log('\n2. Testing admin route access with token...');
      const adminResponse = await fetch(`${baseUrl}/api/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Admin route response status:', adminResponse.status);
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('✅ Admin route accessible');
        console.log('Products count:', adminData.length);
      } else {
        const errorData = await adminResponse.json();
        console.log('❌ Admin route failed:', errorData);
      }
      
      // Test 3: Test admin check endpoint
      console.log('\n3. Testing admin check endpoint...');
      const adminCheckResponse = await fetch(`${baseUrl}/api/auth/admin-check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Admin check response status:', adminCheckResponse.status);
      const adminCheckData = await adminCheckResponse.json();
      console.log('Admin check response:', JSON.stringify(adminCheckData, null, 2));
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testAuth();
