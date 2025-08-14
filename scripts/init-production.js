/**
 * Production Initialization Script
 * Initializes RBAC system in production environment
 */

const API_BASE_URL = 'https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1';

// Test credentials - replace with actual admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { response, data };
}

async function loginAdmin() {
  console.log('🔐 Logging in as admin...');
  
  const { response, data } = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(ADMIN_CREDENTIALS)
  });
  
  if (!response.ok || !data.success) {
    throw new Error(`Login failed: ${data.message || 'Unknown error'}`);
  }
  
  console.log('✅ Admin login successful');
  return data.data.token;
}

async function checkRBACStatus(token) {
  console.log('📊 Checking RBAC status...');
  
  const { response, data } = await makeRequest('/admin/rbac-status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`RBAC status check failed: ${data.message || 'Unknown error'}`);
  }
  
  console.log('📈 RBAC Status:', data.data);
  return data.data;
}

async function initializeRBAC(token) {
  console.log('🚀 Initializing RBAC system...');
  
  const { response, data } = await makeRequest('/admin/initialize-rbac', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`RBAC initialization failed: ${data.message || 'Unknown error'}`);
  }
  
  console.log('✅ RBAC system initialized successfully');
  return data.data;
}

async function getSystemInfo(token) {
  console.log('ℹ️ Getting system information...');
  
  const { response, data } = await makeRequest('/admin/system-info', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`System info failed: ${data.message || 'Unknown error'}`);
  }
  
  console.log('📋 System Information:', data.data);
  return data.data;
}

async function testPermissionEndpoints(token) {
  console.log('🧪 Testing permission endpoints...');
  
  // Test role templates endpoint
  const { response: templatesResponse, data: templatesData } = await makeRequest('/permissions/roles/templates', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (templatesResponse.ok && templatesData.success) {
    console.log('✅ Role templates endpoint working:', templatesData.data.length, 'templates found');
  } else {
    console.log('❌ Role templates endpoint failed:', templatesData.message);
  }
  
  return templatesData.data || [];
}

async function main() {
  try {
    console.log('🎯 Starting Production RBAC Initialization');
    console.log('=' .repeat(50));
    
    // Step 1: Login as admin
    const token = await loginAdmin();
    
    // Step 2: Check current RBAC status
    const status = await checkRBACStatus(token);
    
    // Step 3: Initialize RBAC if not already done
    if (!status.is_initialized) {
      await initializeRBAC(token);
      
      // Check status again after initialization
      await checkRBACStatus(token);
    } else {
      console.log('ℹ️ RBAC system already initialized');
    }
    
    // Step 4: Get system information
    await getSystemInfo(token);
    
    // Step 5: Test permission endpoints
    const roleTemplates = await testPermissionEndpoints(token);
    
    console.log('=' .repeat(50));
    console.log('🎉 Production initialization completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   • RBAC System: ${status.is_initialized ? 'Already initialized' : 'Newly initialized'}`);
    console.log(`   • Resources: ${status.statistics.resources}`);
    console.log(`   • Actions: ${status.statistics.actions}`);
    console.log(`   • Permissions: ${status.statistics.permissions}`);
    console.log(`   • Role Templates: ${roleTemplates.length}`);
    console.log('');
    console.log('🌐 Access URLs:');
    console.log(`   • Frontend: https://d84fe44e.smartpos-web.pages.dev`);
    console.log(`   • API: ${API_BASE_URL}`);
    console.log('');
    console.log('🔐 Next Steps:');
    console.log('   1. Login to the frontend with admin credentials');
    console.log('   2. Go to Employees page');
    console.log('   3. Click "Quản lý vai trò" to view role templates');
    console.log('   4. Click security icon on any employee to manage permissions');
    
  } catch (error) {
    console.error('❌ Production initialization failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
