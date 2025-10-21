/**
 * Services Index - Export tất cả services theo folder
 * Auto-generated service exports
 */

// Core Services
export * from './core/BaseService';
export * from './core/ServiceManager';

// Business Services
export * from '../OrderService-OrdersManagementtsx';
export * from '../ProductService-ProductListtsx';
export * from './business/CategoryService';
export * from './business/BrandService';
export * from './business/CustomerService';
export * from '../InvoiceService-InvoicesManagementtsx';
export * from '../POSService-POSTsx';
export * from '../OnlineSalesService-OnlineSalesManagementtsx';
export * from '../OrderTemplateService-OrdersManagementtsx';
export * from './business/BranchService';

// Inventory Services
export * from '../InventoryService-InventoryManagementtsx';
export * from './inventory/AdvancedInventoryService';
export * from '../InventoryForecastingService-InventoryManagementtsx';
export * from '../StockInService-InventoryManagementtsx';
export * from '../PurchaseService-PurchasesManagementtsx';
export * from './inventory/SerialNumberService';

// Payment Services
export * from '../PaymentService-PaymentsManagementtsx';
export * from '../PaymentMethodService-PaymentsManagementtsx';
export * from './payment/CashDrawersService';

// Warranty Services
export * from '../WarrantyService-WarrantyManagementtsx';
export * from '../WarrantyNotificationService-WarrantyManagementtsx';
export * from '../WarrantyCheckService-WarrantyChecktsx';
export * from '../WarrantyCheckAdapter-WarrantyChecktsx';

// Notification Services
export * from '../NotificationService-NotificationsManagementtsx';
export * from '../NotificationBroadcaster-NotificationsManagementtsx';
export * from '../RealTimeNotificationService-Realtimetsx';
export * from '../RealtimeEventBroadcaster-Realtimetsx';
export * from '../RealtimeCollaborationService-Realtimetsx';

// Analytics Services
export * from './analytics/AdvancedAnalyticsService';
export * from './analytics/BusinessIntelligenceService';
export * from './analytics/AdvancedReportsService';
export * from '../ReportService-ReportsDashboardtsx';
// replaced by page-mapped service; import from new canonical file instead
export * from '../CustomReportsService-CustomReportstx';
export * from './analytics/TaskAnalyticsService';

// System Services
export * from '../MonitoringService-Monitoringtsx';
export * from '../HealthService-SystemHealthtsx';
export * from '../DebugService-Diagnosticstsx';
export * from '../ErrorHandlingService-ErrorManagementtsx';
export * from '../ErrorHandlingService-ErrorManagementtsx';
export * from './system/DatabaseOptimizationService';
export * from '../MigrationService-Migrationstsx';

// Integration Services
export * from './integration/apiService';
export * from '../IntegrationService-Integrationstsx';
export * from '../EcommerceService-EcommerceManagementtsx';

// Utility Services
export * from './utility/CachingService';
export * from '../FileUploadService-FileStorageManagementtsx';
export * from '../FileUploadService-FileStorageManagementtsx';
export * from '../R2StorageService-FileStorageManagementtsx';

// Auth Services
export * from '../RBACService-UserManagementtsx';
export * from '../RBACInitializationService-UserManagementtsx';
export * from '../RoleService-UsersManagementtsx';
export * from './auth/UserManagementService';
export * from '../EmployeeManagementService-EmployeesManagementtsx';
export * from '../EmployeeManagementService-EmployeesManagementtsx';
export * from './auth/TenantService';

// Marketing Services
export * from '../PromotionService-PromotionsManagementtsx';
export * from '../DiscountService-DiscountsManagementtsx';
export * from '../LoyaltyProgramService-LoyaltyProgramtsx';
export * from '../VoucherService-VouchersManagementtsx';
export * from './marketing/CustomerSegmentationService';
export * from './marketing/CustomerQueryService';

// Finance Services
export * from '../TaxService-TaxManagementtsx';
export * from '../FinancialService-FinancialOverviewtsx';
export * from '../FinancialService-FinancialOverviewtsx';
export * from '../DebtService-DebtManagementtsx';

// Operations Services
export * from '../ShippingService-ShippingManagementtsx';
export * from '../SupplierService-SuppliersManagementtsx';
export * from '../DistributorService-DistributorsManagementtsx';
// Device service is page-mapped elsewhere; route imports should use DeviceService-DevicesManagementtsx

// Support Services
export * from './support/SupportTicketService';
export * from './support/AlertsService';
export * from './support/TaskService';
export * from '../TaxService-TaxManagementtsx';
export * from '../TenantService-TenantManagementtsx';
export * from '../UserManagementService-UsersManagementtsx';
export * from '../VoucherService-VouchersManagementtsx';
export * from '../WarehouseService-WarehouseManagementtsx';
