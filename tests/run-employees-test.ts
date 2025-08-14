#!/usr/bin/env ts-node

/**
 * Employee Management Test Runner
 * Tests the /employees page with real users and authentication
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

const PRODUCTION_URL = 'https://smartpos-web.pages.dev';
const API_URL = 'https://2550bee2.smartpos-web.pages.dev';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

class EmployeeTestRunner {
  private results: TestResult[] = [];

  async run() {
    console.log('🚀 Starting Employee Management Tests');
    console.log(`📍 Testing against: ${PRODUCTION_URL}`);
    console.log(`🔗 API URL: ${API_URL}`);
    console.log('=' .repeat(60));

    try {
      // Step 1: Seed users
      await this.seedUsers();
      
      // Step 2: Run Playwright tests
      await this.runPlaywrightTests();
      
      // Step 3: Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    }
  }

  private async seedUsers(): Promise<void> {
    console.log('\n📝 Step 1: Seeding test users...');
    
    try {
      // Use curl to seed users via API
      const curlCommand = `curl -X POST "${API_URL}/api/auth/seed-users" -H "Content-Type: application/json" -s`;
      
      console.log('Executing:', curlCommand);
      const response = execSync(curlCommand, { encoding: 'utf8' });
      
      const result = JSON.parse(response);
      
      if (result.success) {
        console.log('✅ Users seeded successfully');
        console.log('👥 Available test accounts:');
        
        result.data.login_info.forEach((user: any) => {
          console.log(`   - ${user.username}/${user.password} (${user.role})`);
        });
        
        this.results.push({
          success: true,
          message: 'Users seeded successfully',
          details: result.data
        });
      } else {
        throw new Error(`Seed failed: ${result.message}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to seed users:', error);
      this.results.push({
        success: false,
        message: 'Failed to seed users',
        details: error.message
      });
      throw error;
    }
  }

  private async runPlaywrightTests(): Promise<void> {
    console.log('\n🎭 Step 2: Running Playwright tests...');
    
    try {
      // Update Playwright config to use correct URL
      this.updatePlaywrightConfig();
      
      // Run the employee management tests
      const testCommand = 'npx playwright test tests/e2e/specs/10-employees-management.spec.ts --reporter=html';
      
      console.log('Executing:', testCommand);
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        stdio: 'inherit'
      });
      
      console.log('✅ Playwright tests completed');
      
      this.results.push({
        success: true,
        message: 'Playwright tests completed successfully'
      });
      
    } catch (error) {
      console.error('❌ Playwright tests failed:', error);
      this.results.push({
        success: false,
        message: 'Playwright tests failed',
        details: error.message
      });
      
      // Don't throw here, we want to see the report
    }
  }

  private updatePlaywrightConfig(): void {
    console.log('📝 Updating Playwright config...');
    
    const configPath = 'playwright.config.ts';
    let config = readFileSync(configPath, 'utf8');
    
    // Update baseURL to production
    config = config.replace(
      /baseURL:\s*['"][^'"]*['"]/,
      `baseURL: '${PRODUCTION_URL}'`
    );
    
    writeFileSync(configPath, config);
    console.log('✅ Playwright config updated');
  }

  private generateReport(): void {
    console.log('\n📊 Step 3: Generating test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      production_url: PRODUCTION_URL,
      api_url: API_URL,
      total_tests: this.results.length,
      passed: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length,
      results: this.results
    };
    
    // Save report
    const reportPath = 'test-results/employee-test-report.json';
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('=' .repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${report.passed}`);
    console.log(`❌ Failed: ${report.failed}`);
    console.log(`📊 Total: ${report.total_tests}`);
    console.log(`📄 Report saved: ${reportPath}`);
    
    if (report.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.message}`);
        if (result.details) {
          console.log(`     Details: ${result.details}`);
        }
      });
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Check Playwright HTML report: npx playwright show-report');
    console.log('2. Test manual login at: ' + PRODUCTION_URL + '/login');
    console.log('3. Test employees page at: ' + PRODUCTION_URL + '/employees');
    console.log('\n👥 Test Accounts:');
    console.log('   - admin/admin123 (admin)');
    console.log('   - manager/manager123 (manager)');
    console.log('   - cashier/cashier123 (cashier)');
    console.log('   - inventory/inventory123 (inventory)');
  }
}

// Run the tests
if (require.main === module) {
  const runner = new EmployeeTestRunner();
  runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default EmployeeTestRunner;
