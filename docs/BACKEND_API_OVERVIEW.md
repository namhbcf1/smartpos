## Backend API Overview (Cloudflare Workers + Hono)

This document summarizes backend APIs implemented under `src/routes/`, how they map to the service layer (`src/services/`), and the shared middleware. It complements `docs/API_DOCUMENTATION.md` with a code-first view of the backend.

### Runtime & Architecture
- **Runtime**: Cloudflare Workers (TypeScript)
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage/Cache**: R2 / KV
- **Pattern**: Routes → Service Layer → DB/utils/types

### Global Entry
- `src/index.ts`: bootstraps Hono app, mounts middlewares and route modules.
- `src/routes/index.ts`: aggregates route files (primary API surface lives in `src/routes/api/`).

### Shared Middleware (`src/middleware`)
- `cors.ts`: CORS policy (localhost + Pages domains)
- `auth.ts`, `auth-standardized.ts`: auth guard and helpers (currently bypassed per docs)
- `rbac.ts`: role-based access control helpers
- `rateLimiting-unified.ts`: rate limiting (present; disabled by default)
- `responseFormatter.ts`: standardized responses (`success`, entity list keys, `pagination`, `error`)
- `validate.ts`, `validation-standard.ts`: request validation utilities
- `multiTenant.ts`: reads `X-Tenant-ID` header; defaults to `default`
- `errorHandler.ts`, `monitoring.ts`, `performance.ts`, `timezone.ts`, `security.ts`, `idempotency.ts`, `store.ts`

### Core Types & DB
- `src/types/*.ts`: API/database/shared types
- `src/db/init.ts`: D1 init & helpers; `db/migrations*.ts` for applied migrations
- `src/schema.ts`, `src/schemas/index.ts`: schema/type helpers

---

## Route Modules → Primary Endpoints → Services

Notable route files under `src/routes/api/` and their intended service mapping. Prefer `*-refactored.ts` when both exist.

### Health & System
- `routes/api/health.ts`, `routes/system/health.ts`, `routes/system/diagnostics.ts` → `HealthService`
- `routes/system/openapi.ts` → OpenAPI document (optional)

### Dashboard & Analytics
- `routes/api/dashboard.ts`, `routes/dashboard/analytics.ts`, `routes/api/analytics.ts` → `ReportsService`, `AdvancedAnalyticsService`, `services/reports/*`

### Products, Categories, Brands
- `routes/api/products.ts` → `ProductService`
- `routes/api/categories.ts`, `routes/api/categories-refactored.ts` → `SimpleCategoryService`
- `routes/api/brands.ts` → `BrandService`

### Customers & Segmentation
- `routes/api/customers.ts` → `CustomerService`
- `routes/api/customer-segmentation.ts` → `CustomerSegmentationService`

### Orders & POS (Sales consolidated into Orders)
- `routes/api/orders.ts`, `routes/api/cancelled-orders.ts`, `routes/api/completed-orders.ts` → `OrderService`
- `routes/pos/checkout.ts`, `routes/api/pos.ts`, `routes/api/pos-refactored.ts` → `POSService`
- Deprecated: `routes/api/sales.ts`, `routes/api/sales-deprecated.ts` (DB consolidated to `orders`)

### Invoices & Payments
- `routes/api/invoices.ts` → `InvoiceService`
- `routes/api/payments.ts`, `routes/payments/index.ts` → `PaymentService`
- `routes/api/payment-methods.ts` → `PaymentMethodService`
- Gateways: `routes/api/vnpay.ts`, `routes/api/vnpay-refactored.ts` → `VNPayService`; `routes/api/momo.ts`, `routes/api/momo-refactored.ts` → `MoMoService`

### Inventory & Stock Ops
- `routes/api/inventory.ts`, `routes/api/inventory-advanced.ts` → `InventoryService`, `AdvancedInventoryService`
- `routes/api/stock_in.ts`, `routes/api/stock_check.ts` → `StockInService` / `InventoryService`

### Purchases & Suppliers
- `routes/api/purchase-orders.ts`, `routes/api/purchases.ts` → `PurchaseService`
- `routes/api/suppliers.ts`, `routes/suppliers/index.ts` → `SupplierService`

### Promotions, Discounts, Tax
- `routes/api/promotions.ts` → `PromotionService`
- `routes/api/discounts.ts`, `routes/api/discount-tax.ts`, `routes/api/discount-tax-refactored.ts` → `DiscountService`, `DiscountTaxService`, `TaxService`

### Users, Roles, RBAC, Employees
- `routes/api/users.ts`, `routes/users/*` → `UserService`, `UserManagementService`
- `routes/api/roles.ts`, `routes/api/rbac.ts` → `RoleService`, `RBACService`
- `routes/api/employee-management.ts`, `routes/api/employee-management-refactored.ts`, `routes/api/employees.ts` → `EmployeeService`

### Devices
- `routes/api/devices.ts` → `DeviceService`

### Warranty & Serials
- `routes/api/warranties.ts`, `routes/warranty/*`, `routes/api/warranty.ts`, `routes/api/warranty-refactored.ts` → `WarrantyService`, `WarrantyNotificationService`, `SerialWarrantyService`
- `routes/api/serial-numbers.ts`, `routes/api/serial-numbers-new.ts`, `routes/api/serials.ts` → `SerialNumberService`

### Reports
- `routes/api/reports.ts`, `routes/api/reports_final.ts`, `routes/api/advanced-reports*.ts`, `routes/api/custom-reports*.ts` → `ReportsService`, `AdvancedReportsService`, `CustomReportsService`, `services/reports/*`

### Alerts & Notifications
- `routes/api/alerts.ts`, `routes/api/alerts-refactored.ts`, `routes/alerts/index.ts` → `AlertsService`, `NotificationService`
- Durable Objects: `src/durable_objects/*` for real-time notifications and POS/Inventory sync

### Tenants, Stores, Branches
- `routes/api/tenants.ts` → `TenantService`
- `routes/api/stores.ts`, `routes/api/branches.ts`, `routes/financial/index.ts` → `BranchService`

### Files & Uploads
- `routes/api/uploads.ts`, `routes/api/file-upload.ts` → `FileUploadService`, `R2StorageService`

### Support & Tasks
- `routes/api/support.ts`, `routes/api/support-tickets.ts` → `SupportTicketService`
- `routes/api/tasks.ts`, `routes/api/tasks-simple.ts`, `routes/api/task-management.ts` → `TaskService`, `TaskManagementService`, `TaskAnalyticsService`

### Partners, Agents, Distributors
- `routes/api/partners.ts`, `routes/api/agents.ts`, `routes/api/distributors.ts` → `PartnerAgentService`, `AgentService`, `DistributorService`

---

## Response Standards & Pagination
- Use `responseFormatter.ts` to ensure:
  - `success: boolean`
  - List: entity key (e.g., `products`, `customers`, `orders`) plus `pagination`
  - Single: `data: { ... }`
  - Error: `{ success: false, error, message? }`
- See `docs/API_RESPONSE_STANDARDS.md` for exact structures.

## Auth, RBAC, Multitenancy
- Current: auth bypassed (localStorage on frontend); middleware present for future enforcement
- RBAC scaffolding in `rbac.ts` and `services` for permission checks
- Multitenancy: `multiTenant.ts` injects tenant (default `default`); services should always bind tenant in queries

## Deprecations / Duplications (to be cleaned)
- Sales vs Orders: prefer `orders`; mark `sales*` routes as deprecated
- Prefer `*-refactored.ts` and remove older duplicates once parity is confirmed
- Remove `.bak`, `.backup` files under `routes/api`

## Testing & Diagnostics
- `routes/admin/*` for seeding and data validation
- `routes/system/diagnostics.ts`, `routes/api/debug.ts` for diagnostics (guarded)

## Service Layer Notes
- Routes delegate to `src/services/*`
- Common services include: `ProductService`, `OrderService`, `CustomerService`, `InvoiceService`, `PaymentService`, `InventoryService`, `PromotionService`, `SupplierService`, `UserService`, `RoleService`, `WarrantyService`, `SerialNumberService`
- Advanced analytics & BI: `services/reports/*`, `services/analytics/*`, `services/business/*`
