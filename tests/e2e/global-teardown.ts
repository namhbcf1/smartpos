import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for SmartPOS E2E tests
 * Cleanup and generate final reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting SmartPOS E2E Test Suite Global Teardown...');
  
  try {
    // Clean up authentication state file
    const authStatePath = 'tests/e2e/auth-state.json';
    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath);
      console.log('✅ Cleaned up authentication state file');
    }
    
    // Generate test summary
    const resultsPath = 'test-results/results.json';
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      console.log('\n📊 SmartPOS E2E Test Results Summary:');
      console.log('=====================================');
      console.log(`Total Tests: ${results.stats?.total || 0}`);
      console.log(`Passed: ${results.stats?.passed || 0}`);
      console.log(`Failed: ${results.stats?.failed || 0}`);
      console.log(`Skipped: ${results.stats?.skipped || 0}`);
      console.log(`Duration: ${Math.round((results.stats?.duration || 0) / 1000)}s`);
      
      if (results.stats?.failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.suites?.forEach((suite: any) => {
          suite.specs?.forEach((spec: any) => {
            spec.tests?.forEach((test: any) => {
              if (test.results?.[0]?.status === 'failed') {
                console.log(`  - ${suite.title}: ${test.title}`);
              }
            });
          });
        });
      }
      
      console.log('\n📁 Test artifacts saved to: test-results/');
      console.log('📊 HTML Report: test-results/html-report/index.html');
    }
    
  } catch (error) {
    console.error('❌ Global teardown error:', error);
  }
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;
