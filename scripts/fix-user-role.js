// Script to check and fix user roles in database
// Run this with: node scripts/fix-user-role.js

const API_BASE = 'https://smartpos-api.augmentcode.workers.dev';

async function checkAndFixUserRole() {
  try {
    console.log('🔍 Checking user lthhoa role...');
    
    // First, login as admin to get access token
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Failed to login as admin');
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Admin login successful');

    // Get all users to find lthhoa
    const usersResponse = await fetch(`${API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!usersResponse.ok) {
      throw new Error('Failed to get users');
    }

    const usersData = await usersResponse.json();
    const users = usersData.data.users;
    
    console.log('📋 All users:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.full_name}): ${user.role}`);
    });

    // Find lthhoa user
    const lthhoaUser = users.find(user => user.username === 'lthhoa');
    
    if (!lthhoaUser) {
      console.log('❌ User lthhoa not found');
      return;
    }

    console.log(`\n🔍 Found user lthhoa:`);
    console.log(`  - ID: ${lthhoaUser.id}`);
    console.log(`  - Username: ${lthhoaUser.username}`);
    console.log(`  - Full Name: ${lthhoaUser.full_name}`);
    console.log(`  - Email: ${lthhoaUser.email}`);
    console.log(`  - Current Role: ${lthhoaUser.role}`);
    console.log(`  - Active: ${lthhoaUser.is_active}`);

    if (lthhoaUser.role === 'affiliate') {
      console.log('✅ User lthhoa already has affiliate role');
      return;
    }

    // Update user role to affiliate
    console.log('\n🔧 Updating user role to affiliate...');
    const updateResponse = await fetch(`${API_BASE}/users/${lthhoaUser.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'affiliate'
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Failed to update user role: ${errorData.message}`);
    }

    const updateData = await updateResponse.json();
    console.log('✅ User role updated successfully');
    console.log(`  - New Role: ${updateData.data.role}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
checkAndFixUserRole();
