#!/usr/bin/env node

/**
 * Test script to debug Returns API issues
 */

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

async function testReturnsAPI() {
  console.log('🧪 Testing Returns API...');
  console.log('📍 API Base URL:', API_BASE_URL);
  console.log('🔑 Using token:', TEST_TOKEN.substring(0, 50) + '...');
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing API health...');
    const healthResponse = await makeRequest(`${API_BASE_URL}/health`);
    console.log('Health Status:', healthResponse.status);
    console.log('Health Data:', healthResponse.data);
    
    // Test 2: Auth check
    console.log('\n2️⃣ Testing authentication...');
    const authResponse = await makeRequest(`${API_BASE_URL}/api/v1/auth/me`);
    console.log('Auth Status:', authResponse.status);
    console.log('Auth Data:', authResponse.data);
    
    // Test 3: Returns endpoint
    console.log('\n3️⃣ Testing returns endpoint...');
    const returnsResponse = await makeRequest(`${API_BASE_URL}/api/v1/returns`);
    console.log('Returns Status:', returnsResponse.status);
    console.log('Returns Data:', returnsResponse.data);
    
    // Test 4: Returns with pagination
    console.log('\n4️⃣ Testing returns with pagination...');
    const paginatedResponse = await makeRequest(`${API_BASE_URL}/api/v1/returns?page=1&limit=10`);
    console.log('Paginated Status:', paginatedResponse.status);
    console.log('Paginated Data:', paginatedResponse.data);
    
    // Test 5: Database initialization
    console.log('\n5️⃣ Testing database initialization...');
    const initResponse = await makeRequest(`${API_BASE_URL}/api/v1/init-database`, {
      method: 'POST'
    });
    console.log('Init Status:', initResponse.status);
    console.log('Init Data:', initResponse.data);
    
    // Test 6: Returns endpoint after init
    console.log('\n6️⃣ Testing returns endpoint after database init...');
    const returnsAfterInitResponse = await makeRequest(`${API_BASE_URL}/api/v1/returns`);
    console.log('Returns After Init Status:', returnsAfterInitResponse.status);
    console.log('Returns After Init Data:', returnsAfterInitResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testReturnsAPI()
  .then(() => {
    console.log('\n✅ Tests completed');
  })
  .catch(error => {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  });
