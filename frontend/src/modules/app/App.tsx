import { Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from '../dashboard/Dashboard'
import LoginPage from '../../pages/auth/LoginPage'
import ProductsPage from '../../pages/products/ProductsPage'
import POSPage from '../../pages/pos/POSPage'
// Removed POS pages - using NewSale instead
import SalesPage from '../../pages/SalesPage'
import SaleDetail from '../../pages/SaleDetail'
import ReportsPage from '../../pages/reports/ReportsPage'
import AppLayout from '../../components/layout/AppLayout'
import ErrorBoundary from '../../components/ErrorBoundary'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../hooks/useAuth'
// Import missing pages
import CustomersPage from '../../pages/customers/CustomersPage'
import SettingsPage from '../../pages/Settings'
import InventoryPage from '../../pages/Inventory'
import { EmployeeManagement as EmployeesPage } from '../../pages/EmployeeManagement'
import UsersPage from '../../pages/Users'
import BusinessIntelligencePage from '../../pages/BusinessIntelligencePage'

export function App() {
  const { isAuthenticated, isLoading } = useAuth()

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

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pos" element={<POSPage />} />
                <Route path="/sales/new" element={<POSPage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/sales/:id" element={<SaleDetail />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/business-intelligence" element={<BusinessIntelligencePage />} />
                <Route path="/analytics" element={<BusinessIntelligencePage />} />
                <Route path="/sales-history" element={<SalesPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </ErrorBoundary>
  )
}


