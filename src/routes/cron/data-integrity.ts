/**
 * Data Integrity Checker
 * Cron job to verify and fix data inconsistencies
 */

import type { Env } from '../../types';
import { auditLog } from '../../services/audit';

interface IntegrityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  count: number;
  auto_fixed?: boolean;
}

export async function checkDataIntegrity(env: Env): Promise<{
  success: boolean;
  issues: IntegrityIssue[];
  summary: {
    total_checks: number;
    issues_found: number;
    critical_issues: number;
    auto_fixed: number;
  };
}> {
  const issues: IntegrityIssue[] = [];
  let autoFixedCount = 0;

  try {
    // 1. Check for orphaned serial numbers (product doesn't exist)
    const orphanedSerials = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM serial_numbers s
      WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = s.product_id)
    `).first();

    if (orphanedSerials && (orphanedSerials as any).count > 0) {
      issues.push({
        type: 'orphaned_serial_numbers',
        severity: 'high',
        description: 'Serial numbers exist for deleted products',
        count: (orphanedSerials as any).count
      });
    }

    // 2. Check for negative product stock quantities
    const negativeStock = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM products
      WHERE stock < 0
    `).first();

    if (negativeStock && (negativeStock as any).count > 0) {
      issues.push({
        type: 'negative_stock',
        severity: 'critical',
        description: 'Products with negative stock quantities',
        count: (negativeStock as any).count
      });

      // Auto-fix: Set negative quantities to 0
      await env.DB.prepare(`
        UPDATE products SET stock = 0 WHERE stock < 0
      `).run();

      issues[issues.length - 1].auto_fixed = true;
      autoFixedCount++;
    }

    // 3. Check for orders without order items
    const ordersWithoutItems = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM orders o
      WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id)
    `).first();

    if (ordersWithoutItems && (ordersWithoutItems as any).count > 0) {
      issues.push({
        type: 'orders_without_items',
        severity: 'high',
        description: 'Orders exist without any order items',
        count: (ordersWithoutItems as any).count
      });
    }

    // 4. Check for order items with non-existent products
    const orphanedOrderItems = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM order_items oi
      WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = oi.product_id)
    `).first();

    if (orphanedOrderItems && (orphanedOrderItems as any).count > 0) {
      issues.push({
        type: 'orphaned_order_items',
        severity: 'medium',
        description: 'Order items reference deleted products',
        count: (orphanedOrderItems as any).count
      });
    }

    // 6. Check for duplicate serial numbers
    const duplicateSerials = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT serial_number FROM serial_numbers
        GROUP BY serial_number
        HAVING COUNT(*) > 1
      )
    `).first();

    if (duplicateSerials && (duplicateSerials as any).count > 0) {
      issues.push({
        type: 'duplicate_serial_numbers',
        severity: 'critical',
        description: 'Duplicate serial numbers found in system',
        count: (duplicateSerials as any).count
      });
    }

    // 7. Check for serials with invalid status
    const invalidSerialStatus = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM serial_numbers
      WHERE status NOT IN ('in_stock', 'sold', 'defective', 'returned')
    `).first();

    if (invalidSerialStatus && (invalidSerialStatus as any).count > 0) {
      issues.push({
        type: 'invalid_serial_status',
        severity: 'medium',
        description: 'Serial numbers with invalid status values',
        count: (invalidSerialStatus as any).count
      });
    }

    // 8. Check for expired serial reservations (should be caught by cron, but double-check)
    const expiredReservations = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM serial_numbers
      WHERE reserved_until IS NOT NULL
        AND reserved_until < datetime('now')
    `).first();

    if (expiredReservations && (expiredReservations as any).count > 0) {
      issues.push({
        type: 'expired_reservations',
        severity: 'low',
        description: 'Expired serial reservations not released',
        count: (expiredReservations as any).count
      });

      // Auto-fix: Release expired reservations
      await env.DB.prepare(`
        UPDATE serial_numbers
        SET reserved_at = NULL,
            reserved_by = NULL,
            reserved_until = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE reserved_until IS NOT NULL
          AND reserved_until < datetime('now')
      `).run();

      issues[issues.length - 1].auto_fixed = true;
      autoFixedCount++;
    }

    const summary = {
      total_checks: 7,
      issues_found: issues.length,
      critical_issues: issues.filter(i => i.severity === 'critical').length,
      auto_fixed: autoFixedCount
    };

    return {
      success: true,
      issues,
      summary
    };
  } catch (error: any) {
    console.error('Data integrity check failed:', error);
    return {
      success: false,
      issues: [{
        type: 'check_failed',
        severity: 'critical',
        description: error.message,
        count: 1
      }],
      summary: {
        total_checks: 0,
        issues_found: 1,
        critical_issues: 1,
        auto_fixed: 0
      }
    };
  }
}
