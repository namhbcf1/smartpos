import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';

// Optimized lazy-loaded pages with better chunking strategy
// Core pages - loaded immediately when needed
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Product management - grouped together
const Products = lazy(() => import('./pages/products/ProductList'));
const ProductDetail = lazy(() => import('./pages/SimpleProductDetail'));
const ProductDetailReal = lazy(() => import('./pages/ProductDetailReal'));
const ProductDetailWorking = lazy(() => import('./pages/ProductDetailWorking'));
const TestProductDetail = lazy(() => import('./pages/TestProductDetail'));
const ProductEdit = lazy(() => import('./pages/products/ProductEdit'));
const Categories = lazy(() => import('./pages/Categories'));

// Sales management - grouped together
const Sales = lazy(() => import('./pages/Sales'));
const NewSale = lazy(() => import('./pages/NewSaleSimple'));
const SaleDetail = lazy(() => import('./pages/SaleDetail'));
const Orders = lazy(() => import('./pages/Orders'));
const Returns = lazy(() => import('./pages/Returns'));
const CreateReturn = lazy(() => import('./pages/CreateReturn'));
const Promotions = lazy(() => import('./pages/Promotions'));

// Inventory management - grouped together
const Inventory = lazy(() => import('./pages/inventory/Inventory'));
const InventoryTransactions = lazy(() => import('./pages/inventory/InventoryTransactions'));
const StockIn = lazy(() => import('./pages/inventory/StockInNew'));
const StockTransfer = lazy(() => import('./pages/inventory/StockTransfer'));
const StockCheck = lazy(() => import('./pages/inventory/StockCheck'));
const SupplierTest = lazy(() => import('./pages/inventory/SupplierTest'));
const EnhancedFeatures = lazy(() => import('./pages/EnhancedFeatures'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const SmartReportsDemo = lazy(() => import('./pages/SmartReportsDemo'));
const SerialNumberManagement = lazy(() => import('./pages/SerialNumberManagement'));
const WarrantyManagement = lazy(() => import('./pages/WarrantyManagement'));
const Suppliers = lazy(() => import('./pages/suppliers/SuppliersPage'));

// Reports - heavy components, load separately
const Reports = lazy(() => import('./pages/Reports'));
const RevenueReport = lazy(() => import('./pages/reports/RevenueReport'));
const TopProductsReport = lazy(() => import('./pages/reports/TopProductsReport'));
const InventoryReport = lazy(() => import('./pages/reports/InventoryReport'));
const ProfitReport = lazy(() => import('./pages/reports/ProfitReport'));

// Customer management
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));

// Financial management
const Finance = lazy(() => import('./pages/Finance'));
const Accounts = lazy(() => import('./pages/Accounts'));

// Admin and settings - load only when needed
const Users = lazy(() => import('./pages/Users'));
const EmployeeCommission = lazy(() => import('./pages/EmployeeCommission'));
const Settings = lazy(() => import('./pages/Settings'));

// Other features
const Calendar = lazy(() => import('./pages/Calendar'));
const Stores = lazy(() => import('./pages/Stores'));
const Profile = lazy(() => import('./pages/Profile'));
const PCBuilder = lazy(() => import('./pages/PCBuilder')); // 💻 PC Builder for computer store
const NotFound = lazy(() => import('./pages/NotFound'));

// Optimized loading component for Suspense fallback
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#fafafa'
    }}
  >
    <CircularProgress size={60} />
  </Box>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Products & Categories */}
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id/edit" element={<ProductEdit />} />
            <Route path="/products/:id" element={<ProductDetailReal />} />
            <Route path="/test-products/:id" element={<TestProductDetail />} />
            <Route path="/categories" element={<Categories />} />
            
            {/* Inventory Management */}
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/transactions" element={<InventoryTransactions />} />
            <Route path="/inventory/stock-in" element={<StockIn />} />
            <Route path="/inventory/transfer" element={<StockTransfer />} />
            <Route path="/inventory/check" element={<StockCheck />} />
            <Route path="/inventory/supplier-test" element={<SupplierTest />} />
            <Route path="/enhanced-features" element={<EnhancedFeatures />} />
            <Route path="/reports/revenue" element={<RevenueReport />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/smart-reports" element={<SmartReportsDemo />} />
            <Route path="/serial-numbers" element={<SerialNumberManagement />} />
            <Route path="/warranty" element={<WarrantyManagement />} />
            <Route path="/suppliers" element={<Suppliers />} />
            
            {/* Sales */}
            <Route path="/sales/new" element={<NewSale />} />
            <Route path="/sales/:id" element={<SaleDetail />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/returns/new" element={<CreateReturn />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/promotions" element={<Promotions />} />
            
            {/* Customers */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            
            {/* Reports - Manager and above */}
            <Route path="/reports" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/reports/revenue" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <RevenueReport />
              </ProtectedRoute>
            } />
            <Route path="/reports/top-products" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <TopProductsReport />
              </ProtectedRoute>
            } />
            <Route path="/reports/inventory" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <InventoryReport />
              </ProtectedRoute>
            } />
            <Route path="/reports/profit" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <ProfitReport />
              </ProtectedRoute>
            } />

            {/* Finance - Manager and above */}
            <Route path="/finance" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <Finance />
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <Accounts />
              </ProtectedRoute>
            } />
            
            {/* Other */}
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/pc-builder" element={<PCBuilder />} /> {/* 💻 PC Builder */}
            
            {/* Warranty Management */}
            <Route path="/warranty" element={<WarrantyManagement />} />

            {/* Admin and Manager only */}
            <Route path="/users" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <EmployeeCommission />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Redirect to login if not found */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate replace to="/404" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 