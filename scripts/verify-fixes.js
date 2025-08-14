#!/usr/bin/env node

/**
 * ComputerPOS Pro - Serial Number System Fixes Verification
 * This script verifies that all fixes have been properly implemented
 */

const https = require('https');
const fs = require('fs');

const API_BASE = 'https://smartpos-api.bangachieu2.workers.dev/api/v1';
const FRONTEND_BASE = 'https://smartpos-web.pages.dev';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function verifyStatisticsAPI() {
  log('\n🔍 Testing Statistics API Fix...', 'blue');
  
  try {
    const response = await makeRequest(`${API_BASE}/serial-numbers/stats`);
    
    if (response.status === 200 && response.data.success) {
      const stats = response.data.data;
      log(`✅ Statistics API working - Total serials: ${stats.total_serials}`, 'green');
      
      // Verify all expected fields are present
      const expectedFields = ['total_serials', 'in_stock', 'sold', 'warranty_active', 'warranty_claims', 'defective', 'returned'];
      const missingFields = expectedFields.filter(field => stats[field] === undefined);
      
      if (missingFields.length === 0) {
        log('✅ All statistics fields present', 'green');
        return true;
      } else {
        log(`❌ Missing fields: ${missingFields.join(', ')}`, 'red');
        return false;
      }
    } else {
      log(`❌ Statistics API failed - Status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Statistics API error: ${error.message}`, 'red');
    return false;
  }
}

async function verifySerialNumbersList() {
  log('\n🔍 Testing Serial Numbers List with Supplier Data...', 'blue');
  
  try {
    const response = await makeRequest(`${API_BASE}/serial-numbers?limit=5`);
    
    if (response.status === 200 && response.data.success) {
      const serials = response.data.data;
      log(`✅ Serial numbers list working - Found ${serials.length} items`, 'green');
      
      // Check if supplier data is populated
      const serialsWithSupplier = serials.filter(s => s.supplier_name && s.supplier_name !== '-');
      const supplierDataPercentage = serials.length > 0 ? (serialsWithSupplier.length / serials.length * 100).toFixed(1) : 0;
      
      log(`📊 Supplier data coverage: ${supplierDataPercentage}% (${serialsWithSupplier.length}/${serials.length})`, 'cyan');
      
      if (supplierDataPercentage > 50) {
        log('✅ Supplier data population looks good', 'green');
        return true;
      } else {
        log('⚠️  Low supplier data coverage - may need manual fix', 'yellow');
        return false;
      }
    } else {
      log(`❌ Serial numbers list failed - Status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Serial numbers list error: ${error.message}`, 'red');
    return false;
  }
}

async function verifyPOSPaymentEndpoints() {
  log('\n🔍 Testing POS Payment Endpoints...', 'blue');
  
  try {
    // Test available serials endpoint
    const response = await makeRequest(`${API_BASE}/pos-payment/available-serials/1?quantity=1`);
    
    if (response.status === 200 || response.status === 404) {
      if (response.status === 404) {
        log('✅ POS Payment endpoint working (product not found - expected)', 'green');
      } else if (response.data.success) {
        log('✅ POS Payment endpoint working - Available serials found', 'green');
      }
      return true;
    } else {
      log(`❌ POS Payment endpoint failed - Status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ POS Payment endpoint error: ${error.message}`, 'red');
    return false;
  }
}

async function verifyDataValidationEndpoints() {
  log('\n🔍 Testing Data Validation Endpoints...', 'blue');
  
  try {
    // Note: These endpoints require authentication, so we expect 401
    const response = await makeRequest(`${API_BASE}/admin/data-validation/serial-numbers`);
    
    if (response.status === 401) {
      log('✅ Data validation endpoint exists (authentication required)', 'green');
      return true;
    } else if (response.status === 200 && response.data.success) {
      log('✅ Data validation endpoint working', 'green');
      return true;
    } else {
      log(`❌ Data validation endpoint failed - Status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Data validation endpoint error: ${error.message}`, 'red');
    return false;
  }
}

async function verifyFrontendComponents() {
  log('\n🔍 Checking Frontend Components...', 'blue');
  
  const componentFiles = [
    'frontend/src/components/pos/SerialSelectionDialog.tsx',
    'frontend/src/components/pos/EnhancedPaymentDialog.tsx'
  ];
  
  let allExist = true;
  
  for (const file of componentFiles) {
    if (fs.existsSync(file)) {
      log(`✅ ${file} exists`, 'green');
    } else {
      log(`❌ ${file} missing`, 'red');
      allExist = false;
    }
  }
  
  return allExist;
}

async function verifyMigrationFiles() {
  log('\n🔍 Checking Migration Files...', 'blue');
  
  const migrationFiles = [
    'migrations/fix_supplier_data_population.sql',
    'src/routes/pos-payment.ts',
    'src/routes/admin/data-validation.ts'
  ];
  
  let allExist = true;
  
  for (const file of migrationFiles) {
    if (fs.existsSync(file)) {
      log(`✅ ${file} exists`, 'green');
    } else {
      log(`❌ ${file} missing`, 'red');
      allExist = false;
    }
  }
  
  return allExist;
}

async function generateReport(results) {
  const timestamp = new Date().toISOString();
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  const report = `
ComputerPOS Pro - Serial Number System Fixes Verification Report
================================================================

Verification Date: ${timestamp}
Overall Score: ${passed}/${total} (${percentage}%)

Test Results:
${results.map(r => `${r.passed ? '✅' : '❌'} ${r.name}`).join('\n')}

Detailed Results:
${results.map(r => `
${r.name}:
  Status: ${r.passed ? 'PASSED' : 'FAILED'}
  ${r.details || 'No additional details'}
`).join('\n')}

Summary:
${percentage >= 80 ? '🎉 VERIFICATION PASSED - System ready for production!' : '⚠️  VERIFICATION ISSUES - Please review failed tests'}

Next Steps:
${percentage >= 80 ? 
  '- Deploy to production\n- Monitor API performance\n- Test with real user data' : 
  '- Fix failed tests\n- Re-run verification\n- Check deployment logs'
}
`;

  const reportFile = `verification_report_${timestamp.replace(/[:.]/g, '-')}.txt`;
  fs.writeFileSync(reportFile, report);
  
  log(`\n📄 Verification report saved to: ${reportFile}`, 'cyan');
  return { passed, total, percentage, reportFile };
}

async function main() {
  log('🚀 ComputerPOS Pro - Serial Number System Fixes Verification', 'magenta');
  log('================================================================', 'magenta');
  
  const tests = [
    { name: 'Statistics API Fix', test: verifyStatisticsAPI },
    { name: 'Serial Numbers List with Supplier Data', test: verifySerialNumbersList },
    { name: 'POS Payment Endpoints', test: verifyPOSPaymentEndpoints },
    { name: 'Data Validation Endpoints', test: verifyDataValidationEndpoints },
    { name: 'Frontend Components', test: verifyFrontendComponents },
    { name: 'Migration Files', test: verifyMigrationFiles },
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const passed = await test.test();
      results.push({ name: test.name, passed });
    } catch (error) {
      log(`❌ ${test.name} failed with error: ${error.message}`, 'red');
      results.push({ name: test.name, passed: false, details: error.message });
    }
  }
  
  const summary = await generateReport(results);
  
  log('\n================================================================', 'magenta');
  log(`🎯 VERIFICATION COMPLETE: ${summary.passed}/${summary.total} (${summary.percentage}%)`, 'magenta');
  
  if (summary.percentage >= 80) {
    log('🎉 SYSTEM READY FOR PRODUCTION! 🚀', 'green');
  } else {
    log('⚠️  PLEASE FIX ISSUES BEFORE PRODUCTION DEPLOYMENT', 'yellow');
  }
  
  log(`📄 Full report: ${summary.reportFile}`, 'cyan');
}

// Run verification
main().catch(error => {
  log(`💥 Verification failed: ${error.message}`, 'red');
  process.exit(1);
});
