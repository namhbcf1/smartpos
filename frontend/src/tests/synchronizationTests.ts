/**
 * Comprehensive Synchronization Tests
 * Tests frontend-backend communication and data consistency
 * Rules.md compliant - tests real Cloudflare D1 data integration
 */

import { advancedInventoryApi } from '../services/advancedInventoryApi';
import { advancedAnalyticsApi } from '../services/advancedAnalyticsApi';
import { userManagementApi } from '../services/userManagementApi';
import { databaseOptimizationApi } from '../services/databaseOptimizationApi';
import { enhancedRealtimeService } from '../services/enhancedRealtimeService';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { errorHandlingService } from '../services/errorHandlingService';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: any;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

class SynchronizationTestRunner {
  private testResults: TestSuite[] = [];

  /**
   * Run all synchronization tests
   */
  async runAllTests(): Promise<TestSuite[]> {
    console.log('🧪 Starting comprehensive synchronization tests...');

    const testSuites = [
      { name: 'API Endpoints', tests: this.testApiEndpoints.bind(this) },
      { name: 'Authentication & Permissions', tests: this.testAuthentication.bind(this) },
      { name: 'Real-time Communication', tests: this.testRealtimeCommunication.bind(this) },
      { name: 'Error Handling', tests: this.testErrorHandling.bind(this) },
      { name: 'Data Consistency', tests: this.testDataConsistency.bind(this) }
    ];

    for (const suite of testSuites) {
      console.log(`\n📋 Running ${suite.name} tests...`);
      const results = await this.runTestSuite(suite.name, suite.tests);
      this.testResults.push(results);
    }

    this.printTestSummary();
    return this.testResults;
  }

  /**
   * Run a test suite
   */
  private async runTestSuite(suiteName: string, testFunction: () => Promise<TestResult[]>): Promise<TestSuite> {
    const startTime = Date.now();
    const results = await testFunction();
    const endTime = Date.now();

    const suite: TestSuite = {
      suiteName,
      results,
      totalTests: results.length,
      passedTests: results.filter(r => r.passed).length,
      failedTests: results.filter(r => !r.passed).length,
      totalDuration: endTime - startTime
    };

    console.log(`✅ ${suite.suiteName}: ${suite.passedTests}/${suite.totalTests} passed (${suite.totalDuration}ms)`);
    return suite;
  }

  /**
   * Run individual test
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const endTime = Date.now();
      
      return {
        testName,
        passed: true,
        duration: endTime - startTime,
        details: result
      };
    } catch (error: any) {
      const endTime = Date.now();
      
      return {
        testName,
        passed: false,
        error: error.message || 'Unknown error',
        duration: endTime - startTime
      };
    }
  }

  /**
   * Test API endpoints connectivity and response format
   */
  private async testApiEndpoints(): Promise<TestResult[]> {
    const tests = [
      {
        name: 'Advanced Inventory API - Overview',
        test: async () => {
          const overview = await advancedInventoryApi.getInventoryOverview();
          if (!overview.items || !overview.stats || !overview.alerts) {
            throw new Error('Invalid overview structure');
          }
          return overview;
        }
      },
      {
        name: 'Advanced Analytics API - Dashboard',
        test: async () => {
          const dashboard = await advancedAnalyticsApi.getDashboardAnalytics();
          if (!dashboard.overview || !dashboard.sales_analytics) {
            throw new Error('Invalid dashboard structure');
          }
          return dashboard;
        }
      },
      {
        name: 'User Management API - Users',
        test: async () => {
          const users = await userManagementApi.getUsers({ limit: 5 });
          if (!users.users || !Array.isArray(users.users)) {
            throw new Error('Invalid users structure');
          }
          return users;
        }
      },
      {
        name: 'Database Optimization API - Health',
        test: async () => {
          const health = await databaseOptimizationApi.getDatabaseHealth();
          if (!health.overall_score || !health.table_stats) {
            throw new Error('Invalid health structure');
          }
          return health;
        }
      }
    ];

    const results: TestResult[] = [];
    for (const test of tests) {
      const result = await this.runTest(test.name, test.test);
      results.push(result);
    }

    return results;
  }

  /**
   * Test authentication and permissions
   */
  private async testAuthentication(): Promise<TestResult[]> {
    const tests = [
      {
        name: 'Auth State Management',
        test: async () => {
          const authState = enhancedAuthService.getAuthState();
          return { isAuthenticated: authState.isAuthenticated };
        }
      },
      {
        name: 'Permission Checking',
        test: async () => {
          const hasPermission = enhancedAuthService.hasPermission('inventory', 'read');
          return { hasPermission };
        }
      },
      {
        name: 'Role Validation',
        test: async () => {
          const hasRole = enhancedAuthService.hasAnyRole(['admin', 'manager']);
          return { hasRole };
        }
      }
    ];

    const results: TestResult[] = [];
    for (const test of tests) {
      const result = await this.runTest(test.name, test.test);
      results.push(result);
    }

    return results;
  }

  /**
   * Test real-time communication
   */
  private async testRealtimeCommunication(): Promise<TestResult[]> {
    const tests = [
      {
        name: 'Real-time Service Connection',
        test: async () => {
          const status = enhancedRealtimeService.getConnectionStatus();
          return status;
        }
      },
      {
        name: 'Event Subscription',
        test: async () => {
          let eventReceived = false;
          const subscriptionId = enhancedRealtimeService.subscribe('test', () => {
            eventReceived = true;
          });
          
          // Simulate event
          enhancedRealtimeService.emit('test', { data: 'test' });
          
          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, 100));
          
          enhancedRealtimeService.unsubscribe(subscriptionId);
          
          if (!eventReceived) {
            throw new Error('Event not received');
          }
          
          return { eventReceived };
        }
      }
    ];

    const results: TestResult[] = [];
    for (const test of tests) {
      const result = await this.runTest(test.name, test.test);
      results.push(result);
    }

    return results;
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<TestResult[]> {
    const tests = [
      {
        name: 'Error Service Initialization',
        test: async () => {
          const history = errorHandlingService.getErrorHistory();
          return { historyLength: history.length };
        }
      },
      {
        name: 'API Error Handling',
        test: async () => {
          try {
            // Try to access a non-existent endpoint
            await advancedInventoryApi.getInventoryItems({ page: 999999 });
          } catch (error: any) {
            // This should trigger error handling
            if (error.isAxiosError) {
              return { errorHandled: true, status: error.response?.status };
            }
          }
          return { errorHandled: false };
        }
      }
    ];

    const results: TestResult[] = [];
    for (const test of tests) {
      const result = await this.runTest(test.name, test.test);
      results.push(result);
    }

    return results;
  }

  /**
   * Test data consistency between frontend and backend
   */
  private async testDataConsistency(): Promise<TestResult[]> {
    const tests = [
      {
        name: 'Inventory Data Structure Consistency',
        test: async () => {
          const overview = await advancedInventoryApi.getInventoryOverview();
          
          // Check required fields
          const requiredStatsFields = ['total_items', 'total_value', 'low_stock_items', 'out_of_stock_items'];
          const missingFields = requiredStatsFields.filter(field => !(field in overview.stats));
          
          if (missingFields.length > 0) {
            throw new Error(`Missing stats fields: ${missingFields.join(', ')}`);
          }
          
          return { statsFieldsValid: true };
        }
      },
      {
        name: 'Analytics Data Structure Consistency',
        test: async () => {
          const dashboard = await advancedAnalyticsApi.getDashboardAnalytics();
          
          // Check required fields
          const requiredOverviewFields = ['total_revenue', 'total_transactions', 'average_order_value'];
          const missingFields = requiredOverviewFields.filter(field => !(field in dashboard.overview));
          
          if (missingFields.length > 0) {
            throw new Error(`Missing overview fields: ${missingFields.join(', ')}`);
          }
          
          return { overviewFieldsValid: true };
        }
      },
      {
        name: 'User Data Structure Consistency',
        test: async () => {
          const users = await userManagementApi.getUsers({ limit: 1 });
          
          if (users.users.length > 0) {
            const user = users.users[0];
            const requiredUserFields = ['id', 'username', 'email', 'role_name', 'permissions'];
            const missingFields = requiredUserFields.filter(field => !(field in user));
            
            if (missingFields.length > 0) {
              throw new Error(`Missing user fields: ${missingFields.join(', ')}`);
            }
          }
          
          return { userFieldsValid: true };
        }
      }
    ];

    const results: TestResult[] = [];
    for (const test of tests) {
      const result = await this.runTest(test.name, test.test);
      results.push(result);
    }

    return results;
  }

  /**
   * Print test summary
   */
  private printTestSummary(): void {
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    this.testResults.forEach(suite => {
      totalTests += suite.totalTests;
      totalPassed += suite.passedTests;
      totalFailed += suite.failedTests;
      totalDuration += suite.totalDuration;

      console.log(`\n${suite.suiteName}:`);
      console.log(`  ✅ Passed: ${suite.passedTests}`);
      console.log(`  ❌ Failed: ${suite.failedTests}`);
      console.log(`  ⏱️  Duration: ${suite.totalDuration}ms`);

      // Show failed tests
      const failedTests = suite.results.filter(r => !r.passed);
      if (failedTests.length > 0) {
        console.log('  Failed tests:');
        failedTests.forEach(test => {
          console.log(`    - ${test.testName}: ${test.error}`);
        });
      }
    });

    console.log('\n📈 Overall Results:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);
    console.log(`Total Duration: ${totalDuration}ms`);

    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! Frontend-backend synchronization is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
  }

  /**
   * Get test results
   */
  getTestResults(): TestSuite[] {
    return this.testResults;
  }
}

// Export test runner instance
export const synchronizationTestRunner = new SynchronizationTestRunner();

// Export function to run tests
export const runSynchronizationTests = () => {
  return synchronizationTestRunner.runAllTests();
};
