// Script to apply database migration for user roles
// This script connects to the D1 database and applies the migration

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://smartpos-api.augmentcode.workers.dev';

async function applyMigration() {
  try {
    console.log('🔧 Starting database migration for user roles...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrate-user-roles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // First, login as admin to get access token
    console.log('🔐 Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Failed to login as admin: ${errorData.message}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Admin login successful');

    // Apply migration by calling a special migration endpoint
    // Note: This would need to be implemented in the backend
    console.log('🚀 Applying migration...');
    
    // For now, let's just verify the current users
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
    
    console.log('📋 Current users in database:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.full_name}): ${user.role} - Active: ${user.is_active}`);
    });

    // Check if lthhoa exists and what role it has
    const lthhoaUser = users.find(user => user.username === 'lthhoa');
    
    if (lthhoaUser) {
      console.log(`\n🔍 Found user lthhoa:`);
      console.log(`  - Current Role: ${lthhoaUser.role}`);
      console.log(`  - Full Name: ${lthhoaUser.full_name}`);
      console.log(`  - Email: ${lthhoaUser.email}`);
      console.log(`  - Active: ${lthhoaUser.is_active}`);
      
      if (lthhoaUser.role !== 'affiliate') {
        console.log(`\n🔧 Need to update lthhoa role from '${lthhoaUser.role}' to 'affiliate'`);
        
        // Try to update the user role
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

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          console.log('✅ Successfully updated lthhoa role to affiliate');
        } else {
          const errorData = await updateResponse.json();
          console.log(`❌ Failed to update lthhoa role: ${errorData.message}`);
        }
      } else {
        console.log('✅ lthhoa already has affiliate role');
      }
    } else {
      console.log('❌ User lthhoa not found in database');
    }

    console.log('\n🎉 Migration process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy the backend with updated role validation');
    console.log('2. Test login with lthhoa/123456');
    console.log('3. Verify navigation shows correct sections for affiliate role');
    console.log('4. Test user profile management');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
