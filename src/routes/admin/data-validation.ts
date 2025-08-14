// ==========================================
// DATA VALIDATION AND MIGRATION ENDPOINTS
// Admin tools for fixing data consistency issues
// ==========================================

import { Hono } from 'hono';
import { authenticate, authorize, auditLogger } from '../../middleware';
import { getUser } from '../../utils/auth';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// ==========================================
// DATA VALIDATION ENDPOINTS
// ==========================================

// GET /admin/data-validation/serial-numbers - Validate serial number data integrity
app.get('/serial-numbers', 
  authenticate, 
  authorize(['admin']), 
  async (c) => {
    try {
      const env = c.env as Env;
      console.log('🔍 Starting serial number data validation...');

      const validationResults = {
        total_serials: 0,
        missing_supplier: 0,
        missing_product: 0,
        invalid_status: 0,
        orphaned_warranties: 0,
        duplicate_serials: 0,
        inconsistent_dates: 0,
        issues: [] as string[],
      };

      // 1. Count total serial numbers
      const totalResult = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM serial_numbers 
        WHERE (deleted_at IS NULL OR deleted_at = '')
      `).first();
      validationResults.total_serials = totalResult?.count || 0;

      // 2. Check for missing supplier data
      const missingSupplierResult = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM serial_numbers 
        WHERE supplier_id IS NULL 
          AND (deleted_at IS NULL OR deleted_at = '')
      `).first();
      validationResults.missing_supplier = missingSupplierResult?.count || 0;

      // 3. Check for missing product references
      const missingProductResult = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM serial_numbers sn
        LEFT JOIN products p ON sn.product_id = p.id
        WHERE p.id IS NULL 
          AND (sn.deleted_at IS NULL OR sn.deleted_at = '')
      `).first();
      validationResults.missing_product = missingProductResult?.count || 0;

      // 4. Check for invalid status values
      const invalidStatusResult = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM serial_numbers 
        WHERE status NOT IN ('in_stock', 'sold', 'returned', 'defective', 'warranty_claim', 'disposed')
          AND (deleted_at IS NULL OR deleted_at = '')
      `).first();
      validationResults.invalid_status = invalidStatusResult?.count || 0;

      // 5. Check for duplicate serial numbers
      const duplicateResult = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM (
          SELECT serial_number 
          FROM serial_numbers 
          WHERE (deleted_at IS NULL OR deleted_at = '')
          GROUP BY serial_number 
          HAVING COUNT(*) > 1
        )
      `).first();
      validationResults.duplicate_serials = duplicateResult?.count || 0;

      // 6. Check for inconsistent dates
      const inconsistentDatesResult = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM serial_numbers 
        WHERE (
          (sold_date IS NOT NULL AND warranty_start_date IS NULL) OR
          (warranty_start_date IS NOT NULL AND warranty_end_date IS NULL) OR
          (sold_date IS NOT NULL AND received_date IS NOT NULL AND sold_date < received_date)
        ) AND (deleted_at IS NULL OR deleted_at = '')
      `).first();
      validationResults.inconsistent_dates = inconsistentDatesResult?.count || 0;

      // 7. Check for orphaned warranty registrations
      const orphanedWarrantyResult = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM warranty_registrations wr
        LEFT JOIN serial_numbers sn ON wr.serial_number_id = sn.id
        WHERE sn.id IS NULL
      `).first();
      validationResults.orphaned_warranties = orphanedWarrantyResult?.count || 0;

      // Generate issues summary
      if (validationResults.missing_supplier > 0) {
        validationResults.issues.push(`${validationResults.missing_supplier} serial numbers missing supplier data`);
      }
      if (validationResults.missing_product > 0) {
        validationResults.issues.push(`${validationResults.missing_product} serial numbers with invalid product references`);
      }
      if (validationResults.invalid_status > 0) {
        validationResults.issues.push(`${validationResults.invalid_status} serial numbers with invalid status`);
      }
      if (validationResults.duplicate_serials > 0) {
        validationResults.issues.push(`${validationResults.duplicate_serials} duplicate serial numbers found`);
      }
      if (validationResults.inconsistent_dates > 0) {
        validationResults.issues.push(`${validationResults.inconsistent_dates} serial numbers with inconsistent dates`);
      }
      if (validationResults.orphaned_warranties > 0) {
        validationResults.issues.push(`${validationResults.orphaned_warranties} orphaned warranty registrations`);
      }

      const hasIssues = validationResults.issues.length > 0;

      console.log('✅ Serial number validation completed:', validationResults);

      return c.json({
        success: true,
        data: {
          ...validationResults,
          has_issues: hasIssues,
          validation_date: new Date().toISOString(),
        },
        message: hasIssues 
          ? `Validation completed with ${validationResults.issues.length} issue types found`
          : 'Validation completed - no issues found'
      });

    } catch (error) {
      console.error('❌ Error during serial number validation:', error);
      return c.json({
        success: false,
        message: 'Error during validation',
        data: null,
        error: {
          type: 'VALIDATION_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }, 500);
    }
  }
);

// POST /admin/data-validation/fix-all - Fix all detected data issues
app.post('/fix-all', 
  authenticate, 
  authorize(['admin']), 
  auditLogger,
  async (c) => {
    try {
      const env = c.env as Env;
      const user = getUser(c);
      console.log('🔧 Starting comprehensive data fix...');

      const fixResults = {
        supplier_data_fixed: 0,
        invalid_products_removed: 0,
        invalid_status_fixed: 0,
        duplicate_serials_removed: 0,
        dates_fixed: 0,
        orphaned_warranties_removed: 0,
        total_fixes: 0,
      };

      // 1. Fix missing supplier data
      const supplierFixQuery1 = `
        UPDATE serial_numbers 
        SET supplier_id = (
          SELECT si.supplier_id 
          FROM stock_ins si 
          WHERE si.id = serial_numbers.stock_in_id
        )
        WHERE stock_in_id IS NOT NULL 
          AND supplier_id IS NULL
          AND (deleted_at IS NULL OR deleted_at = '')
      `;
      const supplierResult1 = await env.DB.prepare(supplierFixQuery1).run();
      fixResults.supplier_data_fixed += supplierResult1.changes || 0;

      // 2. Fix supplier data by product/date matching
      const supplierFixQuery2 = `
        UPDATE serial_numbers 
        SET supplier_id = (
          SELECT si.supplier_id 
          FROM stock_ins si
          JOIN stock_in_items sii ON si.id = sii.stock_in_id
          WHERE sii.product_id = serial_numbers.product_id
            AND date(si.created_at) = date(serial_numbers.received_date)
          ORDER BY si.created_at DESC
          LIMIT 1
        )
        WHERE supplier_id IS NULL 
          AND received_date IS NOT NULL
          AND (deleted_at IS NULL OR deleted_at = '')
      `;
      const supplierResult2 = await env.DB.prepare(supplierFixQuery2).run();
      fixResults.supplier_data_fixed += supplierResult2.changes || 0;

      // 3. Remove serial numbers with invalid product references
      const invalidProductQuery = `
        UPDATE serial_numbers 
        SET deleted_at = datetime('now')
        WHERE product_id NOT IN (SELECT id FROM products)
          AND (deleted_at IS NULL OR deleted_at = '')
      `;
      const invalidProductResult = await env.DB.prepare(invalidProductQuery).run();
      fixResults.invalid_products_removed = invalidProductResult.changes || 0;

      // 4. Fix invalid status values
      const invalidStatusQuery = `
        UPDATE serial_numbers 
        SET status = 'in_stock'
        WHERE status NOT IN ('in_stock', 'sold', 'returned', 'defective', 'warranty_claim', 'disposed')
          AND (deleted_at IS NULL OR deleted_at = '')
      `;
      const invalidStatusResult = await env.DB.prepare(invalidStatusQuery).run();
      fixResults.invalid_status_fixed = invalidStatusResult.changes || 0;

      // 5. Remove duplicate serial numbers (keep the oldest)
      const duplicateQuery = `
        UPDATE serial_numbers 
        SET deleted_at = datetime('now')
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM serial_numbers 
          WHERE (deleted_at IS NULL OR deleted_at = '')
          GROUP BY serial_number
        ) AND (deleted_at IS NULL OR deleted_at = '')
      `;
      const duplicateResult = await env.DB.prepare(duplicateQuery).run();
      fixResults.duplicate_serials_removed = duplicateResult.changes || 0;

      // 6. Fix inconsistent dates
      const dateFixQuery = `
        UPDATE serial_numbers 
        SET 
          warranty_start_date = CASE 
            WHEN sold_date IS NOT NULL AND warranty_start_date IS NULL 
            THEN sold_date 
            ELSE warranty_start_date 
          END,
          warranty_end_date = CASE 
            WHEN warranty_start_date IS NOT NULL AND warranty_end_date IS NULL 
            THEN datetime(warranty_start_date, '+12 months')
            ELSE warranty_end_date 
          END
        WHERE (
          (sold_date IS NOT NULL AND warranty_start_date IS NULL) OR
          (warranty_start_date IS NOT NULL AND warranty_end_date IS NULL)
        ) AND (deleted_at IS NULL OR deleted_at = '')
      `;
      const dateFixResult = await env.DB.prepare(dateFixQuery).run();
      fixResults.dates_fixed = dateFixResult.changes || 0;

      // 7. Remove orphaned warranty registrations
      const orphanedWarrantyQuery = `
        DELETE FROM warranty_registrations 
        WHERE serial_number_id NOT IN (SELECT id FROM serial_numbers)
      `;
      const orphanedWarrantyResult = await env.DB.prepare(orphanedWarrantyQuery).run();
      fixResults.orphaned_warranties_removed = orphanedWarrantyResult.changes || 0;

      // Calculate total fixes
      fixResults.total_fixes = 
        fixResults.supplier_data_fixed +
        fixResults.invalid_products_removed +
        fixResults.invalid_status_fixed +
        fixResults.duplicate_serials_removed +
        fixResults.dates_fixed +
        fixResults.orphaned_warranties_removed;

      // Log the fix operation
      await env.DB.prepare(`
        INSERT INTO system_logs (
          action, description, user_id, created_at
        ) VALUES (?, ?, ?, datetime('now'))
      `).bind(
        'data_fix_all',
        `Comprehensive data fix completed. Total fixes: ${fixResults.total_fixes}`,
        user.sub
      ).run();

      console.log('✅ Comprehensive data fix completed:', fixResults);

      return c.json({
        success: true,
        data: {
          ...fixResults,
          fix_date: new Date().toISOString(),
        },
        message: `Data fix completed. Total ${fixResults.total_fixes} issues resolved.`
      });

    } catch (error) {
      console.error('❌ Error during data fix:', error);
      return c.json({
        success: false,
        message: 'Error during data fix',
        data: null,
        error: {
          type: 'DATA_FIX_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }, 500);
    }
  }
);

export default app;
