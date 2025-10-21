import React, { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeModeProvider, useThemeMode } from './theme/ThemeModeProvider';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import LazyWrapper from './components/LazyWrapper';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));

// Lazy load all page components for better performance
const TestPage = lazy(() => import('./pages/TestPage'));
const DashboardOverview = lazy(() => import('./pages/dashboard/DashboardOverview'));
const ProductList = lazy(() => import('./pages/products/ProductList'));
const CategoriesManagement = lazy(() => import('./pages/products/CategoriesManagement'));
const BrandsManagement = lazy(() => import('./pages/products/BrandsManagement'));
const OrderManagement = lazy(() => import('./pages/orders/OrderManagement'));
const CustomersManagement = lazy(() => import('./pages/customers/CustomersManagement'));
const InventoryManagement = lazy(() => import('./pages/inventory/InventoryManagement'));
const FinancialOverview = lazy(() => import('./pages/financial/FinancialOverview'));
const InvoicesManagement = lazy(() => import('./pages/financial/InvoicesManagement'));
const PaymentsManagement = lazy(() => import('./pages/financial/PaymentsManagement'));
const ReportsDashboard = lazy(() => import('./pages/reports/ReportsDashboard'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const RolesManagement = lazy(() => import('./pages/users/RolesManagement'));
const UsersManagement = lazy(() => import('./pages/users/UsersManagement'));
const DevicesManagement = lazy(() => import('./pages/inventory/DevicesManagement'));
const SerialNumbersManagement = lazy(() => import('./pages/inventory/SerialNumbersManagement'));
const SupportTicketsManagement = lazy(() => import('./pages/support/SupportTicketsManagement'));
const TaxManagement = lazy(() => import('./pages/taxes/TaxManagement'));
const SystemHealth = lazy(() => import('./pages/system/SystemHealth'));
const ShippingManagement = lazy(() => import('./pages/shipping/ShippingManagement'));
const ShippingOrders = lazy(() => import('./pages/shipping/ShippingOrders'));
const ShippingOrderDetail = lazy(() => import('./pages/ShippingOrderDetail'));
const GHTKOrderCreate = lazy(() => import('./pages/shipping/GHTKOrderCreate'));
const ReturnsManagement = lazy(() => import('./pages/returns/ReturnsManagement'));
const AlertsManagement = lazy(() => import('./pages/alerts/AlertsManagement'));
const DiscountsManagement = lazy(() => import('./pages/discounts/DiscountsManagement'));
const FileStorageManagement = lazy(() => import('./pages/storage/FileStorageManagement'));
const PurchaseOrdersManagement = lazy(() => import('./pages/purchases/PurchaseOrdersManagement'));
const PromotionsManagement = lazy(() => import('./pages/promotions/PromotionsManagement'));
const DebtManagement = lazy(() => import('./pages/financial/DebtManagement'));
const WarehousesManagement = lazy(() => import('./pages/warehouses/WarehouseManagement'));
const WarrantyManagement = lazy(() => import('./pages/products/WarrantyManagement'));
const POSScreen = lazy(() => import('./pages/pos/POSScreen'));
const EmployeesManagement = lazy(() => import('./pages/employees/EmployeesManagement'));
const SuppliersManagement = lazy(() => import('./pages/suppliers/SuppliersManagement'));
const WarrantyCheck = lazy(() => import('./pages/public/WarrantyCheck'));
const CustomerRegister = lazy(() => import('./pages/public/CustomerRegister'));
const TradeInRegister = lazy(() => import('./pages/public/TradeInRegister'));
const AboutStore = lazy(() => import('./pages/public/AboutStore'));
const ProductsServices = lazy(() => import('./pages/public/ProductsServices'));
const ContactSupport = lazy(() => import('./pages/public/ContactSupport'));
const Policies = lazy(() => import('./pages/public/Policies'));
const AIChatAssistant = lazy(() => import('./pages/public/AIChatAssistant'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  return isAuthenticated ? (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Public Route Component (redirect to dashboard if already authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Main App Component
const AppContent: React.FC = () => {
  return (
    <Router>
      <AIChatAssistant />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LazyWrapper>
                <LoginPage />
              </LazyWrapper>
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />

        {/* Public Warranty Check - No Auth Required */}
        <Route
          path="/warranty-check"
          element={<WarrantyCheck />}
        />

        {/* Public Customer Register - No Auth Required */}
        <Route
          path="/dang-ky-khach-hang"
          element={<CustomerRegister />}
        />

        {/* Public Trade-in Register - No Auth Required */}
        <Route
          path="/thu-mua-may-cu"
          element={<TradeInRegister />}
        />

        {/* Public About Store - No Auth Required */}
        <Route
          path="/gioi-thieu"
          element={<AboutStore />}
        />

        {/* Public Products/Services - No Auth Required */}
        <Route
          path="/san-pham"
          element={<ProductsServices />}
        />

        {/* Public Contact/Support - No Auth Required */}
        <Route
          path="/lien-he"
          element={<ContactSupport />}
        />

        {/* Public Policies - No Auth Required */}
        <Route
          path="/chinh-sach"
          element={<Policies />}
        />

        {/* Public AI Chat Assistant - SEO accessible */}
        <Route
          path="/tro-ly-ao"
          element={<div style={{ height: '80vh' }}><AIChatAssistant /></div>}
        />

        {/* Public Home - About Store */}
        <Route
          path="/"
          element={<AboutStore />}
        />

        <Route
          path="/test"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <TestPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <DashboardOverview />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <ProductList />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products/categories"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <CategoriesManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products/brands"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <BrandsManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <OrderManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <CustomersManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <InventoryManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/financial"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <FinancialOverview />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/financial/invoices"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <InvoicesManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/financial/payments"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <PaymentsManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <ReportsDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <SettingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/roles"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <RolesManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <UsersManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/devices"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <DevicesManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/serials"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <SerialNumbersManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/serial-numbers"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <SerialNumbersManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <SupportTicketsManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/taxes"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <TaxManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/system"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <SystemHealth />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/shipping"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <ShippingManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/shipping/orders"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <ShippingOrders />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/shipping/orders/:orderId"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <ShippingOrderDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/shipping/ghtk/create"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <GHTKOrderCreate />
              </MainLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/returns"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <ReturnsManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <AlertsManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/discounts"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <DiscountsManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/storage"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <FileStorageManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchases"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <PurchaseOrdersManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* <Route
          path="/pos/cart"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <PosCartManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        /> */}

        <Route
          path="/promotions"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <PromotionsManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/warehouses"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <WarehousesManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/warranty"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <WarrantyManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/debts"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <DebtManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode} fullWidth={true}>
                <POSScreen />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <EmployeesManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <MainLayout themeMode={useThemeMode().mode} onThemeToggle={useThemeMode().toggleThemeMode}>
                <SuppliersManagement />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all route -> redirect to About Store */}
        <Route path="*" element={<Navigate to="/gioi-thieu" replace />} />
      </Routes>
    </Router>
  );
};

// Root App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  );
};

export default App;