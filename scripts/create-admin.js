/**
 * Create Admin User Script
 * Creates an admin user in production database
 */

const API_BASE_URL = 'https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1';

const ADMIN_USER = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@smartpos.vn',
  full_name: 'System Administrator',
  role: 'admin'
};

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`📡 Making request to: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  console.log(`📊 Response status: ${response.status}, Success: ${data.success}`);
  
  return { response, data };
}

async function createAdminUser() {
  console.log('👤 Creating admin user...');
  
  const { response, data } = await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(ADMIN_USER)
  });
  
  if (!response.ok) {
    if (data.message && data.message.includes('already exists')) {
      console.log('ℹ️ Admin user already exists');
      return true;
    }
    throw new Error(`Admin user creation failed: ${data.message || 'Unknown error'}`);
  }
  
  console.log('✅ Admin user created successfully');
  return true;
}

async function testAdminLogin() {
  console.log('🔐 Testing admin login...');
  
  const { response, data } = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: ADMIN_USER.username,
      password: ADMIN_USER.password
    })
  });
  
  if (!response.ok || !data.success) {
    throw new Error(`Admin login test failed: ${data.message || 'Unknown error'}`);
  }
  
  console.log('✅ Admin login test successful');
  return data.data.token;
}

async function main() {
  try {
    console.log('🎯 Creating Admin User for Production');
    console.log('=' .repeat(50));
    
    // Step 1: Create admin user
    await createAdminUser();
    
    // Step 2: Test admin login
    const token = await testAdminLogin();
    
    console.log('=' .repeat(50));
    console.log('🎉 Admin user setup completed successfully!');
    console.log('');
    console.log('👤 Admin Credentials:');
    console.log(`   • Username: ${ADMIN_USER.username}`);
    console.log(`   • Password: ${ADMIN_USER.password}`);
    console.log(`   • Email: ${ADMIN_USER.email}`);
    console.log('');
    console.log('🔑 Token (for testing): ' + token.substring(0, 20) + '...');
    console.log('');
    console.log('🚀 Next: Run the RBAC initialization script');
    
  } catch (error) {
    console.error('❌ Admin user creation failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
