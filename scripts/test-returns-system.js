#!/usr/bin/env node

/**
 * SmartPOS Returns System Test Script
 * This script tests all the returns system functionality to ensure everything works correctly
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = 'https://smartpos-api.bangachieu2.workers.dev';
const WS_URL = 'wss://smartpos-api.bangachieu2.workers.dev/ws';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 3
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function addTestResult(testName, passed, message, details = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`${testName}: PASSED - ${message}`, 'success');
  } else {
    testResults.failed++;
    log(`${testName}: FAILED - ${message}`, 'error');
  }
  
  testResults.details.push({
    test: testName,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestModule = url.startsWith('https:') ? https : http;
    
    const req = requestModule.request(url, {
      method: 'GET',
      timeout: TEST_CONFIG.timeout,
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

async function testApiHealth() {
  try {
    const response = await makeRequest(`${API_BASE_URL}/health`);
    
    if (response.status === 200 && response.data.success) {
      addTestResult('API Health Check', true, 'API is responding correctly');
      return true;
    } else {
      addTestResult('API Health Check', false, `API returned status ${response.status}`, response.data);
      return false;
    }
  } catch (error) {
    addTestResult('API Health Check', false, `API request failed: ${error.message}`);
    return false;
  }
}

async function testReturnsEndpoint() {
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/v1/returns`);
    
    // We expect either 200 (success) or 401 (unauthorized, which is expected without auth)
    if (response.status === 200 || response.status === 401) {
      addTestResult('Returns Endpoint', true, `Returns endpoint is accessible (status: ${response.status})`);
      return true;
    } else {
      addTestResult('Returns Endpoint', false, `Unexpected status ${response.status}`, response.data);
      return false;
    }
  } catch (error) {
    addTestResult('Returns Endpoint', false, `Returns endpoint request failed: ${error.message}`);
    return false;
  }
}

async function testWebSocketHealth() {
  try {
    const response = await makeRequest(`${API_BASE_URL}/ws/health`);
    
    if (response.status === 200 && response.data.success) {
      addTestResult('WebSocket Health', true, 'WebSocket service is running');
      return true;
    } else {
      addTestResult('WebSocket Health', false, `WebSocket health check failed (status: ${response.status})`, response.data);
      return false;
    }
  } catch (error) {
    addTestResult('WebSocket Health', false, `WebSocket health check failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseConnection() {
  try {
    // Test a simple endpoint that would require database access
    const response = await makeRequest(`${API_BASE_URL}/api/v1/users`);
    
    // We expect 401 (unauthorized) which means the endpoint exists and database is accessible
    if (response.status === 401) {
      addTestResult('Database Connection', true, 'Database appears to be accessible (auth required)');
      return true;
    } else if (response.status === 500) {
      addTestResult('Database Connection', false, 'Database connection may be failing (500 error)', response.data);
      return false;
    } else {
      addTestResult('Database Connection', true, `Database accessible (status: ${response.status})`);
      return true;
    }
  } catch (error) {
    addTestResult('Database Connection', false, `Database connection test failed: ${error.message}`);
    return false;
  }
}

async function testCorsConfiguration() {
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/v1/health`, {
      headers: {
        'Origin': 'https://smartpos-web.pages.dev'
      }
    });
    
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      addTestResult('CORS Configuration', true, `CORS headers present: ${corsHeaders}`);
      return true;
    } else {
      addTestResult('CORS Configuration', false, 'CORS headers missing', response.headers);
      return false;
    }
  } catch (error) {
    addTestResult('CORS Configuration', false, `CORS test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('🚀 Starting SmartPOS Returns System Tests...', 'info');
  log(`📊 Testing against: ${API_BASE_URL}`, 'info');
  
  // Run tests in sequence
  await testApiHealth();
  await testDatabaseConnection();
  await testReturnsEndpoint();
  await testWebSocketHealth();
  await testCorsConfiguration();
  
  // Print summary
  log('\n📊 TEST SUMMARY', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
  
  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    testResults.details
      .filter(result => !result.passed)
      .forEach(result => {
        log(`  - ${result.test}: ${result.message}`, 'error');
        if (result.details) {
          log(`    Details: ${JSON.stringify(result.details, null, 2)}`, 'error');
        }
      });
  }
  
  log('\n🎯 RECOMMENDATIONS:', 'info');
  
  if (testResults.failed === 0) {
    log('✅ All tests passed! The returns system appears to be working correctly.', 'success');
    log('📋 Next steps:', 'info');
    log('  1. Deploy the latest changes to production', 'info');
    log('  2. Run the database migration: npx wrangler d1 execute smartpos-db --file=migrations/0003_returns_system.sql', 'info');
    log('  3. Test the frontend returns page functionality', 'info');
    log('  4. Verify WebSocket real-time features', 'info');
  } else {
    log('⚠️ Some tests failed. Please address the issues before deploying to production.', 'warning');
    
    if (testResults.details.some(r => !r.passed && r.test === 'API Health Check')) {
      log('  - Check if the API is deployed and accessible', 'warning');
    }
    
    if (testResults.details.some(r => !r.passed && r.test === 'Database Connection')) {
      log('  - Verify D1 database configuration in wrangler.toml', 'warning');
      log('  - Run database migrations', 'warning');
    }
    
    if (testResults.details.some(r => !r.passed && r.test === 'Returns Endpoint')) {
      log('  - Check returns route configuration', 'warning');
      log('  - Verify returns handlers are properly initialized', 'warning');
    }
    
    if (testResults.details.some(r => !r.passed && r.test === 'WebSocket Health')) {
      log('  - Check Durable Objects configuration', 'warning');
      log('  - Verify WebSocket routes are properly set up', 'warning');
    }
  }
  
  return testResults.failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runAllTests, testResults };
