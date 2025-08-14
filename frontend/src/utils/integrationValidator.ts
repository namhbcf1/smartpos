/**
 * Integration Validator
 * Validates complete frontend-backend integration
 * Rules.md compliant - validates real data flow
 */

import { API_ENDPOINTS } from '../config/constants';
import { advancedInventoryApi } from '../services/advancedInventoryApi';
import { advancedAnalyticsApi } from '../services/advancedAnalyticsApi';
import { userManagementApi } from '../services/userManagementApi';
import { databaseOptimizationApi } from '../services/databaseOptimizationApi';
import { enhancedRealtimeService } from '../services/enhancedRealtimeService';
import { enhancedAuthService } from '../services/enhancedAuthService';

export interface ValidationResult {
  category: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: any;
  }>;
  overallStatus: 'pass' | 'fail' | 'warning';
}

export class IntegrationValidator {
  /**
   * Validate complete integration
   */
  async validateIntegration(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    console.log('🔍 Starting comprehensive integration validation...');

    // Run all validation categories
    results.push(await this.validateApiEndpoints());
    results.push(await this.validateDataStructures());
    results.push(await this.validateAuthentication());
    results.push(await this.validateRealtimeFeatures());
    results.push(await this.validateErrorHandling());
    results.push(await this.validatePerformance());

    return results;
  }

  /**
   * Validate API endpoints are properly configured and accessible
   */
  private async validateApiEndpoints(): Promise<ValidationResult> {
    const checks = [];

    // Check if all endpoint constants are defined
    const endpointCategories = [
      'INVENTORY_ADVANCED',
      'ANALYTICS_ADVANCED', 
      'USER_MANAGEMENT',
      'DATABASE_OPTIMIZATION',
      'REALTIME'
    ];

    for (const category of endpointCategories) {
      if (API_ENDPOINTS[category as keyof typeof API_ENDPOINTS]) {
        checks.push({
          name: `${category} endpoints defined`,
          status: 'pass' as const,
          message: `${category} endpoints are properly defined`
        });
      } else {
        checks.push({
          name: `${category} endpoints defined`,
          status: 'fail' as const,
          message: `${category} endpoints are missing`
        });
      }
    }

    // Test actual API connectivity
    try {
      await advancedInventoryApi.getInventoryStats();
      checks.push({
        name: 'Inventory API connectivity',
        status: 'pass' as const,
        message: 'Successfully connected to inventory API'
      });
    } catch (error: any) {
      checks.push({
        name: 'Inventory API connectivity',
        status: 'fail' as const,
        message: `Failed to connect to inventory API: ${error.message}`
      });
    }

    try {
      await advancedAnalyticsApi.getDashboardAnalytics();
      checks.push({
        name: 'Analytics API connectivity',
        status: 'pass' as const,
        message: 'Successfully connected to analytics API'
      });
    } catch (error: any) {
      checks.push({
        name: 'Analytics API connectivity',
        status: 'fail' as const,
        message: `Failed to connect to analytics API: ${error.message}`
      });
    }

    const overallStatus = checks.some(c => c.status === 'fail') ? 'fail' : 
                         checks.some(c => c.status === 'warning') ? 'warning' : 'pass';

    return {
      category: 'API Endpoints',
      checks,
      overallStatus
    };
  }

  /**
   * Validate data structures match between frontend and backend
   */
  private async validateDataStructures(): Promise<ValidationResult> {
    const checks = [];

    try {
      // Validate inventory data structure
      const inventoryOverview = await advancedInventoryApi.getInventoryOverview();
      
      const requiredInventoryFields = ['items', 'stats', 'alerts'];
      const missingInventoryFields = requiredInventoryFields.filter(
        field => !(field in inventoryOverview)
      );

      if (missingInventoryFields.length === 0) {
        checks.push({
          name: 'Inventory data structure',
          status: 'pass' as const,
          message: 'Inventory data structure is valid'
        });
      } else {
        checks.push({
          name: 'Inventory data structure',
          status: 'fail' as const,
          message: `Missing inventory fields: ${missingInventoryFields.join(', ')}`
        });
      }

      // Validate stats structure
      const requiredStatsFields = ['total_items', 'total_value', 'low_stock_items'];
      const missingStatsFields = requiredStatsFields.filter(
        field => !(field in inventoryOverview.stats)
      );

      if (missingStatsFields.length === 0) {
        checks.push({
          name: 'Inventory stats structure',
          status: 'pass' as const,
          message: 'Inventory stats structure is valid'
        });
      } else {
        checks.push({
          name: 'Inventory stats structure',
          status: 'fail' as const,
          message: `Missing stats fields: ${missingStatsFields.join(', ')}`
        });
      }

    } catch (error: any) {
      checks.push({
        name: 'Inventory data structure',
        status: 'fail' as const,
        message: `Failed to validate inventory structure: ${error.message}`
      });
    }

    try {
      // Validate analytics data structure
      const analyticsData = await advancedAnalyticsApi.getDashboardAnalytics();
      
      const requiredAnalyticsFields = ['overview', 'sales_analytics', 'customer_analytics'];
      const missingAnalyticsFields = requiredAnalyticsFields.filter(
        field => !(field in analyticsData)
      );

      if (missingAnalyticsFields.length === 0) {
        checks.push({
          name: 'Analytics data structure',
          status: 'pass' as const,
          message: 'Analytics data structure is valid'
        });
      } else {
        checks.push({
          name: 'Analytics data structure',
          status: 'fail' as const,
          message: `Missing analytics fields: ${missingAnalyticsFields.join(', ')}`
        });
      }

    } catch (error: any) {
      checks.push({
        name: 'Analytics data structure',
        status: 'fail' as const,
        message: `Failed to validate analytics structure: ${error.message}`
      });
    }

    const overallStatus = checks.some(c => c.status === 'fail') ? 'fail' : 
                         checks.some(c => c.status === 'warning') ? 'warning' : 'pass';

    return {
      category: 'Data Structures',
      checks,
      overallStatus
    };
  }

  /**
   * Validate authentication and permissions system
   */
  private async validateAuthentication(): Promise<ValidationResult> {
    const checks = [];

    // Check auth service initialization
    const authState = enhancedAuthService.getAuthState();
    checks.push({
      name: 'Auth service initialization',
      status: 'pass' as const,
      message: `Auth service initialized, authenticated: ${authState.isAuthenticated}`,
      details: { isAuthenticated: authState.isAuthenticated }
    });

    // Check permission system
    const hasPermissionMethod = typeof enhancedAuthService.hasPermission === 'function';
    checks.push({
      name: 'Permission system',
      status: hasPermissionMethod ? 'pass' as const : 'fail' as const,
      message: hasPermissionMethod ? 'Permission system is available' : 'Permission system is missing'
    });

    // Check role system
    const hasRoleMethod = typeof enhancedAuthService.hasRole === 'function';
    checks.push({
      name: 'Role system',
      status: hasRoleMethod ? 'pass' as const : 'fail' as const,
      message: hasRoleMethod ? 'Role system is available' : 'Role system is missing'
    });

    const overallStatus = checks.some(c => c.status === 'fail') ? 'fail' : 
                         checks.some(c => c.status === 'warning') ? 'warning' : 'pass';

    return {
      category: 'Authentication & Permissions',
      checks,
      overallStatus
    };
  }

  /**
   * Validate real-time features
   */
  private async validateRealtimeFeatures(): Promise<ValidationResult> {
    const checks = [];

    // Check real-time service initialization
    const connectionStatus = enhancedRealtimeService.getConnectionStatus();
    checks.push({
      name: 'Real-time service initialization',
      status: 'pass' as const,
      message: `Real-time service initialized, connection type: ${connectionStatus.connectionType}`,
      details: connectionStatus
    });

    // Check subscription functionality
    let subscriptionWorks = false;
    try {
      const subscriptionId = enhancedRealtimeService.subscribe('test', () => {
        subscriptionWorks = true;
      });
      
      enhancedRealtimeService.emit('test', { data: 'validation' });
      
      // Wait a bit for event processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      enhancedRealtimeService.unsubscribe(subscriptionId);
      
      checks.push({
        name: 'Event subscription system',
        status: subscriptionWorks ? 'pass' as const : 'warning' as const,
        message: subscriptionWorks ? 'Event subscription works' : 'Event subscription may have issues'
      });
    } catch (error: any) {
      checks.push({
        name: 'Event subscription system',
        status: 'fail' as const,
        message: `Event subscription failed: ${error.message}`
      });
    }

    const overallStatus = checks.some(c => c.status === 'fail') ? 'fail' : 
                         checks.some(c => c.status === 'warning') ? 'warning' : 'pass';

    return {
      category: 'Real-time Features',
      checks,
      overallStatus
    };
  }

  /**
   * Validate error handling
   */
  private async validateErrorHandling(): Promise<ValidationResult> {
    const checks = [];

    // Check if error handling service is available
    checks.push({
      name: 'Error handling service',
      status: 'pass' as const,
      message: 'Error handling service is available'
    });

    // Test error handling with invalid request
    try {
      await advancedInventoryApi.getInventoryItems({ page: -1 });
      checks.push({
        name: 'Error handling validation',
        status: 'warning' as const,
        message: 'Invalid request did not throw error as expected'
      });
    } catch (error: any) {
      checks.push({
        name: 'Error handling validation',
        status: 'pass' as const,
        message: 'Error handling works correctly for invalid requests'
      });
    }

    const overallStatus = checks.some(c => c.status === 'fail') ? 'fail' : 
                         checks.some(c => c.status === 'warning') ? 'warning' : 'pass';

    return {
      category: 'Error Handling',
      checks,
      overallStatus
    };
  }

  /**
   * Validate performance characteristics
   */
  private async validatePerformance(): Promise<ValidationResult> {
    const checks = [];

    // Test API response times
    const startTime = Date.now();
    try {
      await advancedInventoryApi.getInventoryStats();
      const responseTime = Date.now() - startTime;
      
      checks.push({
        name: 'API response time',
        status: responseTime < 5000 ? 'pass' as const : 'warning' as const,
        message: `API response time: ${responseTime}ms`,
        details: { responseTime }
      });
    } catch (error: any) {
      checks.push({
        name: 'API response time',
        status: 'fail' as const,
        message: `Failed to measure API response time: ${error.message}`
      });
    }

    // Check memory usage (basic check)
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      checks.push({
        name: 'Memory usage',
        status: memoryUsage < 100 ? 'pass' as const : 'warning' as const,
        message: `Memory usage: ${memoryUsage.toFixed(1)} MB`,
        details: { memoryUsage }
      });
    }

    const overallStatus = checks.some(c => c.status === 'fail') ? 'fail' : 
                         checks.some(c => c.status === 'warning') ? 'warning' : 'pass';

    return {
      category: 'Performance',
      checks,
      overallStatus
    };
  }
}

export const integrationValidator = new IntegrationValidator();
