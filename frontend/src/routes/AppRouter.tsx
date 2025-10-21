import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lightTheme, darkTheme } from '../theme/theme';

// Pages (lazy-loaded)
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DashboardOverview = lazy(() => import('../pages/dashboard/DashboardOverview'));
const ProductList = lazy(() => import('../pages/products/ProductList'));
const OrderManagement = lazy(() => import('../pages/orders/OrderManagement'));
const CustomerDirectory = lazy(() => import('../pages/customers/CustomerDirectory'));
const ReportsDashboard = lazy(() => import('../pages/reports/ReportsDashboard'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const ReportsManagement = lazy(() => import('../pages/reports/ReportsManagement'));
const SettingsManagement = lazy(() => import('../pages/settings/SettingsManagement'));
const SerialNumbersManagement = lazy(() => import('../pages/inventory/SerialNumbersManagement'));
const WarrantyCheck = lazy(() => import('../pages/public/WarrantyCheck'));
const CustomerRegister = lazy(() => import('../pages/public/CustomerRegister'));
const TradeInRegister = lazy(() => import('../pages/public/TradeInRegister'));
const AboutStore = lazy(() => import('../pages/public/AboutStore'));
const VNPayReturnPage = lazy(() => import('../pages/payment/VNPayReturnPage'));
const VNPayPayTestPage = lazy(() => import('../pages/payment/VNPayPayTestPage'));
const ProductsServices = lazy(() => import('../pages/public/ProductsServices'));
const ContactSupport = lazy(() => import('../pages/public/ContactSupport'));
const Policies = lazy(() => import('../pages/public/Policies'));
const AIChatAssistant = lazy(() => import('../pages/public/AIChatAssistant'));

// New Pages (lazy-loaded)
const POSScreen = lazy(() => import('../pages/pos/POSScreen'));
const EmployeesManagement = lazy(() => import('../pages/employees/EmployeesManagement'));
const SuppliersManagement = lazy(() => import('../pages/suppliers/SuppliersManagement'));
const PromotionsManagement = lazy(() => import('../pages/promotions/PromotionsManagement'));
const WarehouseManagement = lazy(() => import('../pages/warehouses/WarehouseManagement'));
const WarrantyManagement = lazy(() => import('../pages/products/WarrantyManagement'));
const DebtManagement = lazy(() => import('../pages/financial/DebtManagement'));
const SupportTicketsManagement = lazy(() => import('../pages/support/SupportTicketsManagement'));
const ShippingManagement = lazy(() => import('../pages/shipping/ShippingManagement'));
const ShippingOrders = lazy(() => import('../pages/shipping/ShippingOrders'));
const GHTKOrderCreate = lazy(() => import('../pages/shipping/GHTKOrderCreate'));

// Layouts
import MainLayout from '../layouts/MainLayout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// App Router Component
interface AppRouterProps {
  themeMode: 'light' | 'dark';
}

const AppRouter: React.FC<AppRouterProps> = ({ themeMode }) => {
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={null}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/warranty-check" element={<WarrantyCheck />} />
          <Route path="/dang-ky-khach-hang" element={<CustomerRegister />} />
          <Route path="/thu-mua-may-cu" element={<TradeInRegister />} />
          <Route path="/payment/vnpay-return" element={<VNPayReturnPage />} />
        <Route path="/payment/vnpay-pay-test" element={<VNPayPayTestPage />} />
          
          {/* Public Home - About Store */}
          <Route path="/" element={<Navigate to="/gioi-thieu" replace />} />
          <Route path="/gioi-thieu" element={<AboutStore />} />
          <Route path="/san-pham" element={<ProductsServices />} />
          <Route path="/lien-he" element={<ContactSupport />} />
          <Route path="/chinh-sach" element={<Policies />} />
          <Route path="/tro-ly-ao" element={<AIChatAssistant />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <DashboardOverview />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <ProductList />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <OrderManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <CustomerDirectory />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <ReportsManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <SettingsManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* New Routes */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <POSScreen />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <EmployeesManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <SuppliersManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/promotions"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <PromotionsManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/serials"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <SerialNumbersManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/warehouses"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <WarehouseManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/warranty"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <WarrantyManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/debts"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <DebtManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <SupportTicketsManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/shipping"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <ShippingManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/shipping/orders"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <ShippingOrders />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/shipping/ghtk/create"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <GHTKOrderCreate />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <ReportsDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout themeMode={themeMode} onThemeToggle={() => {}}>
                  <SettingsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Catch all route -> redirect to About Store */}
          <Route path="*" element={<Navigate to="/gioi-thieu" replace />} />
        </Routes>
        </Suspense>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppRouter;