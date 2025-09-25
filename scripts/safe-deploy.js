#!/usr/bin/env node
/**
 * Safe Deploy Script - Deploy with schema validation and API smoke tests
 *
 * This script runs schema validation and API smoke tests before deploying
 * to ensure the system is in a consistent state.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { runSchemaGuard } = require('./schema-guard');

const execAsync = promisify(exec);

// Core API endpoints to test
const SMOKE_TESTS = [
  {
    endpoint: '/auth/status',
    method: 'GET',
    requiresAuth: false,
    description: 'Authentication system health'
  },
  {
    endpoint: '/products',
    method: 'GET',
    requiresAuth: true,
    description: 'Products API'
  },
  {
    endpoint: '/orders',
    method: 'GET',
    requiresAuth: true,
    description: 'Orders API'
  },
  {
    endpoint: '/customers',
    method: 'GET',
    requiresAuth: true,
    description: 'Customers API'
  }
];

/**
 * Run API smoke tests
 */
async function runSmokeTests() {
  const API_BASE = process.env.API_BASE || 'https://namhbcf-api.bangachieu2.workers.dev/api';
  const API_TOKEN = process.env.API_TOKEN || process.env.ADMIN_TOKEN;

  console.log('🧪 Running API smoke tests...\n');

  const results = [];

  for (const test of SMOKE_TESTS) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (test.requiresAuth && API_TOKEN) {
        headers['Authorization'] = `Bearer ${API_TOKEN}`;
      }

      console.log(`   Testing ${test.method} ${test.endpoint}...`);

      const response = await fetch(`${API_BASE}${test.endpoint}`, {
        method: test.method,
        headers
      });

      const result = {
        test: test.description,
        endpoint: test.endpoint,
        status: response.status,
        success: response.ok,
        error: null
      };

      if (!response.ok) {
        const errorText = await response.text();
        result.error = `HTTP ${response.status}: ${errorText}`;
      }

      results.push(result);

      if (result.success) {
        console.log(`     ✅ ${result.test} - OK`);
      } else {
        console.log(`     ❌ ${result.test} - ${result.error}`);
      }

    } catch (error) {
      console.log(`     💥 ${test.description} - ${error.message}`);
      results.push({
        test: test.description,
        endpoint: test.endpoint,
        status: 0,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  const required = [];
  const warnings = [];

  if (!process.env.API_BASE && !process.env.CLOUDFLARE_API_TOKEN) {
    warnings.push('API_BASE not set - using default production URL');
  }

  if (!process.env.API_TOKEN && !process.env.ADMIN_TOKEN) {
    warnings.push('API_TOKEN/ADMIN_TOKEN not set - some tests may fail');
  }

  return { required, warnings };
}

/**
 * Main deployment function
 */
async function safeDeploy() {
  console.log('🚀 Safe Deploy: Starting deployment with validation...\n');

  try {
    // Step 1: Environment check
    console.log('🔧 Checking environment...');
    const envCheck = checkEnvironment();

    if (envCheck.warnings.length > 0) {
      console.log('⚠️  Environment warnings:');
      envCheck.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    console.log('✅ Environment check completed\n');

    // Step 2: Schema validation
    console.log('🛡️  Step 1: Schema validation...');
    await runSchemaGuard();
    console.log('✅ Schema validation passed\n');

    // Step 3: API smoke tests
    console.log('🧪 Step 2: API smoke tests...');
    const smokeResults = await runSmokeTests();

    const failedTests = smokeResults.filter(result => !result.success);

    if (failedTests.length > 0) {
      console.log('\n❌ SMOKE TESTS FAILED:');
      failedTests.forEach(test => {
        console.log(`   - ${test.test}: ${test.error}`);
      });
      console.log('\n🚫 DEPLOYMENT BLOCKED - Fix API issues before deploying');
      process.exit(1);
    }

    console.log(`✅ All ${smokeResults.length} smoke tests passed\n`);

    // Step 4: Deploy
    console.log('🚀 Step 3: Deploying to production...');

    // Check if we should run actual deployment
    const shouldDeploy = process.argv.includes('--deploy');

    if (shouldDeploy) {
      console.log('   Running: npm run deploy...');
      const { stdout, stderr } = await execAsync('npm run deploy');

      if (stderr && !stderr.includes('warning')) {
        throw new Error(`Deployment failed: ${stderr}`);
      }

      console.log('✅ Deployment completed successfully');
      console.log('\n📋 Deployment Summary:');
      console.log(stdout);
    } else {
      console.log('✅ Validation completed - add --deploy flag to actually deploy');
    }

    // Step 5: Post-deployment verification
    if (shouldDeploy) {
      console.log('\n🔍 Step 4: Post-deployment verification...');

      // Wait a moment for deployment to propagate
      await new Promise(resolve => setTimeout(resolve, 5000));

      const postResults = await runSmokeTests();
      const postFailures = postResults.filter(result => !result.success);

      if (postFailures.length > 0) {
        console.log('\n⚠️  POST-DEPLOYMENT ISSUES DETECTED:');
        postFailures.forEach(test => {
          console.log(`   - ${test.test}: ${test.error}`);
        });
        console.log('\n🔄 Consider rollback if issues persist');
      } else {
        console.log('✅ Post-deployment verification passed');
      }
    }

    console.log('\n🎉 SAFE DEPLOY COMPLETED SUCCESSFULLY');

  } catch (error) {
    console.error('\n💥 Safe deploy failed:', error.message);
    console.log('\n🚫 DEPLOYMENT ABORTED');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  safeDeploy();
}

module.exports = { safeDeploy, runSmokeTests };