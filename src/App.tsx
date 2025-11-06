import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Auth from "./pages/Auth";
import EnhancedDashboard from "./pages/EnhancedDashboard";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Setup from "./pages/Setup";
import EnhancedPurchase from "./pages/EnhancedPurchase";
import RequisitionsPage from "./pages/RequisitionsPage";
import PaymentsFinance from "./pages/PaymentsFinance";
import ImportPage from "./pages/ImportPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import MedicineManagement from "./pages/MedicineManagement";
import POSSystem from "./pages/POSSystem";
import SalesHistory from "./pages/SalesHistory";
import EnhancedCustomers from "./pages/EnhancedCustomers";
import EnhancedReports from "./pages/EnhancedReports";
import StockManagement from "./pages/StockManagement";
import StockMovements from "./pages/StockMovements";
import LowStockAlerts from "./pages/LowStockAlerts";
import InventoryAnalytics from "./pages/InventoryAnalytics";
import AutoReorderPage from "./pages/AutoReorderPage";
import NotificationsPage from "./pages/NotificationsPage";
import BackupManagementPage from "./pages/BackupManagementPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";
import PerformanceDashboard from "./pages/PerformanceDashboard";
import AccountsVouchers from "./pages/AccountsVouchers";
import ServiceModule from "./pages/ServiceModule";
import HRMModule from "./pages/HRMModule";
import CRMModule from "./pages/CRMModule";
import PatientHistory from "./pages/PatientHistory";
import InternalMessages from "./pages/InternalMessages";
import SystemConfiguration from "./pages/SystemConfiguration";
import NotFound from "./pages/NotFound";
import SalesReturnPage from "./pages/SalesReturnPage";
import OpeningStockPage from "./pages/OpeningStockPage";
import StockAdjustmentPage from "./pages/StockAdjustmentPage";
import SupplierReturnPage from "./pages/SupplierReturnPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/categories"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/types"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/units"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/manufacturers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/batches"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/expiry-alerts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/low-stock"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/waste"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/statistics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/barcode"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/discounts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/medicine-management/transactions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MedicineManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StockManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/movements"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StockMovements />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/low-stock"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LowStockAlerts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InventoryAnalytics />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/auto-reorder"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AutoReorderPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/notifications"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NotificationsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/backups"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BackupManagementPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/system"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SystemSettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/performance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PerformanceDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Stock IN Activity Routes - Removed duplicate purchase route */}
            <Route
              path="/inventory/stock-in/sales-return"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SalesReturnPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-in/opening-stock"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OpeningStockPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-in/stock-adjustment"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StockAdjustmentPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Stock OUT Activity Routes */}
            <Route
              path="/inventory/stock-out/supplier-return"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SupplierReturnPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <Layout>
                    <POSSystem />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/pos"
              element={
                <ProtectedRoute>
                  <Layout>
                    <POSSystem />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SalesHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/setup"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Setup />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/setup/subcategories"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Setup />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/setup/countries"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Setup />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/setup/customers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedCustomers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedCustomers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/setup/suppliers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Setup />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/setup/companies"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Setup />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/medicine"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/inventory"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/sales"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/stock"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/financial"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/profit-loss"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/customer"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/purchase"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Legacy routes - redirect to appropriate tabs */}
            <Route
              path="/reports/stock-movement"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/low-stock"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/category-analysis"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/trend-analysis"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/inventory"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnhancedPurchase />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/requisitions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RequisitionsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentsFinance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentsFinance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/collection"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentsFinance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/vouchers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentsFinance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/receivables"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentsFinance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/payables"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentsFinance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/cashflow"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentsFinance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AccountsVouchers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/import"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImportPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AuditLogsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ServiceModule />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/hrm"
              element={
                <ProtectedRoute>
                  <Layout>
                    <HRMModule />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/crm"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CRMModule />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PatientHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InternalMessages />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/configuration"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SystemConfiguration />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
