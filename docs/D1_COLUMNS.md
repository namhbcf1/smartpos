# D1 Database Column Documentation

**Database**: namhbcf-uk
**Last Updated**: 2025-10-04
**Total Tables**: 81

This document provides a comprehensive list of all tables and their column structures in the D1 database.

---

## api_keys

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| user_id | INTEGER | YES |  |  |
| name | TEXT | YES |  |  |
| key_hash | TEXT | YES |  |  |
| permissions | TEXT | NO |  |  |
| expires_at | DATETIME | NO |  |  |
| last_used | DATETIME | NO |  |  |
| is_active | INTEGER | YES | 1 |  |
| created_at | DATETIME | YES | datetime('now') |  |

## audit_logs

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| actor_id | TEXT | YES |  |  |
| action | TEXT | YES |  |  |
| entity | TEXT | YES |  |  |
| entity_id | TEXT | YES |  |  |
| data_json | TEXT | NO |  |  |
| created_at | TEXT | YES | datetime('now') |  |

## auth_sessions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| user_id | TEXT | YES |  |  |
| token | TEXT | YES |  |  |
| expires_at | TEXT | YES |  |  |
| ip_address | TEXT | NO |  |  |
| user_agent | TEXT | NO |  |  |
| is_active | INTEGER | NO | 1 |  |
| created_at | TEXT | NO | datetime('now') |  |

## brands

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| name | TEXT | NO |  |  |
| description | TEXT | NO |  |  |
| website | TEXT | NO |  |  |
| logo_url | TEXT | NO |  |  |
| is_active | INTEGER | NO |  |  |
| created_at | TEXT | NO |  |  |
| updated_at | TEXT | NO |  |  |
| tenant_id | TEXT | NO | 'default' |  |

## broadcast_messages

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| type | TEXT | YES |  |  |
| data_json | TEXT | YES |  |  |
| sender | TEXT | NO |  |  |
| created_at | TEXT | YES | datetime('now') |  |

## cash_drawer_sessions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| drawer_id | TEXT | YES |  |  |
| opened_by | TEXT | YES |  |  |
| closed_by | TEXT | NO |  |  |
| opened_at | TEXT | YES | datetime('now') |  |
| closed_at | TEXT | NO |  |  |
| starting_balance | REAL | YES | 0 |  |
| ending_balance | REAL | NO |  |  |
| status | TEXT | YES | 'open' |  |
| created_at | TEXT | YES | datetime('now') |  |
| updated_at | TEXT | YES | datetime('now') |  |

## cash_drawer_transactions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| drawer_id | TEXT | YES |  |  |
| session_id | TEXT | NO |  |  |
| transaction_type | TEXT | YES |  |  |
| amount | REAL | YES |  |  |
| description | TEXT | NO |  |  |
| order_id | TEXT | NO |  |  |
| created_by | TEXT | YES |  |  |
| created_at | TEXT | YES | datetime('now') |  |

## cash_drawers

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| name | TEXT | YES |  |  |
| location | TEXT | NO |  |  |
| current_balance | REAL | YES | 0 |  |
| is_open | INTEGER | YES | 0 |  |
| last_opened_at | TEXT | NO |  |  |
| last_closed_at | TEXT | NO |  |  |
| created_at | TEXT | YES | datetime('now') |  |
| updated_at | TEXT | YES | datetime('now') |  |

## categories

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| name | TEXT | NO |  |  |
| description | TEXT | NO |  |  |
| parent_id | TEXT | NO |  |  |
| image_url | TEXT | NO |  |  |
| sort_order | INTEGER | NO |  |  |
| is_active | INTEGER | NO |  |  |
| created_at | TEXT | NO |  |  |
| updated_at | TEXT | NO |  |  |
| tenant_id | TEXT | NO | 'default' |  |

## collaboration_operations

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| session_id | TEXT | YES |  |  |
| document_type | TEXT | YES |  |  |
| document_id | TEXT | YES |  |  |
| operation_type | TEXT | YES |  |  |
| operation_data_json | TEXT | YES |  |  |
| position | INTEGER | YES | 0 |  |
| length | INTEGER | YES | 0 |  |
| version | INTEGER | YES | 1 |  |
| created_at | TEXT | YES | datetime('now') |  |

## collaboration_sessions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| document_type | TEXT | YES |  |  |
| document_id | TEXT | YES |  |  |
| user_id | TEXT | YES |  |  |
| user_name | TEXT | YES |  |  |
| user_role | TEXT | YES |  |  |
| user_color | TEXT | YES | '#000000' |  |
| cursor_x | INTEGER | NO | 0 |  |
| cursor_y | INTEGER | NO | 0 |  |
| selection_start | INTEGER | NO | 0 |  |
| selection_end | INTEGER | NO | 0 |  |
| is_active | INTEGER | YES | 1 |  |
| joined_at | TEXT | YES | datetime('now') |  |
| last_activity | TEXT | YES | datetime('now') |  |
| created_at | TEXT | YES | datetime('now') |  |

## customer_loyalty_status

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| customer_id | TEXT | YES |  |  |
| program_id | TEXT | YES |  |  |
| current_tier | TEXT | YES | 'bronze' |  |
| total_points | INTEGER | YES | 0 |  |
| lifetime_points | INTEGER | YES | 0 |  |
| is_active | INTEGER | YES | 1 |  |
| enrolled_at | TEXT | YES | datetime('now') |  |
| last_activity | TEXT | YES | datetime('now') |  |
| created_at | TEXT | YES | datetime('now') |  |
| updated_at | TEXT | YES | datetime('now') |  |

## customer_notifications

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| customer_id | TEXT | YES |  |  |
| notification_type | TEXT | YES |  |  |
| title | TEXT | NO |  |  |
| content | TEXT | NO |  |  |
| status | TEXT | NO | 'unread' |  |
| sent_at | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |

## customers

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| name | TEXT | NO |  |  |
| email | TEXT | NO |  |  |
| phone | TEXT | NO |  |  |
| address | TEXT | NO |  |  |
| date_of_birth | TEXT | NO |  |  |
| gender | TEXT | NO |  |  |
| customer_type | TEXT | NO |  |  |
| loyalty_points | INTEGER | NO |  |  |
| total_spent_cents | INTEGER | NO |  |  |
| visit_count | INTEGER | NO |  |  |
| last_visit | TEXT | NO |  |  |
| is_active | INTEGER | NO |  |  |
| created_at | TEXT | NO |  |  |
| updated_at | TEXT | NO |  |  |
| tenant_id | TEXT | NO | 'default' |  |
| code | TEXT | NO |  |  |
| city | TEXT | NO |  |  |
| district | TEXT | NO |  |  |
| ward | TEXT | NO |  |  |
| tax_code | TEXT | NO |  |  |
| company_name | TEXT | NO |  |  |
| credit_limit | DECIMAL(15,2) | NO | 0 |  |
| total_spent | DECIMAL(15,2) | NO | 0 |  |
| current_debt | DECIMAL(15,2) | NO | 0 |  |
| loyalty_tier | TEXT | NO | 'bronze' |  |
| notes | TEXT | NO |  |  |

## cycle_count_items

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| session_id | INTEGER | YES |  |  |
| product_id | INTEGER | YES |  |  |
| expected_quantity | INTEGER | YES |  |  |
| counted_quantity | INTEGER | YES |  |  |
| created_at | DATETIME | YES | datetime('now') |  |

## cycle_count_sessions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| store_id | INTEGER | NO |  |  |
| created_by | INTEGER | NO |  |  |
| status | TEXT | YES | 'open' |  |
| notes | TEXT | NO |  |  |
| created_at | DATETIME | YES | datetime('now') |  |
| finalized_at | DATETIME | NO |  |  |

## d1_migrations

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| name | TEXT | NO |  |  |
| applied_at | TIMESTAMP | YES | CURRENT_TIMESTAMP |  |

## debts

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | NO | 'default' |  |
| customer_id | TEXT | NO |  |  |
| supplier_id | TEXT | NO |  |  |
| debt_type | TEXT | YES |  |  |
| amount | DECIMAL(15,2) | YES |  |  |
| paid_amount | DECIMAL(15,2) | NO | 0 |  |
| remaining | DECIMAL(15,2) | YES |  |  |
| status | TEXT | NO | 'unpaid' |  |
| due_date | TEXT | NO |  |  |
| notes | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## devices

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | NO | 'default' |  |
| device_code | TEXT | YES |  |  |
| device_name | TEXT | YES |  |  |
| device_type | TEXT | NO | 'pos' |  |
| store_id | TEXT | NO |  |  |
| is_active | INTEGER | NO | 1 |  |
| last_active | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## document_locks

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| document_type | TEXT | YES |  |  |
| document_id | TEXT | YES |  |  |
| user_id | TEXT | YES |  |  |
| lock_type | TEXT | YES | 'edit' |  |
| acquired_at | TEXT | YES | datetime('now') |  |
| expires_at | TEXT | YES |  |  |

## employees

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | NO | 'default' |  |
| user_id | TEXT | NO |  |  |
| employee_code | TEXT | NO |  |  |
| full_name | TEXT | YES |  |  |
| email | TEXT | NO |  |  |
| phone | TEXT | NO |  |  |
| position | TEXT | NO |  |  |
| department | TEXT | NO |  |  |
| store_id | TEXT | NO |  |  |
| salary | DECIMAL(15,2) | NO |  |  |
| hire_date | TEXT | NO |  |  |
| is_active | INTEGER | NO | 1 |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## expenses

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| expense_type | TEXT | YES |  |  |
| expense_date | DATE | YES |  |  |
| amount | DECIMAL(10,2) | YES | 0 |  |
| notes | TEXT | NO |  |  |
| created_at | DATETIME | YES | datetime('now') |  |
| updated_at | DATETIME | YES | datetime('now') |  |
| created_by | INTEGER | NO |  |  |

## file_uploads

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| original_name | TEXT | YES |  |  |
| filename | TEXT | YES |  |  |
| file_type | TEXT | YES |  |  |
| file_size | INTEGER | YES |  |  |
| file_path | TEXT | NO |  |  |
| uploaded_by | TEXT | NO |  |  |
| entity_type | TEXT | NO |  |  |
| entity_id | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |

## inventory_movements

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| product_id | TEXT | NO |  |  |
| variant_id | TEXT | NO |  |  |
| transaction_type | TEXT | NO |  |  |
| quantity | INTEGER | NO |  |  |
| unit_cost_cents | INTEGER | NO |  |  |
| reference_id | TEXT | NO |  |  |
| reference_type | TEXT | NO |  |  |
| reason | TEXT | NO |  |  |
| notes | TEXT | NO |  |  |
| user_id | TEXT | NO |  |  |
| store_id | TEXT | NO |  |  |
| product_name | TEXT | NO |  |  |
| product_sku | TEXT | NO |  |  |
| created_at | TEXT | NO |  |  |
| tenant_id | TEXT | NO | 'default' |  |
| warehouse_id | TEXT | NO |  |  |

## invoices

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | NO | 'default' |  |
| invoice_number | TEXT | YES |  |  |
| customer_id | TEXT | NO |  |  |
| order_id | TEXT | NO |  |  |
| total_amount | DECIMAL(15,2) | YES |  |  |
| paid_amount | DECIMAL(15,2) | NO | 0 |  |
| status | TEXT | NO | 'pending' |  |
| due_date | TEXT | NO |  |  |
| notes | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## login_attempts

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| username | TEXT | YES |  |  |
| success | INTEGER | NO | 0 |  |
| ip_address | TEXT | NO |  |  |
| user_agent | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |

## loyalty_points_history

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| customer_id | TEXT | NO |  |  |
| points | INTEGER | NO |  |  |
| type | TEXT | NO |  |  |
| reference_id | TEXT | NO |  |  |
| reference_type | TEXT | NO |  |  |
| description | TEXT | NO |  |  |
| created_at | TEXT | NO |  |  |

## loyalty_programs

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| name | TEXT | YES |  |  |
| description | TEXT | NO |  |  |
| is_active | INTEGER | YES | 1 |  |
| points_per_dollar | REAL | YES | 1.0 |  |
| tier_requirements | TEXT | YES | '{}' |  |
| benefits | TEXT | NO |  |  |
| created_by | TEXT | NO |  |  |
| created_at | TEXT | YES | datetime('now') |  |
| updated_at | TEXT | YES | datetime('now') |  |

## loyalty_transactions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| customer_id | TEXT | YES |  |  |
| program_id | TEXT | YES |  |  |
| transaction_type | TEXT | YES |  |  |
| points | INTEGER | YES |  |  |
| description | TEXT | YES |  |  |
| order_id | TEXT | NO |  |  |
| created_at | TEXT | YES | datetime('now') |  |

## notification_preferences

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| user_id | TEXT | YES |  |  |
| email_notifications | INTEGER | YES | 1 |  |
| push_notifications | INTEGER | YES | 1 |  |
| inventory_alerts | INTEGER | YES | 1 |  |
| sales_alerts | INTEGER | YES | 1 |  |
| system_alerts | INTEGER | YES | 1 |  |
| low_stock_threshold | INTEGER | YES | 10 |  |
| created_at | TEXT | YES | datetime('now') |  |
| updated_at | TEXT | YES | datetime('now') |  |

## notifications

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| user_id | TEXT | NO |  |  |
| type | TEXT | YES | 'info' |  |
| category | TEXT | YES | 'system' |  |
| title | TEXT | YES |  |  |
| message | TEXT | YES |  |  |
| data_json | TEXT | NO |  |  |
| is_read | INTEGER | YES | 0 |  |
| is_persistent | INTEGER | YES | 1 |  |
| expires_at | TEXT | NO |  |  |
| created_at | TEXT | YES | datetime('now') |  |

## order_items

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| order_id | TEXT | NO |  |  |
| product_id | TEXT | NO |  |  |
| variant_id | TEXT | NO |  |  |
| quantity | INTEGER | NO |  |  |
| unit_price_cents | INTEGER | NO |  |  |
| total_price_cents | INTEGER | NO |  |  |
| discount_cents | INTEGER | NO |  |  |
| product_name | TEXT | NO |  |  |
| product_sku | TEXT | NO |  |  |
| created_at | TEXT | NO |  |  |

## orders

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| order_number | TEXT | YES |  |  |
| customer_id | TEXT | NO |  |  |
| user_id | TEXT | YES |  |  |
| store_id | TEXT | YES |  |  |
| status | TEXT | YES | 'pending' |  |
| subtotal_cents | INTEGER | YES | 0 |  |
| discount_cents | INTEGER | NO | 0 |  |
| tax_cents | INTEGER | NO | 0 |  |
| total_cents | INTEGER | YES | 0 |  |
| notes | TEXT | NO |  |  |
| receipt_printed | INTEGER | NO | 0 |  |
| customer_name | TEXT | NO |  |  |
| customer_phone | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |
| payment_method | TEXT | NO | 'cash' |  |
| payment_status | TEXT | NO | 'pending' |  |
| tenant_id | TEXT | NO | 'default' |  |

## parked_carts

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | YES | 'default' |  |
| user_id | TEXT | YES |  |  |
| cart_data | TEXT | YES |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## password_resets

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| user_id | INTEGER | YES |  |  |
| token | TEXT | YES |  |  |
| expires_at | DATETIME | YES |  |  |
| is_used | INTEGER | YES | 0 |  |
| created_at | DATETIME | YES | datetime('now') |  |
| used_at | DATETIME | NO |  |  |

## payment_methods

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| name | TEXT | NO |  |  |
| code | TEXT | NO |  |  |
| description | TEXT | NO |  |  |
| fee_percentage | REAL | NO |  |  |
| is_active | INTEGER | NO |  |  |
| created_at | TEXT | NO |  |  |

## payment_refunds

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| payment_transaction_id | TEXT | YES |  |  |
| refund_amount | DECIMAL(10,2) | YES |  |  |
| reason | TEXT | NO |  |  |
| status | TEXT | NO | 'pending' |  |
| gateway_refund_id | TEXT | NO |  |  |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP |  |

## payment_transactions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| transaction_id | TEXT | YES |  |  |
| order_id | TEXT | NO |  |  |
| amount | DECIMAL(10,2) | YES |  |  |
| currency | TEXT | NO | 'VND' |  |
| payment_method | TEXT | YES |  |  |
| gateway | TEXT | YES |  |  |
| status | TEXT | NO | 'pending' |  |
| gateway_transaction_id | TEXT | NO |  |  |
| gateway_response | TEXT | NO |  |  |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP |  |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP |  |

## payments

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| order_id | TEXT | NO |  |  |
| payment_method_id | TEXT | NO |  |  |
| amount_cents | INTEGER | NO |  |  |
| reference | TEXT | NO |  |  |
| status | TEXT | NO |  |  |
| processed_at | TEXT | NO |  |  |
| created_at | TEXT | NO |  |  |

## pos_daily_closings

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| date | TEXT | YES |  |  |
| total_orders | INTEGER | NO | 0 |  |
| total_sales | REAL | NO | 0 |  |
| cash_sales | REAL | NO | 0 |  |
| card_sales | REAL | NO | 0 |  |
| other_sales | REAL | NO | 0 |  |
| opening_balance | REAL | NO | 0 |  |
| closing_balance | REAL | NO | 0 |  |
| variance | REAL | NO | 0 |  |
| notes | TEXT | NO |  |  |
| closed_by | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |

## pos_order_items

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| order_id | TEXT | YES |  |  |
| product_id | TEXT | NO |  |  |
| product_name | TEXT | YES |  |  |
| sku | TEXT | NO |  |  |
| quantity | INTEGER | YES | 1 |  |
| unit_price | REAL | YES | 0 |  |
| total_price | REAL | YES | 0 |  |
| created_at | TEXT | YES | datetime('now') |  |

## pos_orders

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| order_number | TEXT | YES |  |  |
| tenant_id | TEXT | YES | 'default' |  |
| customer_id | TEXT | NO |  |  |
| customer_name | TEXT | NO |  |  |
| customer_phone | TEXT | NO |  |  |
| subtotal | REAL | YES | 0 |  |
| discount | REAL | YES | 0 |  |
| tax | REAL | YES | 0 |  |
| total | REAL | YES | 0 |  |
| payment_method | TEXT | YES | 'cash' |  |
| payment_status | TEXT | YES | 'pending' |  |
| status | TEXT | YES | 'pending' |  |
| notes | TEXT | NO |  |  |
| created_by | TEXT | YES |  |  |
| created_at | TEXT | YES | datetime('now') |  |
| updated_at | TEXT | YES | datetime('now') |  |

## pos_payments

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| order_id | TEXT | YES |  |  |
| tenant_id | TEXT | YES | 'default' |  |
| payment_method | TEXT | YES |  |  |
| amount | REAL | YES |  |  |
| transaction_id | TEXT | NO |  |  |
| notes | TEXT | NO |  |  |
| created_at | TEXT | YES | datetime('now') |  |

## pos_sessions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| cashier_id | TEXT | YES |  |  |
| cashier_name | TEXT | NO |  |  |
| register_id | TEXT | NO | '1' |  |
| opening_balance | REAL | NO | 0 |  |
| closing_balance | REAL | NO |  |  |
| status | TEXT | NO | 'open' |  |
| opened_at | TEXT | NO | datetime('now') |  |
| closed_at | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## product_variants

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| product_id | TEXT | NO |  |  |
| variant_name | TEXT | NO |  |  |
| sku | TEXT | NO |  |  |
| price_cents | INTEGER | NO |  |  |
| cost_price_cents | INTEGER | NO |  |  |
| stock | INTEGER | NO |  |  |
| attributes | TEXT | NO |  |  |
| is_active | INTEGER | NO |  |  |
| created_at | TEXT | NO |  |  |
| updated_at | TEXT | NO |  |  |

## product_warranty_configs

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| product_id | INTEGER | NO |  |  |
| category_id | INTEGER | NO |  |  |
| default_warranty_months | INTEGER | YES | 12 |  |
| max_warranty_months | INTEGER | YES | 36 |  |
| warranty_type | TEXT | YES | 'manufacturer' |  |
| warning_days_before_expiry | INTEGER | YES | 30 |  |
| enable_auto_notifications | INTEGER | YES | 1 |  |
| warranty_terms | TEXT | NO |  |  |
| exclusions | TEXT | NO |  |  |
| created_at | DATETIME | YES | datetime('now') |  |
| updated_at | DATETIME | YES | datetime('now') |  |
| created_by | INTEGER | YES |  |  |

## products

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| name | TEXT | NO |  |  |
| sku | TEXT | NO |  |  |
| barcode | TEXT | NO |  |  |
| description | TEXT | NO |  |  |
| price_cents | INTEGER | NO |  |  |
| cost_price_cents | INTEGER | NO |  |  |
| stock | INTEGER | NO |  |  |
| min_stock | INTEGER | NO |  |  |
| max_stock | INTEGER | NO |  |  |
| unit | TEXT | NO |  |  |
| weight_grams | INTEGER | NO |  |  |
| dimensions | TEXT | NO |  |  |
| category_id | TEXT | NO |  |  |
| brand_id | TEXT | NO |  |  |
| supplier_id | TEXT | NO |  |  |
| store_id | TEXT | NO |  |  |
| image_url | TEXT | NO |  |  |
| images | TEXT | NO |  |  |
| category_name | TEXT | NO |  |  |
| brand_name | TEXT | NO |  |  |
| is_active | INTEGER | NO |  |  |
| is_serialized | INTEGER | NO |  |  |
| created_at | TEXT | NO |  |  |
| updated_at | TEXT | NO |  |  |
| tenant_id | TEXT | NO | 'default' |  |

## promotion_campaigns

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| store_id | TEXT | NO |  |  |
| campaign_name | TEXT | YES |  |  |
| description | TEXT | NO |  |  |
| campaign_type | TEXT | YES |  |  |
| discount_type | TEXT | NO |  |  |
| discount_value | REAL | NO | 0 |  |
| max_discount_amount | REAL | NO |  |  |
| buy_quantity | INTEGER | NO |  |  |
| get_quantity | INTEGER | NO |  |  |
| get_product_id | TEXT | NO |  |  |
| min_purchase_amount | REAL | NO | 0 |  |
| max_purchase_amount | REAL | NO |  |  |
| applicable_to | TEXT | NO | 'all_products' |  |
| applicable_items_json | TEXT | NO | '[]' |  |
| customer_tiers_json | TEXT | NO | '[]' |  |
| start_date | TEXT | YES |  |  |
| end_date | TEXT | YES |  |  |
| time_slots_json | TEXT | NO | '[]' |  |
| days_of_week_json | TEXT | NO | '[]' |  |
| total_usage_limit | INTEGER | NO |  |  |
| usage_per_customer | INTEGER | NO |  |  |
| current_usage_count | INTEGER | NO | 0 |  |
| priority | INTEGER | NO | 0 |  |
| is_active | INTEGER | NO | 1 |  |
| is_auto_apply | INTEGER | NO | 0 |  |
| is_combinable | INTEGER | NO | 0 |  |
| display_badge | TEXT | NO |  |  |
| display_badge_color | TEXT | NO |  |  |
| banner_image_url | TEXT | NO |  |  |
| tags_json | TEXT | NO | '[]' |  |
| terms_conditions | TEXT | NO |  |  |
| created_by | TEXT | YES |  |  |
| created_at | TEXT | YES | datetime('now') |  |
| updated_at | TEXT | YES | datetime('now') |  |
| deleted_at | TEXT | NO |  |  |

## promotion_usage

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| campaign_id | TEXT | YES |  |  |
| tenant_id | TEXT | YES | 'default' |  |
| customer_id | TEXT | NO |  |  |
| order_id | TEXT | NO |  |  |
| discount_amount | REAL | YES | 0 |  |
| used_at | TEXT | YES | datetime('now') |  |

## promotions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | NO | 'default' |  |
| code | TEXT | YES |  |  |
| name | TEXT | YES |  |  |
| description | TEXT | NO |  |  |
| type | TEXT | NO | 'percentage' |  |
| value | DECIMAL(15,2) | YES |  |  |
| min_purchase | DECIMAL(15,2) | NO | 0 |  |
| max_discount | DECIMAL(15,2) | NO |  |  |
| start_date | TEXT | NO |  |  |
| end_date | TEXT | NO |  |  |
| is_active | INTEGER | NO | 1 |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## purchase_order_items

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| purchase_order_id | TEXT | YES |  |  |
| product_id | TEXT | YES |  |  |
| product_name | TEXT | NO |  |  |
| product_sku | TEXT | NO |  |  |
| quantity | INTEGER | YES |  |  |
| unit_price | DECIMAL(15,2) | YES |  |  |
| total_price | DECIMAL(15,2) | YES |  |  |
| created_at | TEXT | NO | datetime('now') |  |

## purchase_orders

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | NO | 'default' |  |
| po_number | TEXT | YES |  |  |
| supplier_id | TEXT | YES |  |  |
| store_id | TEXT | NO |  |  |
| total_amount | DECIMAL(15,2) | YES |  |  |
| status | TEXT | NO | 'pending' |  |
| order_date | TEXT | NO | datetime('now') |  |
| expected_date | TEXT | NO |  |  |
| received_date | TEXT | NO |  |  |
| notes | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## purchase_receipts

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| purchase_order_id | TEXT | NO |  |  |
| product_id | TEXT | NO |  |  |
| quantity | INTEGER | NO |  |  |
| unit_price | REAL | NO |  |  |
| created_at | TEXT | NO |  |  |
| receipt_date | TEXT | NO |  |  |

## report_definitions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| name | TEXT | YES |  |  |
| description | TEXT | NO |  |  |
| category | TEXT | YES | 'custom' |  |
| query | TEXT | YES |  |  |
| columns_json | TEXT | YES | '[]' |  |
| filters_json | TEXT | YES | '{}' |  |
| chart_type | TEXT | NO |  |  |
| refresh_interval | INTEGER | NO |  |  |
| is_scheduled | INTEGER | YES | 0 |  |
| schedule_config_json | TEXT | NO |  |  |
| is_active | INTEGER | YES | 1 |  |
| created_by | TEXT | YES |  |  |
| created_at | TEXT | YES | datetime('now') |  |
| updated_at | TEXT | YES | datetime('now') |  |

## report_executions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| report_id | TEXT | YES |  |  |
| executed_by | TEXT | YES |  |  |
| status | TEXT | YES | 'pending' |  |
| parameters_json | TEXT | NO |  |  |
| result_json | TEXT | NO |  |  |
| error_message | TEXT | NO |  |  |
| execution_time_ms | INTEGER | NO |  |  |
| created_at | TEXT | YES | datetime('now') |  |

## report_schedules

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| tenant_id | TEXT | YES | 'default' |  |
| report_id | TEXT | YES |  |  |
| frequency | TEXT | YES |  |  |
| time | TEXT | YES |  |  |
| day_of_week | INTEGER | NO |  |  |
| day_of_month | INTEGER | NO |  |  |
| recipients_json | TEXT | YES | '[]' |  |
| format | TEXT | YES | 'pdf' |  |
| is_active | INTEGER | YES | 1 |  |
| last_run | TEXT | NO |  |  |
| next_run | TEXT | NO |  |  |
| created_at | TEXT | YES | datetime('now') |  |
| updated_at | TEXT | YES | datetime('now') |  |

## roles

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| name | TEXT | NO |  |  |
| description | TEXT | NO |  |  |
| permissions | TEXT | NO |  |  |
| is_active | INTEGER | NO |  |  |
| created_at | TEXT | NO |  |  |

## schema_migrations

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| version | TEXT | YES |  |  |
| name | TEXT | YES |  |  |
| applied_at | TEXT | NO | datetime('now') |  |
| checksum | TEXT | NO |  |  |
| execution_time_ms | INTEGER | NO | 0 |  |

## serial_numbers

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | NO | 'default' |  |
| serial_number | TEXT | YES |  |  |
| product_id | TEXT | YES |  |  |
| status | TEXT | NO | 'available' |  |
| order_id | TEXT | NO |  |  |
| order_item_id | TEXT | NO |  |  |
| warranty_id | TEXT | NO |  |  |
| notes | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## settings

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| key | TEXT | YES |  |  |
| value | TEXT | NO |  |  |
| category | TEXT | NO | 'general' |  |
| description | TEXT | NO |  |  |
| tenant_id | TEXT | NO | 'default' |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## stock_alerts

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| product_id | TEXT | YES |  |  |
| alert_type | TEXT | YES |  |  |
| threshold_value | INTEGER | NO |  |  |
| current_value | INTEGER | NO |  |  |
| status | TEXT | NO | 'active' |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## stores

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| name | TEXT | NO |  |  |
| address | TEXT | NO |  |  |
| phone | TEXT | NO |  |  |
| email | TEXT | NO |  |  |
| tax_number | TEXT | NO |  |  |
| business_license | TEXT | NO |  |  |
| logo_url | TEXT | NO |  |  |
| timezone | TEXT | NO |  |  |
| currency | TEXT | NO |  |  |
| is_active | INTEGER | NO |  |  |
| created_at | TEXT | NO |  |  |
| updated_at | TEXT | NO |  |  |
| tenant_id | TEXT | NO | 'default' |  |

## suppliers

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| name | TEXT | NO |  |  |
| contact_person | TEXT | NO |  |  |
| email | TEXT | NO |  |  |
| phone | TEXT | NO |  |  |
| address | TEXT | NO |  |  |
| tax_number | TEXT | NO |  |  |
| payment_terms | TEXT | NO |  |  |
| credit_limit_cents | INTEGER | NO |  |  |
| is_active | INTEGER | NO |  |  |
| created_at | TEXT | NO |  |  |
| updated_at | TEXT | NO |  |  |
| tenant_id | TEXT | NO | 'default' |  |

## support_replies

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| ticket_id | TEXT | YES |  |  |
| message | TEXT | YES |  |  |
| user_id | TEXT | YES |  |  |
| is_internal | INTEGER | NO | 0 |  |
| created_at | TEXT | NO | datetime('now') |  |

## support_tickets

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | NO | 'default' |  |
| subject | TEXT | YES |  |  |
| description | TEXT | YES |  |  |
| customer_email | TEXT | YES |  |  |
| customer_name | TEXT | NO |  |  |
| customer_phone | TEXT | NO |  |  |
| status | TEXT | NO | 'open' |  |
| priority | TEXT | NO | 'normal' |  |
| category | TEXT | NO |  |  |
| assigned_to | TEXT | NO |  |  |
| tags | TEXT | NO |  |  |
| due_date | TEXT | NO |  |  |
| resolution_notes | TEXT | NO |  |  |
| resolved_at | TEXT | NO |  |  |
| created_by | TEXT | YES |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## task_checklist

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| task_id | TEXT | YES |  |  |
| title | TEXT | YES |  |  |
| is_done | INTEGER | NO | 0 |  |
| order_index | INTEGER | NO | 0 |  |
| created_at | TEXT | NO | datetime('now') |  |

## task_comments

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| task_id | TEXT | YES |  |  |
| author_id | INTEGER | NO |  |  |
| content | TEXT | YES |  |  |
| created_at | TEXT | NO | datetime('now') |  |

## tasks

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| title | TEXT | YES |  |  |
| description | TEXT | NO |  |  |
| category_id | INTEGER | NO |  |  |
| assigned_to | INTEGER | NO |  |  |
| status | TEXT | NO | 'pending' |  |
| priority | TEXT | NO | 'medium' |  |
| due_date | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## two_factor_auth

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| user_id | INTEGER | YES |  |  |
| secret | TEXT | YES |  |  |
| backup_codes | TEXT | NO |  |  |
| is_enabled | INTEGER | YES | 0 |  |
| verified_at | DATETIME | NO |  |  |
| created_at | DATETIME | YES | datetime('now') |  |

## user_activities

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| user_id | INTEGER | YES |  |  |
| action | TEXT | YES |  |  |
| resource_type | TEXT | NO |  |  |
| resource_id | INTEGER | NO |  |  |
| details | TEXT | NO |  |  |
| ip_address | TEXT | NO |  |  |
| user_agent | TEXT | NO |  |  |
| created_at | DATETIME | YES | datetime('now') |  |

## user_permissions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| name | TEXT | YES |  |  |
| description | TEXT | NO |  |  |
| resource | TEXT | YES |  |  |
| action | TEXT | YES |  |  |
| is_active | INTEGER | YES | 1 |  |
| created_at | DATETIME | YES | datetime('now') |  |

## user_profiles

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| user_id | INTEGER | YES |  |  |
| bio | TEXT | NO |  |  |
| address | TEXT | NO |  |  |
| city | TEXT | NO |  |  |
| country | TEXT | NO |  |  |
| timezone | TEXT | NO | 'UTC' |  |
| language | TEXT | NO | 'vi' |  |
| date_format | TEXT | NO | 'DD/MM/YYYY' |  |
| time_format | TEXT | NO | '24h' |  |
| currency | TEXT | NO | 'VND' |  |
| notifications | TEXT | NO |  |  |
| preferences | TEXT | NO |  |  |
| updated_at | DATETIME | YES | datetime('now') |  |

## user_roles

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| user_id | TEXT | NO |  | YES |
| role_id | TEXT | NO |  |  |
| assigned_at | TEXT | NO |  |  |

## user_sessions

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| user_id | INTEGER | YES |  |  |
| token | TEXT | YES |  |  |
| refresh_token | TEXT | NO |  |  |
| expires_at | DATETIME | YES |  |  |
| ip_address | TEXT | NO |  |  |
| user_agent | TEXT | NO |  |  |
| is_active | INTEGER | YES | 1 |  |
| created_at | DATETIME | YES | datetime('now') |  |
| last_activity | DATETIME | YES | datetime('now') |  |

## users

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| username | TEXT | NO |  |  |
| email | TEXT | NO |  |  |
| password_hash | TEXT | NO |  |  |
| full_name | TEXT | NO |  |  |
| role | TEXT | NO |  |  |
| is_active | INTEGER | NO |  |  |
| last_login | TEXT | NO |  |  |
| created_at | TEXT | NO |  |  |
| updated_at | TEXT | NO |  |  |
| tenant_id | TEXT | NO | 'default' |  |

## warehouses

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | NO | 'default' |  |
| code | TEXT | NO |  |  |
| name | TEXT | YES |  |  |
| address | TEXT | NO |  |  |
| manager_id | TEXT | NO |  |  |
| is_active | INTEGER | NO | 1 |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## warranties

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO | lower(hex(randomblob(16))) | YES |
| tenant_id | TEXT | NO | 'default' |  |
| warranty_code | TEXT | YES |  |  |
| product_id | TEXT | YES |  |  |
| customer_id | TEXT | NO |  |  |
| order_id | TEXT | NO |  |  |
| warranty_type | TEXT | NO | 'standard' |  |
| start_date | TEXT | YES |  |  |
| end_date | TEXT | YES |  |  |
| status | TEXT | NO | 'active' |  |
| notes | TEXT | NO |  |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## warranty_alerts

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | TEXT | NO |  | YES |
| warranty_id | TEXT | YES |  |  |
| alert_type | TEXT | YES |  |  |
| days_before_expiry | INTEGER | NO |  |  |
| message | TEXT | NO |  |  |
| status | TEXT | NO | 'active' |  |
| created_at | TEXT | NO | datetime('now') |  |
| updated_at | TEXT | NO | datetime('now') |  |

## warranty_claims

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| claim_number | TEXT | YES |  |  |
| warranty_registration_id | INTEGER | YES |  |  |
| serial_number_id | INTEGER | YES |  |  |
| claim_type | TEXT | YES |  |  |
| issue_description | TEXT | YES |  |  |
| reported_date | DATETIME | YES | datetime('now') |  |
| status | TEXT | YES | 'submitted' |  |
| resolution_type | TEXT | NO |  |  |
| resolution_description | TEXT | NO |  |  |
| resolution_date | DATETIME | NO |  |  |
| estimated_cost | DECIMAL(10,2) | NO | 0 |  |
| actual_cost | DECIMAL(10,2) | NO | 0 |  |
| covered_by_warranty | INTEGER | YES | 1 |  |
| customer_charge | DECIMAL(10,2) | NO | 0 |  |
| technician_id | INTEGER | NO |  |  |
| service_provider | TEXT | NO |  |  |
| external_reference | TEXT | NO |  |  |
| created_at | DATETIME | YES | datetime('now') |  |
| updated_at | DATETIME | YES | datetime('now') |  |
| created_by | INTEGER | YES |  |  |

## warranty_notifications

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| warranty_registration_id | INTEGER | YES |  |  |
| notification_type | TEXT | YES |  |  |
| notification_method | TEXT | YES |  |  |
| scheduled_date | DATETIME | YES |  |  |
| sent_date | DATETIME | NO |  |  |
| subject | TEXT | NO |  |  |
| message | TEXT | YES |  |  |
| template_id | TEXT | NO |  |  |
| status | TEXT | YES | 'pending' |  |
| delivery_status | TEXT | NO |  |  |
| error_message | TEXT | NO |  |  |
| created_at | DATETIME | YES | datetime('now') |  |
| updated_at | DATETIME | YES | datetime('now') |  |

## warranty_registrations

| Column | Type | Not Null | Default | PK |
|--------|------|----------|---------|----|
| id | INTEGER | NO |  | YES |
| warranty_number | TEXT | YES |  |  |
| serial_number_id | INTEGER | YES |  |  |
| product_id | INTEGER | YES |  |  |
| customer_id | INTEGER | YES |  |  |
| sale_id | INTEGER | YES |  |  |
| warranty_type | TEXT | YES |  |  |
| warranty_period_months | INTEGER | YES | 12 |  |
| warranty_start_date | DATETIME | YES |  |  |
| warranty_end_date | DATETIME | YES |  |  |
| status | TEXT | YES | 'active' |  |
| terms_accepted | INTEGER | YES | 0 |  |
| terms_accepted_date | DATETIME | NO |  |  |
| terms_version | TEXT | NO |  |  |
| contact_phone | TEXT | NO |  |  |
| contact_email | TEXT | NO |  |  |
| contact_address | TEXT | NO |  |  |
| created_at | DATETIME | YES | datetime('now') |  |
| updated_at | DATETIME | YES | datetime('now') |  |
| created_by | INTEGER | YES |  |  |

---

**Note**: This documentation is automatically generated from the remote D1 database.
System tables (sqlite_*, _cf_*) are excluded from this documentation.
