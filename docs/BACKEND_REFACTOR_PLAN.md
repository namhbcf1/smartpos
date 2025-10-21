## Backend Refactor Plan (Pragmatic, Incremental)

Goal: standardize routes around the service layer, enforce response standards, remove duplicates/legacy, and harden auth/RBAC when needed – without breaking existing frontend integrations.

### Scope & Priorities
1) Normalize route files to a single source per feature (prefer `*-refactored.ts`).
2) Enforce response format and pagination via `responseFormatter.ts`.
3) Remove deprecated sales flows in favor of `orders` (DB already consolidated).
4) Consolidate payments/gateways and upload/storage endpoints around services.
5) Enable lightweight auth guard (feature flag) and tenant binding in services.
6) Remove `.bak`, `.backup` and duplicate files after parity checks.

---

## Phase 1 – Standards & Cleanup (Low Risk)
- Response Standards
  - Ensure all list endpoints return `{ success, <entityKey>: [], pagination }`.
  - Ensure single-item endpoints return `{ success, data }`.
  - Convert any `data: []` list responses to entity keys (e.g., `products`, `customers`).
  - Centralize error responses with `{ success: false, error, message? }`.
- Pagination
  - Audit `routes/api/*` for list endpoints lacking `pagination` and add consistent pagination.
- Duplicates
  - For each pair `X.ts` and `X-refactored.ts`: confirm parity, keep the refactored file, remove the old one.
  - Remove `reports.ts.bak`, `reports.ts.backup`, `settings.ts.bak`, and similar backups.
- Sales → Orders
  - Mark `sales*` routes deprecated. Add `console.warn` or comment headers.

Deliverables:
- PR: standards + backup deletion + sales deprecation notes

---

## Phase 2 – Routing Consolidation
- Route Index
  - In `routes/index.ts`, import only the consolidated feature files.
- Feature Modules
  - Products: keep `products.ts` (service: `ProductService`).
  - Categories: keep `categories-refactored.ts` (service: `SimpleCategoryService`).
  - Orders/POS: keep `orders.ts`, `pos-refactored.ts` (services: `OrderService`, `POSService`).
  - Invoices/Payments: keep `invoices.ts`, `payments.ts`, `payment-methods.ts`.
  - Promotions/Discounts/Tax: keep `promotions.ts`, `discount-tax-refactored.ts`, `discounts.ts`, `tax.ts`.
  - Users/Roles/Employees: keep `users.ts`, `roles.ts`, `employee-management-refactored.ts`.
  - Devices: keep `devices.ts`.
  - Warranty/Serials: keep `warranty-refactored.ts`, `serial-numbers-new.ts`.
  - Reports: keep `reports_final.ts` and advanced/custom report routes.
  - Support/Tasks: keep `support-tickets.ts`, `tasks.ts` (or `task-management.ts` where applicable).

Deliverables:
- PR: `routes/index.ts` mounts only the canonical routes

---

## Phase 3 – Auth, RBAC, Multitenancy (Config-gated)
- Auth Guard
  - Use `auth-standardized.ts` with an `ENABLE_AUTH` env flag.
  - Continue allowing local dev without tokens; production can enable.
- RBAC
  - Integrate `rbac.ts` selectively on sensitive routes (users, roles, payments, invoices).
- Multitenancy
  - Ensure `multiTenant.ts` is mounted; verify services bind `tenant_id` consistently.

Deliverables:
- PR: middleware wiring + small service updates where tenant binding is missing

---

## Phase 4 – Service Hardening & Tests
- Services
  - Add guards for null/empty results; normalize error messages.
  - Extract shared SQL into helpers where duplication exists.
  - Prefer integer cents for money in new/updated logic.
- Tests (API smoke)
  - Add smoke tests per feature (GET list, GET one, POST create minimal, PUT update minimal).
  - Keep them lightweight to run on CI for Workers.

Deliverables:
- PR: service refactors + smoke tests

---

## Phase 5 – Docs & Tooling
- Docs
  - Ensure `docs/API_DOCUMENTATION.md` matches updated responses after consolidation.
  - Keep `docs/BACKEND_API_OVERVIEW.md` as source-of-truth for code layout.
- Tooling
  - Add an internal checklist to CI for response format compliance (lint-task or small script).

Deliverables:
- PR: docs sync + tooling

---

## Risk & Rollout
- Phases 1–2 are mostly structural; low risk if responses stay consistent.
- Gate auth/RBAC via flags to avoid breaking frontend.
- Remove legacy files only after verification (link to PR checks and manual endpoint comparisons).

## Success Criteria
- Single canonical route file per feature.
- All list endpoints return entity-key arrays + pagination.
- No leftover `.bak`/`.backup` in `routes/api`.
- Optional auth/RBAC can be toggled without code changes.

