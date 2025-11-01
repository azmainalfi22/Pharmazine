import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import EnhancedDashboard from "./pages/EnhancedDashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Setup from "./pages/Setup";
import Reports from "./pages/Reports";
import Purchase from "./pages/Purchase";
import EnhancedPurchase from "./pages/EnhancedPurchase";
import RequisitionsPage from "./pages/RequisitionsPage";
import PaymentsPage from "./pages/PaymentsPage";
import FinancePage from "./pages/FinancePage";
import ImportPage from "./pages/ImportPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import MedicineManagement from "./pages/MedicineManagement";
import POSSystem from "./pages/POSSystem";
import EnhancedCustomers from "./pages/EnhancedCustomers";
import EnhancedReports from "./pages/EnhancedReports";
import StockManagement from "./pages/StockManagement";
import ReturnsManagement from "./pages/ReturnsManagement";
import AccountsVouchers from "./pages/AccountsVouchers";
import ServiceModule from "./pages/ServiceModule";
import HRMModule from "./pages/HRMModule";
import CRMModule from "./pages/CRMModule";
import NotFound from "./pages/NotFound";

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
              path="/dashboard/old"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
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
              path="/inventory/old"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-in"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-out"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Stock IN Activity Routes */}
            <Route
              path="/inventory/stock-in/purchase"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-in/sales-return"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-in/opening-stock"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-in/transfer-in"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-in/stock-adjustment"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-in/misc-receive"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Stock OUT Activity Routes */}
            <Route
              path="/inventory/stock-out/sales"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-out/supplier-return"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-out/production-out"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-out/purchase-return"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-out/stock-adjustment"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-out/transfer-out"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/stock-out/misc-issue"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
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
              path="/sales/old"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Sales />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Sales />
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
              path="/reports/old"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/inventory"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/sales"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/stock-movement"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/low-stock"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/profit-loss"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/category-analysis"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/trend-analysis"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
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
              path="/purchase/old"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Purchase />
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
                    <PaymentsPage />
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
              path="/finance/old"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FinancePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/returns"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReturnsManagement />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
