#!/usr/bin/env node
/**
 * Schema Guard - Prevents deployment with mismatched database schemas
 *
 * This script validates that the production D1 database schema matches
 * the expected schema from migrations before allowing deployment.
 */

const fs = require('fs');
const path = require('path');

// Core table requirements based on analysis
const CORE_SCHEMA_REQUIREMENTS = {
  orders: {
    required_columns: ['id', 'order_number', 'customer_id', 'user_id', 'store_id', 'status', 'subtotal_cents', 'total_cents', 'created_at', 'updated_at'],
    critical: true,
    description: 'Main orders table - critical for sales operations'
  },
  order_items: {
    required_columns: ['id', 'order_id', 'product_id', 'quantity', 'unit_price_cents', 'total_price_cents', 'created_at'],
    critical: true,
    description: 'Order line items - critical for sales operations'
  },
  products: {
    required_columns: ['id', 'name', 'sku', 'price', 'stock', 'isActive', 'createdAt', 'updatedAt'],
    critical: true,
    description: 'Product catalog - critical for POS operations'
  },
  customers: {
    required_columns: ['id', 'name', 'email', 'phone'],
    critical: true,
    description: 'Customer database - critical for sales operations'
  },
  users: {
    required_columns: ['id', 'username', 'email', 'password_hash', 'role', 'is_active'],
    critical: true,
    description: 'User authentication - critical for security'
  },
  categories: {
    required_columns: ['id', 'name'],
    critical: false,
    description: 'Product categories'
  }
};

/**
 * Fetch schema information from production API
 */
async function getProductionSchema() {
  const API_BASE = process.env.API_BASE || 'https://namhbcf-api.bangachieu2.workers.dev/api';
  const API_TOKEN = process.env.API_TOKEN || process.env.ADMIN_TOKEN;

  if (!API_TOKEN) {
    throw new Error('API_TOKEN or ADMIN_TOKEN environment variable required');
  }

  try {
    const response = await fetch(`${API_BASE}/debug/schema`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Schema API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error(`Schema API error: ${data.message || 'Unknown error'}`);
    }

    return data.data;
  } catch (error) {
    console.error('Failed to fetch production schema:', error.message);
    throw error;
  }
}

/**
 * Validate schema against requirements
 */
function validateSchema(schema, requirements) {
  const errors = [];
  const warnings = [];

  for (const [tableName, tableReq] of Object.entries(requirements)) {
    const table = schema.tables?.find(t => t.name === tableName);

    if (!table) {
      const message = `Missing critical table: ${tableName} - ${tableReq.description}`;
      if (tableReq.critical) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
      continue;
    }

    // Check required columns
    const tableColumns = table.columns?.map(col => col.name) || [];
    const missingColumns = tableReq.required_columns.filter(col => !tableColumns.includes(col));

    if (missingColumns.length > 0) {
      const message = `Table ${tableName} missing columns: ${missingColumns.join(', ')}`;
      if (tableReq.critical) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
  }

  return { errors, warnings };
}

/**
 * Check if orders vs pos_orders conflict exists
 */
function checkOrdersConflict(schema) {
  const hasOrders = schema.tables?.some(t => t.name === 'orders');
  const hasPosOrders = schema.tables?.some(t => t.name === 'pos_orders');

  if (hasOrders && hasPosOrders) {
    return {
      conflict: true,
      message: 'Both orders and pos_orders tables exist - this creates confusion in the API. Consider consolidating to one system.'
    };
  }

  return { conflict: false };
}

/**
 * Main schema guard function
 */
async function runSchemaGuard() {
  console.log('🛡️  Schema Guard: Validating production database schema...\n');

  try {
    // Fetch production schema
    console.log('📡 Fetching production schema...');
    const schema = await getProductionSchema();
    console.log(`✅ Found ${schema.tables?.length || 0} tables in production\n`);

    // Validate core requirements
    console.log('🔍 Validating core schema requirements...');
    const validation = validateSchema(schema, CORE_SCHEMA_REQUIREMENTS);

    // Check for orders conflict
    const ordersConflict = checkOrdersConflict(schema);

    // Report results
    let hasBlockingIssues = false;

    if (validation.errors.length > 0) {
      console.log('❌ CRITICAL SCHEMA ERRORS:');
      validation.errors.forEach(error => console.log(`   - ${error}`));
      hasBlockingIssues = true;
    }

    if (ordersConflict.conflict) {
      console.log('⚠️  SCHEMA CONFLICT:');
      console.log(`   - ${ordersConflict.message}`);
      // This is a warning, not blocking for now
    }

    if (validation.warnings.length > 0) {
      console.log('⚠️  SCHEMA WARNINGS:');
      validation.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    // Summary
    console.log('\n📊 SCHEMA VALIDATION SUMMARY:');
    console.log(`   Tables: ${schema.tables?.length || 0}`);
    console.log(`   Critical Errors: ${validation.errors.length}`);
    console.log(`   Warnings: ${validation.warnings.length}`);
    console.log(`   Conflicts: ${ordersConflict.conflict ? 1 : 0}`);

    if (hasBlockingIssues) {
      console.log('\n🚫 DEPLOYMENT BLOCKED - Fix critical errors before deploying');
      process.exit(1);
    } else {
      console.log('\n✅ SCHEMA VALIDATION PASSED - Safe to deploy');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n💥 Schema Guard failed:', error.message);
    console.log('\n🚫 DEPLOYMENT BLOCKED - Unable to validate schema');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSchemaGuard();
}

module.exports = { runSchemaGuard, validateSchema, CORE_SCHEMA_REQUIREMENTS };