#!/usr/bin/env node

/**
 * Script to fix Returns backend issues by running migration and testing
 */

const { execSync } = require('child_process');
const https = require('https');

const API_BASE_URL = 'https://smartpos-api.bangachieu2.workers.dev';

// Test token from the browser (current session)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJzdG9yZSI6MSwiaWF0IjoxNzU0NjI0NDUwLCJleHAiOjE3NTQ3MTA4NTB9.Whk0gmfl0Wfc_cqx3w0W8DGr0kMh5S3KnBcA5_nuY7Y';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function runMigration() {
  console.log('🔄 Running returns system migration...');
  
  try {
    // Run the migration using wrangler
    const result = execSync('npx wrangler d1 execute smartpos-db --file=migrations/0003_returns_system.sql', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Migration completed successfully');
    console.log('Migration output:', result);
    return true;
  } catch (error) {
    console.log('⚠️ Migration may have already been run or failed:', error.message);
    // Don't fail completely - the migration might already be applied
    return false;
  }
}

async function testReturnsAPI() {
  console.log('\n🧪 Testing Returns API after migration...');
  
  try {
    // Test returns endpoint
    console.log('📍 Testing:', `${API_BASE_URL}/api/v1/returns`);
    const returnsResponse = await makeRequest(`${API_BASE_URL}/api/v1/returns`);
    
    console.log('Status:', returnsResponse.status);
    console.log('Response:', JSON.stringify(returnsResponse.data, null, 2));
    
    if (returnsResponse.status === 200) {
      console.log('✅ Returns API is working correctly!');
      return true;
    } else if (returnsResponse.status === 401) {
      console.log('🔐 Authentication issue - token may be expired');
      return false;
    } else {
      console.log('❌ Returns API returned error status:', returnsResponse.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing Returns API:', error.message);
    return false;
  }
}

async function deployBackend() {
  console.log('\n🚀 Deploying backend...');
  
  try {
    const result = execSync('npx wrangler deploy', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Backend deployed successfully');
    console.log('Deploy output:', result);
    return true;
  } catch (error) {
    console.error('❌ Backend deployment failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 SmartPOS Returns Backend Fix Script');
  console.log('=====================================');
  
  // Step 1: Run migration
  const migrationSuccess = await runMigration();
  
  // Step 2: Deploy backend
  const deploySuccess = await deployBackend();
  
  if (!deploySuccess) {
    console.log('❌ Deployment failed, cannot test API');
    process.exit(1);
  }
  
  // Wait a moment for deployment to propagate
  console.log('⏳ Waiting for deployment to propagate...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Step 3: Test API
  const apiSuccess = await testReturnsAPI();
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log('Migration:', migrationSuccess ? '✅ Success' : '⚠️ May already be applied');
  console.log('Deployment:', deploySuccess ? '✅ Success' : '❌ Failed');
  console.log('API Test:', apiSuccess ? '✅ Success' : '❌ Failed');
  
  if (apiSuccess) {
    console.log('\n🎉 Returns backend is now working correctly!');
    console.log('You can now test the frontend Returns page.');
  } else {
    console.log('\n❌ Returns backend still has issues.');
    console.log('Please check the logs and try manual debugging.');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
