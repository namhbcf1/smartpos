// Script to apply username update via Wrangler D1
const { execSync } = require('child_process');
const fs = require('fs');

async function applyUsernameUpdate() {
  try {
    console.log('🔄 Applying username update via Wrangler D1...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('update-hoa-username.sql', 'utf8');
    console.log('📄 SQL content loaded');
    
    // Apply the SQL using wrangler d1 execute
    console.log('⚡ Executing SQL via Wrangler...');
    
    const command = `npx wrangler d1 execute smartpos-db --file=update-hoa-username.sql --remote`;
    
    console.log('🚀 Running command:', command);
    
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ SQL executed successfully!');
    console.log('📋 Result:', result);
    
    // Now verify by running our test script
    console.log('\n🔍 Verifying update...');
    const verifyResult = execSync('node update-username.js', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('📋 Verification result:', verifyResult);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stdout) {
      console.log('📤 stdout:', error.stdout);
    }
    if (error.stderr) {
      console.log('📥 stderr:', error.stderr);
    }
  }
}

// Run the update
applyUsernameUpdate();
