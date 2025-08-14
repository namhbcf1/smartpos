# SmartPOS E2E Test Suite

Comprehensive end-to-end testing for the SmartPOS web application with **100% feature coverage**.

## 🎯 Overview

This test suite provides complete coverage of the SmartPOS application, testing all functionality against the live production environment:

- **Frontend**: https://222737d2.smartpos-web.pages.dev
- **API Backend**: https://smartpos-api.bangachieu2.workers.dev  
- **Database**: Cloudflare D1 (Real data, not mocked)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd tests/e2e
npm install
npx playwright install
```

### Run All Tests

```bash
npm run test:full
```

### View Results

```bash
npm run report
```

## 📋 Test Coverage

### 🔐 Authentication (01-authentication.spec.ts)
- ✅ Login page display and functionality
- ✅ Valid/invalid credential handling
- ✅ Session management and persistence
- ✅ Logout functionality
- ✅ Protected route access control
- ✅ Password visibility toggle
- ✅ Responsive design

### 📊 Dashboard (02-dashboard.spec.ts)
- ✅ Real-time data display from D1 database
- ✅ Statistics cards (8 products, 6 customers)
- ✅ Time period filters
- ✅ Charts and visualizations
- ✅ Recent orders section
- ✅ Low stock alerts
- ✅ AI insights
- ✅ Quick actions menu
- ✅ Real-time updates

### 📦 Product Management (03-product-management.spec.ts)
- ✅ Product list with real D1 data
- ✅ Search and filtering functionality
- ✅ Product details view
- ✅ CRUD operations
- ✅ Category management
- ✅ Stock status indicators
- ✅ Pagination
- ✅ API Raw data viewing
- ✅ Image display

### 🛒 Sales & POS (04-sales-pos.spec.ts)
- ✅ POS interface
- ✅ Product search and barcode scanning
- ✅ Cart management
- ✅ Sales history
- ✅ Order management
- ✅ Returns processing
- ✅ Payment methods
- ✅ Checkout process
- ✅ Sales analytics

### 📋 Inventory Management (05-inventory-management.spec.ts)
- ✅ Categories management
- ✅ Suppliers management
- ✅ Stock management
- ✅ Stock transfers
- ✅ Inventory reports
- ✅ Barcode functionality
- ✅ Warehouse management
- ✅ Low stock alerts
- ✅ Multi-location inventory

### 👥 Customer Management (06-customer-management.spec.ts)
- ✅ Customer list with real data
- ✅ Customer search and filtering
- ✅ Customer details and editing
- ✅ Purchase history
- ✅ Loyalty points system
- ✅ Customer analytics
- ✅ Communication features
- ✅ Customer segmentation
- ✅ Import/export functionality

### 📈 Reports & Analytics (07-reports-analytics.spec.ts)
- ✅ Revenue reports
- ✅ Product performance reports
- ✅ Customer analytics
- ✅ Inventory reports
- ✅ Financial reports
- ✅ Data visualization (charts)
- ✅ Export functionality
- ✅ Real-time data updates
- ✅ Custom date ranges

### ⚙️ Settings & Navigation (08-settings-navigation.spec.ts)
- ✅ Complete navigation menu
- ✅ Sidebar functionality
- ✅ Breadcrumb navigation
- ✅ Settings management
- ✅ User management
- ✅ System information
- ✅ Profile management
- ✅ Backup and restore
- ✅ Security settings

### 🔌 API Integration (09-api-integration.spec.ts)
- ✅ All API endpoints verification
- ✅ Data consistency between API and UI
- ✅ Error handling
- ✅ Performance testing
- ✅ Database integration
- ✅ Security verification
- ✅ Real-time data validation
- ✅ Complete workflow testing

## 🎮 Test Commands

### Basic Commands
```bash
npm run test                 # Run all tests
npm run test:headed         # Run with browser UI
npm run test:debug          # Debug mode
npm run test:ui             # Interactive UI mode
```

### Browser-Specific
```bash
npm run test:chromium       # Chrome only
npm run test:firefox        # Firefox only
npm run test:webkit         # Safari only
npm run test:mobile         # Mobile browsers
```

### Test Categories
```bash
npm run test:auth           # Authentication tests
npm run test:dashboard      # Dashboard tests
npm run test:products       # Product management
npm run test:sales          # Sales & POS
npm run test:inventory      # Inventory management
npm run test:customers      # Customer management
npm run test:reports        # Reports & analytics
npm run test:settings       # Settings & navigation
npm run test:api            # API integration
```

### Test Filters
```bash
npm run test:smoke          # Smoke tests only
npm run test:critical       # Critical path tests
npm run test:parallel       # Parallel execution
npm run test:serial         # Serial execution
```

### Reports
```bash
npm run report              # Show latest report
npm run report:html         # HTML report
npm run clean               # Clean test results
```

## 📊 Test Results

### Expected Results
- **Total Tests**: ~150+ individual test cases
- **Success Rate**: 95%+ expected
- **Coverage**: 100% of application features
- **Duration**: 5-15 minutes depending on network

### Real Data Verification
All tests verify against **real data** from Cloudflare D1:
- ✅ 8 products in database
- ✅ 6 customers in database  
- ✅ Real pricing and inventory data
- ✅ Actual API responses
- ✅ Live database connections

## 🏗️ Test Architecture

### Test Structure
```
tests/e2e/
├── specs/                  # Test specifications
│   ├── 01-authentication.spec.ts
│   ├── 02-dashboard.spec.ts
│   ├── 03-product-management.spec.ts
│   ├── 04-sales-pos.spec.ts
│   ├── 05-inventory-management.spec.ts
│   ├── 06-customer-management.spec.ts
│   ├── 07-reports-analytics.spec.ts
│   ├── 08-settings-navigation.spec.ts
│   └── 09-api-integration.spec.ts
├── utils/                  # Helper utilities
│   └── test-helpers.ts
├── playwright.config.ts    # Playwright configuration
├── global-setup.ts        # Global test setup
├── global-teardown.ts     # Global test cleanup
├── run-tests.js           # Custom test runner
└── package.json           # Dependencies
```

### Key Features
- **Real Data Testing**: No mocks, tests against live D1 database
- **Cross-Browser**: Chrome, Firefox, Safari, Mobile
- **Responsive Testing**: Desktop, tablet, mobile viewports
- **API Verification**: Direct API endpoint testing
- **Error Handling**: Graceful error detection and reporting
- **Performance Monitoring**: Response time tracking
- **Visual Testing**: Screenshot capture on failures

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Override default URLs
SMARTPOS_FRONTEND_URL=https://222737d2.smartpos-web.pages.dev
SMARTPOS_API_URL=https://smartpos-api.bangachieu2.workers.dev
```

### Test Credentials
- **Username**: admin
- **Password**: admin

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: SmartPOS E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: |
          cd tests/e2e
          npm install
          npx playwright install
      - name: Run tests
        run: |
          cd tests/e2e
          npm run test:full
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: tests/e2e/test-results/
```

## 🐛 Troubleshooting

### Common Issues

**Tests fail with timeout**
```bash
# Increase timeout in playwright.config.ts
timeout: 120000
```

**Browser not found**
```bash
npx playwright install
```

**API connection issues**
```bash
# Check API status
curl https://smartpos-api.bangachieu2.workers.dev/api/v1/products
```

**Authentication failures**
```bash
# Clear auth state
rm auth-state.json
```

## 📞 Support

For issues or questions:
1. Check test results in `test-results/html-report/index.html`
2. Review failed test screenshots
3. Verify API connectivity
4. Check application status at target URLs

## 🎉 Success Criteria

Tests are considered successful when:
- ✅ All critical path tests pass
- ✅ Real data is properly loaded from D1
- ✅ API endpoints respond correctly
- ✅ UI displays accurate information
- ✅ Navigation works across all pages
- ✅ Responsive design functions properly
- ✅ Error handling works gracefully

**Target Success Rate**: 95%+ for production readiness
