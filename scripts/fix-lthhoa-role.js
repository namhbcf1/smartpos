// Script to directly fix lthhoa user role in the database
// This script uses the API to update the user role

const API_BASE = 'https://smartpos-api.bangachieu2.workers.dev/api/v1';

async function fixLthhoaRole() {
  try {
    console.log('🔧 Starting role fix for lthhoa user...');

    // Try to update lthhoa directly via register endpoint (which supports updates)
    console.log('🔧 Updating lthhoa user via register endpoint...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'lthhoa',
        email: 'lthhoa@smartpos.vn',
        password: '123456',
        full_name: 'Lê Thị Hoa',
        role: 'affiliate'
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Successfully updated lthhoa via register endpoint');
      console.log('📋 Updated user:', registerData.data);

      // Test login with the updated user
      console.log('🔐 Testing login with lthhoa...');
      const testLoginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'lthhoa',
          password: '123456'
        })
      });

      if (testLoginResponse.ok) {
        const testLoginData = await testLoginResponse.json();
        console.log('✅ lthhoa login test successful');
        console.log('📋 User role:', testLoginData.data.user.role);
      } else {
        const errorData = await testLoginResponse.json();
        console.log(`❌ lthhoa login test failed: ${errorData.message}`);
      }

      return;
    } else {
      const registerError = await registerResponse.json();
      console.log(`❌ Register approach failed: ${registerError.message}`);
    }

    // Fallback: Try to login as admin first
    console.log('🔐 Fallback: Logging in as admin...');
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
      const errorText = await loginResponse.text();
      console.log('❌ Admin login response:', errorText);
      throw new Error(`Failed to login as admin: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Admin login successful');

    // Get all users to find lthhoa
    console.log('📋 Getting all users...');
    const usersResponse = await fetch(`${API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.log('❌ Users response:', errorText);
      throw new Error(`Failed to get users: ${usersResponse.status}`);
    }

    const usersData = await usersResponse.json();
    const users = usersData.data.users;
    
    console.log('📋 Current users in database:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.full_name}): ${user.role} - Active: ${user.is_active}`);
    });

    // Find lthhoa user
    const lthhoaUser = users.find(user => user.username === 'lthhoa');
    
    if (!lthhoaUser) {
      console.log('❌ User lthhoa not found in database');
      
      // Create lthhoa user with affiliate role
      console.log('🔧 Creating lthhoa user with affiliate role...');
      const createResponse = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'lthhoa',
          email: 'lthhoa@smartpos.vn',
          password: '123456',
          full_name: 'Lê Thị Hoa',
          role: 'affiliate'
        })
      });

      if (createResponse.ok) {
        const createData = await createResponse.json();
        console.log('✅ Successfully created lthhoa user with affiliate role');
        console.log('📋 New user:', createData.data);
      } else {
        const errorData = await createResponse.json();
        console.log(`❌ Failed to create lthhoa user: ${errorData.message}`);
      }
      
      return;
    }

    console.log(`\n🔍 Found user lthhoa:`);
    console.log(`  - ID: ${lthhoaUser.id}`);
    console.log(`  - Current Role: ${lthhoaUser.role}`);
    console.log(`  - Full Name: ${lthhoaUser.full_name}`);
    console.log(`  - Email: ${lthhoaUser.email}`);
    console.log(`  - Active: ${lthhoaUser.is_active}`);
    
    if (lthhoaUser.role !== 'affiliate') {
      console.log(`\n🔧 Updating lthhoa role from '${lthhoaUser.role}' to 'affiliate'...`);
      
      // Update the user role
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
        console.log('📋 Updated user:', updateData.data);
      } else {
        const errorData = await updateResponse.json();
        console.log(`❌ Failed to update lthhoa role: ${errorData.message}`);
        
        // Try alternative approach - register/update via auth endpoint
        console.log('🔧 Trying alternative approach via auth register...');
        const registerResponse = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'lthhoa',
            email: 'lthhoa@smartpos.vn',
            password: '123456',
            full_name: 'Lê Thị Hoa',
            role: 'affiliate'
          })
        });

        if (registerResponse.ok) {
          const registerData = await registerResponse.json();
          console.log('✅ Successfully updated lthhoa via register endpoint');
          console.log('📋 Updated user:', registerData.data);
        } else {
          const registerError = await registerResponse.json();
          console.log(`❌ Register approach also failed: ${registerError.message}`);
        }
      }
    } else {
      console.log('✅ lthhoa already has affiliate role');
    }

    console.log('\n🎉 Role fix process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Test login with lthhoa/123456');
    console.log('2. Verify user menu shows "Affiliate" role');
    console.log('3. Check navigation includes BÁN HÀNG and KHÁCH HÀNG sections');

  } catch (error) {
    console.error('❌ Role fix failed:', error.message);
    process.exit(1);
  }
}

// Run the role fix
fixLthhoaRole();
