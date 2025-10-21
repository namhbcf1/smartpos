## Frontend Pages Overview (React + TypeScript + Ant Design)

This document summarizes all pages under `frontend/src/pages/`, their purposes, primary UI elements, data sources (APIs/hooks), and key user actions. Use it to quickly understand the site map and feature coverage.

### Conventions
- API client: `frontend/src/lib/api.ts` and `frontend/src/services/api.ts`
- Generic CRUD hook: `frontend/src/hooks/useCrud.ts`
- Reusable table: `frontend/src/components/crud/CrudTable.tsx`
- Standard list responses: entity-specific array + `pagination` (see `docs/API_RESPONSE_STANDARDS.md`)

---

### Dashboard
- Path: `pages/dashboard/Dashboard.tsx`
- Purpose: Executive overview of revenue, orders, customers, inventory health; quick actions; system status.
- Data: `/api/dashboard/stats`, `/api/products/top?limit=5`, `/api/orders/recent`, `/api/warranty/services`.
- Key UI: Stats cards, top products list, recent orders list, alerts, quick actions.

---

### Authentication
- Path: `pages/auth/LoginPage.tsx`
- Purpose: Simple localStorage-based login.
- Notes: Current build does not enforce JWT; credentials default to admin/admin123 per docs.

---

### Products
- Path: `pages/products/Products.tsx`
- Purpose: Full product catalog management.
- Data: `useCrud('/api/products')`, categories via `/api/products/categories`.
- UI/Actions: Search, filter by category/status, Excel import/export (placeholders), add/edit/delete, inventory/price fields, stats: totals/active/low stock/value.
- Components: `pages/products/components/{ProductsTable,ProductsHeader,ProductsFilters}.tsx`.

### Categories
- Path: `pages/products/CategoriesNew.tsx`
- Purpose: Category CRUD (hierarchy), used by products.
- Data: `pages/categories/hooks/useCategories.ts`.

---

### Orders
- Paths:
  - `pages/orders/OrdersList.tsx`: Main orders list with filters, status chips, quick stats, detail modal.
  - `pages/orders/NewOrders.tsx`: Entry point for new orders (draft/checkout flow).
  - `pages/orders/CompletedOrders.tsx`: Filtered view for completed.
  - `pages/orders/CancelledOrders.tsx`: Filtered view for cancelled.
  - `pages/orders/OrderDetail.tsx`: Standalone detail layout (demo stats).
  - `pages/orders/OrderReports.tsx`: Summary/reporting views.
- Data: `useCrud('/api/orders')`, detail requests as needed.
- UI/Actions: Search by code/customer/phone, filter by status, open detail modal, create new order.

---

### Sales
- Paths:
  - `pages/sales/components/{SalesHeader,SalesFilters,SalesTable}.tsx`
  - `pages/sales/hooks/useSales.ts`
- Purpose: Sales listing/filters/table components (backed by `/api/sales` in current docs, but orders are single source of truth after DB migration; UI remains for analytics/history).

---

### Inventory
- Paths:
  - `pages/inventory/Inventory.tsx`: Inventory list, value, stock health.
  - `pages/inventory/InventoryOperations.tsx`: Stock ops hub.
  - `pages/inventory/InventoryReorder.tsx`: Reorder planning.
  - `pages/inventory/InventoryAlerts.tsx`: Low stock alerts.
  - `pages/inventory/InventoryLocations.tsx`: Locations/warehouses.
  - `pages/inventory/StockCheck.tsx`: Cycle count.
  - `pages/inventory/StockIn.tsx`: Inbound (receive).
  - `pages/inventory/StockTransfer.tsx`: Inter-store transfer.
  - Components: `pages/inventory/components/{StockCheckHeader,StockCheckFilters,StockCheckTable}.tsx`.
- Data: `services/api.productsAPI.getProducts()` and CRUD to inventory routes where present.
- UI/Actions: Filters (category/status/stock), grid/list toggle, edit product, delete, KPIs.

---

### Customers & Partners
- Paths:
  - `pages/customers/Customers.tsx`: CRM main list, stats, add/edit/delete, detail drawer, Excel import/export (placeholders).
  - `pages/customers/Agents.tsx`, `pages/customers/Distributors.tsx`, `pages/customers/Partners.tsx`, `pages/customers/Suppliers.tsx`: filtered audience views.
  - Components: `pages/customers/components/{CustomerHeader,CustomerFilters,CustomerTable,CustomerForm}.tsx`.
- Data: `/api/customers`, `/api/customers/:id/*`.
- UI/Actions: Search, status filter, CRUD, analytics placeholders, purchase history drawer (via additional calls).

### Suppliers (Top-level)
- Path: `pages/suppliers/` (module entry present; feature pages under customers/suppliers view).
- Purpose: Supplier management and linkage to purchase orders.

---

### Purchases
- Paths:
  - `pages/purchases/PurchasesList.tsx`: Purchase order list.
  - `pages/purchases/PurchaseCreate.tsx`: Create PO.
  - `pages/purchases/PurchaseReceive.tsx`: Receive items to stock.
  - `pages/purchases/PurchaseReturn.tsx`: Supplier returns.
- Data: `/api/purchase-orders` (service-backed), inventory movements on receive.

---

### Invoices
- Path: `pages/invoices/Invoices.tsx`
- Purpose: Invoice lifecycle (draft → sent → paid), email/send, PDF export, record payments.
- Data: `useCrud('/invoices')`, supporting data from `/api/customers`, `/api/orders`, endpoints for PDF, email, payments.
- UI/Actions: Filters, date range, CSV export, create/edit with item rows and totals calculation, detail drawer.

---

### Payments
- Path: `pages/payments/Payments.tsx`
- Purpose: Track payment transactions across methods (cash, card, bank, VNPay, MoMo), refunds.
- Data: `/api/payments` list + `/payments/refunds` for refund actions.
- UI/Actions: Search, filter by status/method, CSV export, detail modal, refund button for completed.

---

### Debts
- Paths:
  - `pages/debts/CustomerDebts.tsx`
  - `pages/debts/SupplierDebts.tsx`
- Purpose: Manage receivables/payables; aging and settlement flows.
- Data: `/api/debts` family.

---

### Promotions
- Path: `pages/promotions/Promotions.tsx`
- Purpose: Define and manage promotions (percentage, fixed amount, buy X get Y), schedule windows, usage limits.
- Data: `useCrud('/promotions')`, `/api/promotions/usage`, `/api/promotions/quick-stats`.
- UI/Actions: Search, filter, create/edit, duplicate, toggle active, delete, usage progress, quick stats, deep link to detail.

---

### Roles & Users
- Paths:
  - `pages/roles/Roles.tsx`, `pages/roles/ArchivedRoles.tsx`
  - `pages/users/Users.tsx`, `pages/users/ArchivedUsers.tsx`
- Purpose: Role and user management, status toggles, basic stats, detail drawer for users.
- Data: Users via `useCrud('/users')` + `/api/users/stats`; Roles via `useCrud('/roles')`.
- UI/Actions: Search/filters, create/edit, enable/disable, delete.

---

### Employees
- Paths: `pages/employees/Employees.tsx`, `pages/employees/RetiredEmployees.tsx`
- Purpose: HR module for employees with performance and payroll overview.
- Data: `useCrud('/employees')`, `/api/employees/stats`.
- UI/Actions: Filters (dept/status/role), add/edit/delete, detail drawer, analytics tab, status toggle.

---

### Devices
- Path: `pages/devices/Devices.tsx`
- Purpose: POS terminals, printers, scanners, tablets, mobiles; status monitoring.
- Data: `useCrud('/devices')`, `/api/devices` for stats; device commands (restart) via `/devices/:id/restart`.
- UI/Actions: Search/filters, add/edit/delete, restart (online), detail drawer, KPI cards.

---

### Warranty & Serials
- Paths:
  - `pages/warranty/Warranty.tsx`, `pages/warranty/WarrantyClaims.tsx`, `pages/warranty/ServiceCenters.tsx`, `pages/warranty/WarrantyQRCode.tsx`, `pages/warranty/WarrantyServiceHub.tsx`
  - `pages/serials/SerialNumberManagement.tsx`
- Purpose: Warranty management, claims, service centers, QR workflows, serial tracking.
- Data: `/api/warranty/*`, `/api/serial-numbers/*`.

---

### Reports & Analytics
- Paths: `pages/reports/{Reports,ReportsBasic,Analytics,BusinessIntelligencePage}.tsx`
- Purpose: KPIs and analytics dashboards across sales/products/customers/inventory; BI landing page.
- Data: `/api/reports`, `/api/dashboard/stats`, domain-specific stats endpoints.

---

### Branches & Settings
- Paths:
  - `pages/branches/Branches.tsx`
  - `pages/settings/{UnifiedSettings,SettingsNew}.tsx`
- Purpose: Branch/store management; unified app settings.
- Data: `/api/stores`, `/api/settings`.

---

### Tasks & Support
- Paths:
  - Tasks: `pages/tasks/{Tasks,TaskDetail,MyTasks,KanbanTasks,CalendarTasks,TasksReports}.tsx`
  - Support: `pages/support/SupportTickets.tsx`
- Purpose: Internal task management, kanban, calendar, reports; customer support tickets.
- Data: `/api/tasks/*`, `/api/support/*`.

---

### Partners & Agents
- Paths: `pages/partners/`, `pages/agents/` (module folders present)
- Purpose: Views for business partners/agents (filtered CRM lenses), often sharing components with customers.

---

## Cross-cutting Patterns
- State & CRUD:
  - `useCrud` standardizes list pagination, filters, and CRUD calls; many pages rely on this.
  - Ant Design `Table`/custom `CrudTable` used pervasively.
- Formatting:
  - Currency as VND via `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
- Modals & Drawers:
  - Create/edit forms in `Modal`; richer read-only in `Drawer` (detail).
- Exports:
  - CSV/Excel export placeholders via client-side blob generation.
- Visuals:
  - Stats with `Statistic`, `Badge`, `Tag`, `Progress`.

## API Mappings (Typical)
- Products: `/api/products`, `/api/products/categories`, `/api/products/top`
- Orders: `/api/orders`, detail/filters by status
- Invoices: `/invoices` CRUD + `/api/invoices` stats, `/invoices/:id/pdf`, `/invoices/:id/send`, `/invoices/:id/payment`
- Payments: `/api/payments`, `/payments/refunds`
- Customers: `/api/customers` (+ searches/stats)
- Promotions: `/promotions` (CRUD), `/api/promotions/usage`, `/api/promotions/quick-stats`
- Employees: `/employees` (CRUD), `/api/employees/stats`
- Devices: `/devices` (CRUD), `/api/devices` (stats), `/devices/:id/restart`
- Warranty/Serials: `/api/warranty/*`, `/api/serial-numbers/*`
- Reports: `/api/dashboard/stats`, `/api/reports`

## Notes & Gaps
- Some feature pages are present as shells or specialized views (e.g., `NewOrders`, `CompletedOrders`, `CancelledOrders`) and share data hooks with main lists.
- Sales vs Orders: Database has consolidated to `orders`; some sales components remain for historical analytics/UI.
- Import/Export buttons exist in several pages as UX placeholders; server endpoints may be added later.


