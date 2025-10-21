# Database Migrations

## Current Migration Files

### Active Migrations

1. **`100_cloudflare_d1_production.sql`** (21KB)
   - **Purpose**: Complete fresh database schema for new installations
   - **Status**: Ready for fresh installs
   - **Contains**: All 43 tables with proper snake_case naming, indexes, and foreign keys
   - **Usage**: For new database creation from scratch

2. **`101_add_warehouse_columns.sql`** (365 bytes)
   - **Purpose**: Add `warehouse_id` column to `inventory_movements` table
   - **Status**: ✅ Applied to production (2025-10-01)
   - **Usage**: Historical record only

3. **`102_add_missing_production_tables.sql`** (8.2KB)
   - **Purpose**: Add 12 missing tables to existing production database
   - **Status**: ✅ Applied to production (2025-10-01)
   - **Tables Added**: sales, sale_items, warehouses, invoices, debts, promotions, employees, devices, warranties, serial_numbers, purchase_orders, schema_migrations
   - **Usage**: Historical record only

## How to Apply Migrations

### Fresh Install (New Database)
```bash
# Apply the complete schema
npx wrangler d1 execute namhbcf-uk --remote --file=./migrations/100_cloudflare_d1_production.sql
```

### Existing Database (Already Migrated)
No action needed. Files 101 and 102 have already been applied to production.

## Migration Standards

All migration files follow these standards:
- ✅ 100% Cloudflare D1 compatible
- ✅ No PRAGMA statements
- ✅ Snake_case column naming (created_at, is_active, tenant_id)
- ✅ Proper foreign key ordering
- ✅ No duplicate columns or indexes
- ✅ CREATE TABLE IF NOT EXISTS for safety
- ✅ CREATE INDEX IF NOT EXISTS for safety

## Current Production Database

**Database Name**: `namhbcf-uk`
**Database ID**: `55344bf5-d142-4c0d-9e53-0ace4c41870c`
**Total Tables**: 43 tables
**Database Size**: 0.62 MB
**Last Migration**: 2025-10-01

### Table Count by Category
- Core Business: 10 tables
- Inventory: 4 tables
- Financial: 6 tables
- Users & Auth: 5 tables
- Extended: 11 tables
- System: 7 tables

**Total**: 43 tables

## Migration History

| Version | Name | Applied | Description |
|---------|------|---------|-------------|
| 100 | cloudflare_d1_production | Ready | Complete schema for fresh install |
| 101 | add_warehouse_columns | 2025-10-01 | Added warehouse_id to inventory_movements |
| 102 | add_missing_production_tables | 2025-10-01 | Added 12 new tables to production |

## Old Migration Files (Deleted)

The following 26 migration files (0000-026) were deleted on 2025-10-01 due to:
- Duplicate table definitions
- PRAGMA statements incompatible with Cloudflare D1
- CamelCase column names instead of snake_case
- References to non-existent tables
- Incorrect foreign key ordering

All functionality from old migrations has been consolidated into files 100-102.

## Creating New Migrations

When creating new migrations:

1. **Naming Convention**: Use `{number}_{description}.sql`
   - Example: `103_add_customer_segments.sql`

2. **File Structure**:
   ```sql
   -- ============================================================================
   -- Migration {number}: {Description}
   -- Created: {date}
   -- ============================================================================

   -- Your DDL statements here
   CREATE TABLE IF NOT EXISTS new_table (...);
   ALTER TABLE existing_table ADD COLUMN new_column TEXT;

   -- Always use IF NOT EXISTS/IF EXISTS for safety
   ```

3. **Testing**:
   ```bash
   # Test locally first
   npx wrangler d1 execute namhbcf-uk --local --file=./migrations/103_new_migration.sql

   # Apply to production
   npx wrangler d1 execute namhbcf-uk --remote --file=./migrations/103_new_migration.sql
   ```

4. **Best Practices**:
   - Always use snake_case for column names
   - Add indexes for frequently queried columns
   - Use `DEFAULT` values when appropriate
   - Add `tenant_id TEXT DEFAULT 'default'` for multi-tenant tables
   - Use `created_at TEXT DEFAULT (datetime('now'))` for timestamps
   - Test migrations locally before applying to production

## Documentation

Full database schema documentation: `../docs/D1_DATABASE_SCHEMA.md`

## Rollback

⚠️ Cloudflare D1 does not support automatic rollbacks. If a migration fails:
1. Database returns to its original state automatically
2. Fix the migration file
3. Re-apply the corrected migration

## Support

For questions about migrations, refer to:
- Database Schema: `../docs/D1_DATABASE_SCHEMA.md`
- API Documentation: `../docs/API_DOCUMENTATION.md`
- Cloudflare D1 Docs: https://developers.cloudflare.com/d1/
