#!/usr/bin/env node

/**
 * SmartPOS Comprehensive Test Runner
 * 
 * This script runs all Playwright tests for the SmartPOS system
 * against the production environment as specified:
 * - Web App: https://smartpos-web.pages.dev
 * - API: https://smartpos-api.workers.dev
 * 
 * Test Coverage:
 * 1. Authentication System
 * 2. Dashboard Functionality
 * 3. Products Management
 * 4. POS/Sales System
 * 5. API Integration
 * 6. Mobile Responsiveness
 * 7. Performance & Security
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  PRODUCTION_WEB_URL: 'https://smartpos-web.pages.dev',
  PRODUCTION_API_URL: 'https://smartpos-api.workers.dev',
  TEST_RESULTS_DIR: 'test-results',
  SCREENSHOTS_DIR: 'test-results/screenshots',
  REPORTS_DIR: 'playwright-report'
};

// Test suites in execution order
const TEST_SUITES = [
  {
    name: 'Authentication Tests',
    file: 'tests/e2e/01-authentication.spec.ts',
    description: 'Login, logout, session management, security'
  },
  {
    name: 'Dashboard Tests',
    file: 'tests/e2e/02-dashboard.spec.ts',
    description: 'Dashboard layout, navigation, real-time updates'
  },
  {
    name: 'Products Management Tests',
    file: 'tests/e2e/03-products.spec.ts',
    description: 'CRUD operations, validation, bulk actions'
  },
  {
    name: 'POS/Sales Tests',
    file: 'tests/e2e/04-pos-sales.spec.ts',
    description: 'Point of sale, cart management, payments'
  },
  {
    name: 'API Integration Tests',
    file: 'tests/e2e/05-api-integration.spec.ts',
    description: 'API endpoints, CORS, validation, security'
  },
  {
    name: 'Mobile Responsiveness Tests',
    file: 'tests/e2e/06-mobile-responsiveness.spec.ts',
    description: 'Mobile layouts, touch interactions, PWA'
  },
  {
    name: 'Performance & Security Tests',
    file: 'tests/e2e/07-performance-security.spec.ts',
    description: 'Core Web Vitals, security headers, XSS protection'
  }
];

// Browser configurations
const BROWSERS = [
  'Desktop Chrome',
  'Desktop Firefox', 
  'Desktop Safari',
  'Mobile Chrome',
  'Mobile Safari',
  'Tablet'
];

class TestRunner {
  private startTime: number = 0;
  private results: any[] = [];

  constructor() {
    this.setupDirectories();
  }

  private setupDirectories() {
    // Create necessary directories
    [CONFIG.TEST_RESULTS_DIR, CONFIG.SCREENSHOTS_DIR].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  private async checkEnvironment() {
    this.log('🔍 Checking environment and connectivity...', 'info');

    try {
      // Check if URLs are accessible
      const webCheck = await fetch(CONFIG.PRODUCTION_WEB_URL);
      const apiCheck = await fetch(`${CONFIG.PRODUCTION_API_URL}/api/health`);

      if (!webCheck.ok) {
        throw new Error(`Web app not accessible: ${webCheck.status}`);
      }

      if (!apiCheck.ok) {
        throw new Error(`API not accessible: ${apiCheck.status}`);
      }

      this.log('✅ Environment check passed', 'success');
      this.log(`📱 Web App: ${CONFIG.PRODUCTION_WEB_URL}`, 'info');
      this.log(`🔌 API: ${CONFIG.PRODUCTION_API_URL}`, 'info');

    } catch (error) {
      this.log(`❌ Environment check failed: ${error}`, 'error');
      throw error;
    }
  }

  private async runTestSuite(suite: typeof TEST_SUITES[0], browser?: string) {
    const suiteStart = Date.now();
    const browserFlag = browser ? `--project="${browser}"` : '';
    
    this.log(`🧪 Running ${suite.name}${browser ? ` on ${browser}` : ''}...`, 'info');
    this.log(`📝 ${suite.description}`, 'info');

    try {
      const command = `npx playwright test ${suite.file} ${browserFlag} --reporter=json`;
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const result = JSON.parse(output);
      const duration = Date.now() - suiteStart;

      this.results.push({
        suite: suite.name,
        browser: browser || 'All',
        duration,
        passed: result.stats?.passed || 0,
        failed: result.stats?.failed || 0,
        skipped: result.stats?.skipped || 0,
        status: result.stats?.failed === 0 ? 'PASSED' : 'FAILED'
      });

      this.log(`✅ ${suite.name} completed in ${duration}ms`, 'success');

    } catch (error: any) {
      const duration = Date.now() - suiteStart;
      
      this.results.push({
        suite: suite.name,
        browser: browser || 'All',
        duration,
        passed: 0,
        failed: 1,
        skipped: 0,
        status: 'FAILED',
        error: error.message
      });

      this.log(`❌ ${suite.name} failed: ${error.message}`, 'error');
    }
  }

  private async runAllTests() {
    this.log('🚀 Starting comprehensive SmartPOS test suite...', 'info');
    this.startTime = Date.now();

    // Run tests for each browser
    for (const browser of BROWSERS) {
      this.log(`\n🌐 Testing on ${browser}`, 'info');
      
      for (const suite of TEST_SUITES) {
        await this.runTestSuite(suite, browser);
      }
    }
  }

  private async runCriticalPathTests() {
    this.log('🎯 Running critical path tests only...', 'warning');
    
    const criticalSuites = [
      TEST_SUITES[0], // Authentication
      TEST_SUITES[3], // POS/Sales
      TEST_SUITES[4]  // API Integration
    ];

    for (const suite of criticalSuites) {
      await this.runTestSuite(suite, 'Desktop Chrome');
    }
  }

  private generateReport() {
    this.log('\n📊 Generating test report...', 'info');

    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);

    console.log('\n' + '='.repeat(80));
    console.log('📋 SMARTPOS TEST EXECUTION SUMMARY');
    console.log('='.repeat(80));
    console.log(`⏱️  Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`🧪 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⏭️  Skipped: ${totalSkipped}`);
    console.log(`📈 Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);
    console.log('='.repeat(80));

    // Detailed results by suite
    console.log('\n📝 DETAILED RESULTS BY TEST SUITE:');
    console.log('-'.repeat(80));
    
    TEST_SUITES.forEach(suite => {
      const suiteResults = this.results.filter(r => r.suite === suite.name);
      const suitePassed = suiteResults.filter(r => r.status === 'PASSED').length;
      const suiteFailed = suiteResults.filter(r => r.status === 'FAILED').length;
      
      const status = suiteFailed === 0 ? '✅' : '❌';
      console.log(`${status} ${suite.name}: ${suitePassed}/${suiteResults.length} browsers passed`);
    });

    // Browser compatibility
    console.log('\n🌐 BROWSER COMPATIBILITY:');
    console.log('-'.repeat(80));
    
    BROWSERS.forEach(browser => {
      const browserResults = this.results.filter(r => r.browser === browser);
      const browserPassed = browserResults.filter(r => r.status === 'PASSED').length;
      const browserFailed = browserResults.filter(r => r.status === 'FAILED').length;
      
      const status = browserFailed === 0 ? '✅' : '❌';
      console.log(`${status} ${browser}: ${browserPassed}/${browserResults.length} test suites passed`);
    });

    // Failed tests details
    const failedTests = this.results.filter(r => r.status === 'FAILED');
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      console.log('-'.repeat(80));
      failedTests.forEach(test => {
        console.log(`• ${test.suite} on ${test.browser}`);
        if (test.error) {
          console.log(`  Error: ${test.error}`);
        }
      });
    }

    console.log('\n📁 Test artifacts saved to:');
    console.log(`• Screenshots: ${CONFIG.SCREENSHOTS_DIR}`);
    console.log(`• HTML Report: ${CONFIG.REPORTS_DIR}/index.html`);
    console.log(`• JSON Results: ${CONFIG.TEST_RESULTS_DIR}/results.json`);

    return totalFailed === 0;
  }

  async run(mode: 'full' | 'critical' = 'full') {
    try {
      await this.checkEnvironment();

      if (mode === 'critical') {
        await this.runCriticalPathTests();
      } else {
        await this.runAllTests();
      }

      const success = this.generateReport();

      if (success) {
        this.log('\n🎉 All tests passed! SmartPOS is ready for production.', 'success');
        process.exit(0);
      } else {
        this.log('\n⚠️  Some tests failed. Please review the results above.', 'warning');
        process.exit(1);
      }

    } catch (error) {
      this.log(`💥 Test execution failed: ${error}`, 'error');
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const mode = process.argv.includes('--critical') ? 'critical' : 'full';
  const runner = new TestRunner();
  runner.run(mode);
}

export default TestRunner;
