import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Dashboard from '../../pages/dashboard/Dashboard'
import LoginPage from '../../pages/auth/LoginPage'
import ModernProducts from '../../pages/products/ModernProducts'
import Sales from '../../pages/sales/Sales'
import Orders from '../../pages/orders/Orders'
import { OrdersList } from '../../pages/orders/OrdersList'
import { NewOrders } from '../../pages/orders/NewOrders'
import { CompletedOrders } from '../../pages/orders/CompletedOrders'
import { CancelledOrders } from '../../pages/orders/CancelledOrders'
import { OrderDetail } from '../../pages/orders/OrderDetail'
import { OrderReports } from '../../pages/orders/OrderReports'
import { MainLayout } from '../../components/layout/MainLayout'
import ErrorBoundary from '../../components/ErrorBoundary/index'
import ProtectedRoute from '../../components/common/ProtectedRoute'
import { useAuth } from '../../hooks/useAuth'
import Customers from '../../pages/customers/Customers'
import Suppliers from '../../pages/suppliers/Suppliers'
import { Distributors } from '../../pages/customers/Distributors'
import { Partners } from '../../pages/customers/Partners'
import { Reports } from '../../pages/reports/Reports'
// import { TasksList } from '../../pages/tasks/TasksList'
// import { MyTasks } from '../../pages/tasks/MyTasks'
// import { TasksKanban } from '../../pages/tasks/TasksKanban'
// import { TaskDetail } from '../../pages/tasks/TaskDetail'
// import { TasksReports } from '../../pages/tasks/TasksReports'
import { Settings } from '../../pages/settings/Settings'
import SettingsNew from '../../pages/settings/SettingsNew'
// import Inventory from '../../pages/inventory/Inventory'
import { lazy, Suspense } from 'react'
// const InventoryLocations = lazy(() => import('../../pages/inventory/InventoryLocations.tsx'))
// const InventoryBatches = lazy(() => import('../../pages/inventory/InventoryBatches.tsx'))
const InventoryAlerts = lazy(() => import('../../pages/inventory/InventoryAlerts.tsx'))
const InventoryReorder = lazy(() => import('../../pages/inventory/InventoryReorder.tsx'))
// import UsersPage from '../../pages/users/Users'
// import BusinessIntelligencePage from '../../pages/reports/BusinessIntelligencePage'
import NewSaleFixed from '../../pages/sales/NewSaleFixed'
import CategoriesNew from '../../pages/products/CategoriesNew'
import BusinessIntelligencePage from '../../pages/reports/BusinessIntelligencePage'
import ModernAnalytics from '../../pages/reports/ModernAnalytics'
import InventoryLocations from '../../pages/inventory/InventoryLocations'
// import TaskManagement from '../../pages/TaskManagement'
// import HeldSales from '../../pages/pos/HeldSales'
// import EndOfDay from '../../pages/pos/EndOfDay'
import OnlineSalesPage from '../../pages/pos/OnlineSalesPage'
import EnhancedStockIn from '../../pages/inventory/EnhancedStockIn'
import StockTransfer from '../../pages/inventory/StockTransfer'
import StockCheck from '../../pages/inventory/StockCheck'
import InventoryOperations from '../../pages/inventory/InventoryOperations'
import PurchasesList from '../../pages/purchases/PurchasesList'
import PurchaseCreate from '../../pages/purchases/PurchaseCreate'
import PurchaseReceive from '../../pages/purchases/PurchaseReceive'
import PurchaseReturn from '../../pages/purchases/PurchaseReturn'
import SerialNumberManagement from '../../pages/serials/SerialNumberManagement'
import DeviceManagement from '../../pages/devices/DeviceManagement'
import WarrantyServiceHub from '../../pages/warranty/WarrantyServiceHub'
import WarrantyClaims from '../../pages/warranty/WarrantyClaims'
import ServiceCenters from '../../pages/warranty/ServiceCenters'
import WarrantyQRCode from '../../pages/warranty/WarrantyQRCode'
// import WarrantyNotifications from '../../pages/warranty/WarrantyNotifications'
// import WarrantyHistory from '../../pages/warranty/WarrantyHistory'
import Payments from '../../pages/payments/Payments'
// import CustomerDebts from '../../pages/debts/CustomerDebts'
import SupplierDebts from '../../pages/debts/SupplierDebts'
import Invoices from '../../pages/invoices/Invoices'
import SupportTickets from '../../pages/support/SupportTickets'
// import DeviceManagement from '../../pages/devices/DeviceManagement'
import BranchManagement from '../../pages/branches/BranchManagement'
// import PurchaseOrders from '../../pages/purchases/PurchaseOrders'
// import PurchaseReceipts from '../../pages/purchases/PurchaseReceipts'
// import PurchaseReturns from '../../pages/purchases/PurchaseReturns'
import EmployeeManagementNew from '../../pages/employees/EmployeeManagementNew'
import RoleManagement from '../../pages/roles/RoleManagement'

// Layout wrapper component
const LayoutWrapper = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}

export function App() {
  const { isLoading } = useAuth()

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    )
  }

  // Fallback error handler
  const handleRouterError = (error: any) => {
    console.error('Router error:', error)
    // Redirect to login on router errors
    window.location.href = '/login'
  }

  try {
    return (
      <ErrorBoundary onError={handleRouterError}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <LayoutWrapper />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="overview" element={<Dashboard />} />
          <Route path="pos" element={<Navigate to="/sales/new" replace />} />
          {/* <Route path="pos/held" element={<HeldSales />} /> */}
          {/* <Route path="pos/end-of-day" element={<EndOfDay />} /> */}
          <Route path="pos/online" element={<OnlineSalesPage />} />
          <Route path="sales/new" element={<NewSaleFixed />} />
          <Route path="products" element={<ModernProducts />} />
          <Route path="products/list" element={<ModernProducts />} />
          <Route path="products/categories" element={<CategoriesNew />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/basic" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="sales" element={<Sales />} />
          <Route path="sales/history" element={<Sales />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/shipping" element={<OrdersList />} />
          <Route path="orders/new" element={<NewOrders />} />
          <Route path="orders/completed" element={<CompletedOrders />} />
          <Route path="orders/cancelled" element={<CancelledOrders />} />
          <Route path="orders/detail/:id" element={<OrderDetail />} />
          <Route path="orders/reports" element={<OrderReports />} />
          <Route path="orders/:orderId" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="distributors" element={<Distributors />} />
          <Route path="partners" element={<Partners />} />
          <Route path="reports" element={<Reports />} />
          {/* <Route path="tasks" element={<TasksList />} /> */}
          {/* <Route path="tasks/my" element={<MyTasks />} /> */}
          {/* <Route path="tasks/kanban" element={<TasksKanban />} /> */}
          {/* <Route path="tasks/calendar" element={<TasksList />} /> */}
          {/* <Route path="tasks/detail/:id" element={<TaskDetail />} /> */}
          {/* <Route path="tasks/reports" element={<TasksReports />} /> */}
          <Route path="settings" element={<SettingsNew />} />
          <Route path="settings-old" element={<Settings />} />
          <Route path="business-intelligence" element={<BusinessIntelligencePage />} />
          <Route path="analytics" element={<ModernAnalytics />} />
          <Route path="sales-history" element={<Sales />} />
          {/* <Route path="inventory" element={<Inventory />} /> */}
          <Route path="inventory" element={<InventoryOperations />} />
          <Route path="inventory/operations" element={<InventoryOperations />} />
          <Route path="inventory/stock-in" element={<EnhancedStockIn />} />
          <Route path="inventory/transfer" element={<StockTransfer />} />
          <Route path="inventory/check" element={<StockCheck />} />
          <Route path="inventory/locations" element={<InventoryLocations />} />
          {/* <Route path="inventory/batches" element={<Suspense fallback={<div />}> <InventoryBatches /> </Suspense>} /> */}
          <Route path="inventory/alerts" element={<Suspense fallback={<div />}> <InventoryAlerts /> </Suspense>} />
          <Route path="inventory/reorder" element={<Suspense fallback={<div />}> <InventoryReorder /> </Suspense>} />
          <Route path="purchases" element={<PurchasesList />} />
          <Route path="purchases/new" element={<PurchaseCreate />} />
          <Route path="purchases/receive" element={<PurchaseReceive />} />
          <Route path="purchases/return" element={<PurchaseReturn />} />
          <Route path="serials" element={<SerialNumberManagement />} />
          <Route path="warranty" element={<WarrantyServiceHub />} />
          <Route path="warranty-service" element={<WarrantyServiceHub />} />
          <Route path="warranty/claims" element={<WarrantyClaims />} />
          <Route path="warranty/service-centers" element={<ServiceCenters />} />
          <Route path="warranty/qr-lookup" element={<WarrantyQRCode />} />
          {/* <Route path="warranty/notifications" element={<WarrantyNotifications />} /> */}
          {/* <Route path="warranty/history" element={<WarrantyHistory />} /> */}
          <Route path="payments" element={<Payments />} />
          {/* <Route path="debts/customers" element={<CustomerDebts />} /> */}
          <Route path="debts/suppliers" element={<SupplierDebts />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="support/tickets" element={<SupportTickets />} />
          {/* <Route path="devices" element={<DeviceManagement />} /> */}
          <Route path="devices" element={<DeviceManagement />} />
          <Route path="branches" element={<BranchManagement />} />
          {/* <Route path="purchases/orders" element={<PurchaseOrders />} /> */}
          {/* <Route path="purchases/receipts" element={<PurchaseReceipts />} /> */}
          {/* <Route path="purchases/returns" element={<PurchaseReturns />} /> */}
          <Route path="employees" element={<EmployeeManagementNew />} />
          <Route path="roles" element={<RoleManagement />} />
          {/* <Route path="users" element={<UsersPage />} /> */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
  } catch (error) {
    console.error('App render error:', error)
    handleRouterError(error)

    // Fallback UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Có lỗi xảy ra</h1>
          <p className="text-gray-600 mb-4">Đang chuyển hướng về trang đăng nhập...</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-4 py-2 rounded">
            Đi tới đăng nhập
          </button>
        </div>
      </div>
    )
  }
}

export default App;
