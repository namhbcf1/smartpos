/**
 * MONITORING & ALERTING SERVICE
 * 
 * Comprehensive system monitoring with metrics collection,
 * performance tracking, health checks, and alerting.
 */

import { Env } from '../types';
import { log } from '../utils/logger';

// Metric Types
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer'
}

// Alert Severity Levels
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Metric Data
interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  unit?: string;
}

// Alert Configuration
interface AlertRule {
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: AlertSeverity;
  duration: number; // seconds
  cooldown: number; // seconds
  enabled: boolean;
}

// Health Check
interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: number;
  details?: any;
  error?: string;
}

// Performance Baseline
interface PerformanceBaseline {
  metric: string;
  baseline: number;
  tolerance: number; // percentage
  lastUpdated: number;
}

// System Metrics
interface SystemMetrics {
  api: {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  database: {
    queryCount: number;
    slowQueryCount: number;
    averageQueryTime: number;
    connectionCount: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    memoryUsage: number;
  };
  business: {
    salesCount: number;
    revenue: number;
    activeUsers: number;
    inventoryValue: number;
  };
}

export class MonitoringService {
  private metrics: Map<string, Metric[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alertStates: Map<string, { triggered: boolean; lastAlert: number }> = new Map();
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();

  constructor(private env: Env) {
    this.initializeDefaultAlerts();
    this.startMetricsCollection();
  }

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    type: MetricType,
    value: number,
    tags?: Record<string, string>,
    unit?: string
  ): void {
    const metric: Metric = {
      name,
      type,
      value,
      timestamp: Date.now(),
      tags,
      unit
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only last 1000 metrics per name
    if (metricHistory.length > 1000) {
      metricHistory.shift();
    }

    // Check alert rules
    this.checkAlertRules(name, value);
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric(name, MetricType.COUNTER, value, tags);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, tags?: Record<string, string>, unit?: string): void {
    this.recordMetric(name, MetricType.GAUGE, value, tags, unit);
  }

  /**
   * Record a timer metric
   */
  recordTimer(name: string, duration: number, tags?: Record<string, string>): void {
    this.recordMetric(name, MetricType.TIMER, duration, tags, 'ms');
  }

  /**
   * Time an operation
   */
  async timeOperation<T>(name: string, operation: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      this.recordTimer(name, duration, tags);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordTimer(name, duration, { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.name, rule);
    this.alertStates.set(rule.name, { triggered: false, lastAlert: 0 });
    log.info(`Alert rule added: ${rule.name}`);
  }

  /**
   * Check alert rules for a metric
   */
  private checkAlertRules(metricName: string, value: number): void {
    for (const [ruleName, rule] of this.alertRules.entries()) {
      if (rule.metric !== metricName || !rule.enabled) {
        continue;
      }

      const alertState = this.alertStates.get(ruleName)!;
      const shouldTrigger = this.evaluateCondition(rule.condition, value, rule.threshold);

      if (shouldTrigger && !alertState.triggered) {
        // Check cooldown
        if (Date.now() - alertState.lastAlert > rule.cooldown * 1000) {
          this.triggerAlert(rule, value);
          alertState.triggered = true;
          alertState.lastAlert = Date.now();
        }
      } else if (!shouldTrigger && alertState.triggered) {
        // Reset alert state
        alertState.triggered = false;
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(condition: string, value: number, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, value: number): Promise<void> {
    const alert = {
      rule: rule.name,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      severity: rule.severity,
      timestamp: new Date().toISOString(),
      message: `Alert: ${rule.name} - ${rule.metric} is ${value} (threshold: ${rule.threshold})`
    };

    log.warn(`ALERT TRIGGERED: ${rule.name}`, alert);

    // In production, send to alerting system (email, Slack, PagerDuty, etc.)
    await this.sendAlert(alert);
  }

  /**
   * Send alert to external systems
   */
  private async sendAlert(alert: any): Promise<void> {
    try {
      // Example: Send to webhook
      if (this.env.ALERT_WEBHOOK_URL) {
        await fetch(this.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      }

      // Store alert in database for history
      await this.storeAlert(alert);
    } catch (error) {
      log.error('Failed to send alert', { 
        alert,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: any): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT INTO system_alerts (rule_name, metric_name, value, threshold, severity, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        alert.rule,
        alert.metric,
        alert.value,
        alert.threshold,
        alert.severity,
        alert.message
      ).run();
    } catch (error) {
      log.error('Failed to store alert', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck(name: string, checker: () => Promise<any>): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const result = await checker();
      const responseTime = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        name,
        status: 'healthy',
        responseTime,
        timestamp: Date.now(),
        details: result
      };

      this.healthChecks.set(name, healthCheck);
      this.recordTimer(`health_check.${name}`, responseTime);
      
      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        name,
        status: 'unhealthy',
        responseTime,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.healthChecks.set(name, healthCheck);
      this.recordTimer(`health_check.${name}`, responseTime, { error: 'true' });
      
      return healthCheck;
    }
  }

  /**
   * Get all health checks
   */
  getAllHealthChecks(): Record<string, HealthCheck> {
    const checks: Record<string, HealthCheck> = {};
    this.healthChecks.forEach((check, name) => {
      checks[name] = check;
    });
    return checks;
  }

  /**
   * Set performance baseline
   */
  setBaseline(metric: string, baseline: number, tolerance: number = 20): void {
    this.baselines.set(metric, {
      metric,
      baseline,
      tolerance,
      lastUpdated: Date.now()
    });
  }

  /**
   * Check performance regression
   */
  checkPerformanceRegression(metric: string, currentValue: number): boolean {
    const baseline = this.baselines.get(metric);
    if (!baseline) {
      return false;
    }

    const deviation = Math.abs(currentValue - baseline.baseline) / baseline.baseline * 100;
    return deviation > baseline.tolerance;
  }

  /**
   * Get system metrics summary
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // API metrics
      const apiMetrics = this.getMetricSummary('api');
      
      // Database metrics
      const dbMetrics = await this.getDatabaseMetrics();
      
      // Cache metrics
      const cacheMetrics = this.getCacheMetrics();
      
      // Business metrics
      const businessMetrics = await this.getBusinessMetrics();

      return {
        api: {
          requestCount: apiMetrics.requestCount || 0,
          errorCount: apiMetrics.errorCount || 0,
          averageResponseTime: apiMetrics.averageResponseTime || 0,
          p95ResponseTime: apiMetrics.p95ResponseTime || 0,
          p99ResponseTime: apiMetrics.p99ResponseTime || 0
        },
        database: {
          queryCount: dbMetrics.queryCount || 0,
          slowQueryCount: dbMetrics.slowQueryCount || 0,
          averageQueryTime: dbMetrics.averageQueryTime || 0,
          connectionCount: dbMetrics.connectionCount || 0
        },
        cache: {
          hitRate: cacheMetrics.hitRate || 0,
          missRate: cacheMetrics.missRate || 0,
          evictionRate: cacheMetrics.evictionRate || 0,
          memoryUsage: cacheMetrics.memoryUsage || 0
        },
        business: {
          salesCount: businessMetrics.salesCount || 0,
          revenue: businessMetrics.revenue || 0,
          activeUsers: businessMetrics.activeUsers || 0,
          inventoryValue: businessMetrics.inventoryValue || 0
        }
      };
    } catch (error) {
      log.error('Failed to get system metrics', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get metric summary for a category
   */
  private getMetricSummary(category: string): any {
    const summary: any = {};
    
    for (const [name, metrics] of this.metrics.entries()) {
      if (name.startsWith(category)) {
        const recentMetrics = metrics.slice(-100); // Last 100 metrics
        if (recentMetrics.length > 0) {
          const values = recentMetrics.map(m => m.value);
          summary[name.replace(`${category}.`, '')] = {
            current: values[values.length - 1],
            average: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values)
          };
        }
      }
    }
    
    return summary;
  }

  /**
   * Get database metrics
   */
  private async getDatabaseMetrics(): Promise<any> {
    try {
      // In a real implementation, these would come from database monitoring
      return {
        queryCount: 0,
        slowQueryCount: 0,
        averageQueryTime: 0,
        connectionCount: 1
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Get cache metrics
   */
  private getCacheMetrics(): any {
    // These would come from the CachingService
    return {
      hitRate: 0,
      missRate: 0,
      evictionRate: 0,
      memoryUsage: 0
    };
  }

  /**
   * Get business metrics
   */
  private async getBusinessMetrics(): Promise<any> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT s.id) as sales_count,
          COALESCE(SUM(s.total_amount), 0) as revenue,
          COUNT(DISTINCT s.customer_id) as active_users,
          COALESCE(SUM(p.stock_quantity * p.cost_price), 0) as inventory_value
        FROM sales s
        LEFT JOIN products p ON p.is_active = 1
        WHERE s.created_at >= datetime('now', '-24 hours')
          AND s.status = 'completed'
      `).first();

      return {
        salesCount: result?.sales_count || 0,
        revenue: result?.revenue || 0,
        activeUsers: result?.active_users || 0,
        inventoryValue: result?.inventory_value || 0
      };
    } catch (error) {
      return {
        salesCount: 0,
        revenue: 0,
        activeUsers: 0,
        inventoryValue: 0
      };
    }
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlerts(): void {
    // API response time alert
    this.addAlertRule({
      name: 'high_api_response_time',
      metric: 'api.response_time',
      condition: 'gt',
      threshold: 2000, // 2 seconds
      severity: AlertSeverity.WARNING,
      duration: 300, // 5 minutes
      cooldown: 600, // 10 minutes
      enabled: true
    });

    // Error rate alert
    this.addAlertRule({
      name: 'high_error_rate',
      metric: 'api.error_rate',
      condition: 'gt',
      threshold: 5, // 5%
      severity: AlertSeverity.ERROR,
      duration: 180, // 3 minutes
      cooldown: 300, // 5 minutes
      enabled: true
    });

    // Database connection alert
    this.addAlertRule({
      name: 'database_connection_failure',
      metric: 'database.connection_errors',
      condition: 'gt',
      threshold: 0,
      severity: AlertSeverity.CRITICAL,
      duration: 60, // 1 minute
      cooldown: 300, // 5 minutes
      enabled: true
    });
  }

  /**
   * Start automatic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect system metrics every minute
    setInterval(async () => {
      try {
        await this.collectSystemMetrics();
      } catch (error) {
        log.error('Failed to collect system metrics', { 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 60000); // 1 minute
  }

  /**
   * Collect system metrics automatically
   */
  private async collectSystemMetrics(): Promise<void> {
    // Record current timestamp
    this.setGauge('system.timestamp', Date.now());
    
    // Record memory usage (if available)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      this.setGauge('system.memory.used', memUsage.heapUsed, undefined, 'bytes');
      this.setGauge('system.memory.total', memUsage.heapTotal, undefined, 'bytes');
    }
  }
}
