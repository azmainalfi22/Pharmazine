import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

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
import PrescriptionManagement from "./pages/PrescriptionManagement";
import DrugInteractionChecker from "./pages/DrugInteractionChecker";
import RefillReminders from "./pages/RefillReminders";
import InsuranceClaims from "./pages/InsuranceClaims";
import AllergyManagement from "./pages/AllergyManagement";
import NotFound from "./pages/NotFound";
import SalesReturnPage from "./pages/SalesReturnPage";
import OpeningStockPage from "./pages/OpeningStockPage";
import StockAdjustmentPage from "./pages/StockAdjustmentPage";
import SupplierReturnPage from "./pages/SupplierReturnPage";
import MultiBranchManagement from "./pages/MultiBranchManagement";
import MultiBranchDashboard from "./pages/MultiBranchDashboard";
import BiDashboard from "./pages/BiDashboard";
import ProcurementModule from "./pages/ProcurementModule";
import PatientCRMModule from "./pages/PatientCRMModule";
import InterBranchTransfer from "./pages/InterBranchTransfer";
import SecuritySettingsPage from "./pages/SecuritySettingsPage";

const queryClient = new QueryClient();

/**
 * Wraps a page component in ProtectedRoute + Layout.
 * Reduces 60+ identical repetitions to a single wrapper.
 */
function PL({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function AppWithShortcuts({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <LanguageProvider>
              <AppWithShortcuts>
                <ErrorBoundary>
                  <Routes>
                    {/* Public */}
                    <Route path="/auth" element={<Auth />} />

                    {/* Dashboard */}
                    <Route path="/" element={<PL><EnhancedDashboard /></PL>} />

                    {/* Medicine Management — all sub-paths delegate tab selection to the page */}
                    <Route path="/medicine-management" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/products" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/categories" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/types" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/units" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/manufacturers" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/batches" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/expiry-alerts" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/low-stock" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/waste" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/statistics" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/barcode" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/discounts" element={<PL><MedicineManagement /></PL>} />
                    <Route path="/medicine-management/transactions" element={<PL><MedicineManagement /></PL>} />

                    {/* Inventory */}
                    <Route path="/inventory" element={<PL><StockManagement /></PL>} />
                    <Route path="/inventory/movements" element={<PL><StockMovements /></PL>} />
                    <Route path="/inventory/low-stock" element={<PL><LowStockAlerts /></PL>} />
                    <Route path="/inventory/analytics" element={<PL><InventoryAnalytics /></PL>} />
                    <Route path="/inventory/auto-reorder" element={<PL><AutoReorderPage /></PL>} />
                    <Route path="/inventory/stock-in/sales-return" element={<PL><SalesReturnPage /></PL>} />
                    <Route path="/inventory/stock-in/opening-stock" element={<PL><OpeningStockPage /></PL>} />
                    <Route path="/inventory/stock-in/stock-adjustment" element={<PL><StockAdjustmentPage /></PL>} />
                    <Route path="/inventory/stock-out/supplier-return" element={<PL><SupplierReturnPage /></PL>} />

                    {/* Sales / POS */}
                    <Route path="/sales" element={<PL><POSSystem /></PL>} />
                    <Route path="/sales/pos" element={<PL><POSSystem /></PL>} />
                    <Route path="/sales/history" element={<PL><SalesHistory /></PL>} />

                    {/* Customers */}
                    <Route path="/customers" element={<PL><EnhancedCustomers /></PL>} />
                    <Route path="/setup/customers" element={<PL><EnhancedCustomers /></PL>} />

                    {/* Purchase / Procurement */}
                    <Route path="/purchase" element={<PL><EnhancedPurchase /></PL>} />
                    <Route path="/procurement" element={<PL><ProcurementModule /></PL>} />
                    <Route path="/procurement/module" element={<PL><ProcurementModule /></PL>} />
                    <Route path="/requisitions" element={<PL><RequisitionsPage /></PL>} />

                    {/* Payments / Finance */}
                    <Route path="/payments" element={<PL><PaymentsFinance /></PL>} />
                    <Route path="/payments/dashboard" element={<PL><PaymentsFinance /></PL>} />
                    <Route path="/payments/collection" element={<PL><PaymentsFinance /></PL>} />
                    <Route path="/payments/vouchers" element={<PL><PaymentsFinance /></PL>} />
                    <Route path="/payments/receivables" element={<PL><PaymentsFinance /></PL>} />
                    <Route path="/payments/payables" element={<PL><PaymentsFinance /></PL>} />
                    <Route path="/payments/cashflow" element={<PL><PaymentsFinance /></PL>} />
                    <Route path="/finance" element={<PL><AccountsVouchers /></PL>} />

                    {/* Reports */}
                    <Route path="/reports" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/bi-dashboard" element={<PL><BiDashboard /></PL>} />
                    <Route path="/reports/medicine" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/sales" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/stock" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/financial" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/profit-loss" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/customer" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/purchase" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/inventory" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/stock-movement" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/low-stock" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/category-analysis" element={<PL><EnhancedReports /></PL>} />
                    <Route path="/reports/trend-analysis" element={<PL><EnhancedReports /></PL>} />

                    {/* Pharmacy Care */}
                    <Route path="/patients/crm" element={<PL><PatientCRMModule /></PL>} />
                    <Route path="/patient-crm" element={<PL><PatientCRMModule /></PL>} />
                    <Route path="/patient-history" element={<PL><PatientHistory /></PL>} />
                    <Route path="/prescriptions" element={<PL><PrescriptionManagement /></PL>} />
                    <Route path="/drug-interactions" element={<PL><DrugInteractionChecker /></PL>} />
                    <Route path="/refill-reminders" element={<PL><RefillReminders /></PL>} />
                    <Route path="/insurance-claims" element={<PL><InsuranceClaims /></PL>} />
                    <Route path="/allergy-management" element={<PL><AllergyManagement /></PL>} />

                    {/* Setup / System */}
                    <Route path="/setup" element={<PL><Setup /></PL>} />
                    <Route path="/setup/subcategories" element={<PL><Setup /></PL>} />
                    <Route path="/setup/countries" element={<PL><Setup /></PL>} />
                    <Route path="/setup/suppliers" element={<PL><Setup /></PL>} />
                    <Route path="/setup/companies" element={<PL><Setup /></PL>} />

                    {/* Settings */}
                    <Route path="/settings" element={<PL><Settings /></PL>} />
                    <Route path="/settings/notifications" element={<PL><NotificationsPage /></PL>} />
                    <Route path="/notifications" element={<PL><NotificationsPage /></PL>} />
                    <Route path="/settings/backups" element={<PL><BackupManagementPage /></PL>} />
                    <Route path="/settings/security" element={<PL><SecuritySettingsPage /></PL>} />
                    <Route path="/settings/system" element={<PL><SystemSettingsPage /></PL>} />
                    <Route path="/settings/performance" element={<PL><PerformanceDashboard /></PL>} />
                    <Route path="/settings/configuration" element={<PL><SystemConfiguration /></PL>} />

                    {/* Admin */}
                    <Route path="/users" element={<PL><Users /></PL>} />
                    <Route path="/multi-branch" element={<PL><MultiBranchManagement /></PL>} />
                    <Route path="/multi-branch/dashboard" element={<PL><MultiBranchDashboard /></PL>} />
                    <Route path="/branch/transfers" element={<PL><InterBranchTransfer /></PL>} />
                    <Route path="/import" element={<PL><ImportPage /></PL>} />
                    <Route path="/audit-logs" element={<PL><AuditLogsPage /></PL>} />

                    {/* Other Modules */}
                    <Route path="/services" element={<PL><ServiceModule /></PL>} />
                    <Route path="/hrm" element={<PL><HRMModule /></PL>} />
                    <Route path="/crm" element={<PL><CRMModule /></PL>} />
                    <Route path="/messages" element={<PL><InternalMessages /></PL>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </AppWithShortcuts>
            </LanguageProvider>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
