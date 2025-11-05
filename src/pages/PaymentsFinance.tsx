import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, BarChart3, CreditCard, FileText, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import FinancialDashboardTab from '@/components/finance/FinancialDashboardTab';
import PaymentCollectionTab from '@/components/finance/PaymentCollectionTab';
import VouchersTab from '@/components/finance/VouchersTab';
import AccountsReceivableTab from '@/components/finance/AccountsReceivableTab';
import AccountsPayableTab from '@/components/finance/AccountsPayableTab';
import CashFlowTab from '@/components/finance/CashFlowTab';

const PaymentsFinance = () => {
  const location = useLocation();

  // Determine which tab to show based on the route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/payments/collection')) return 'collection';
    if (path.includes('/payments/vouchers')) return 'vouchers';
    if (path.includes('/payments/receivables')) return 'receivables';
    if (path.includes('/payments/payables')) return 'payables';
    if (path.includes('/payments/cashflow')) return 'cashflow';
    return 'dashboard'; // Default to dashboard
  };

  const activeTab = getActiveTab();

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 p-8 rounded-2xl border-2 border-emerald-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Payments & Finance</h1>
              <p className="text-white/90 text-base">Complete financial management and accounting</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Finance Modules */}
      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid bg-white shadow-md">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="collection" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden lg:inline">Collections</span>
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden lg:inline">Vouchers</span>
          </TabsTrigger>
          <TabsTrigger value="receivables" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden lg:inline">Receivables</span>
          </TabsTrigger>
          <TabsTrigger value="payables" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden lg:inline">Payables</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden lg:inline">Cash Flow</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <FinancialDashboardTab />
        </TabsContent>

        <TabsContent value="collection" className="space-y-4">
          <PaymentCollectionTab />
        </TabsContent>

        <TabsContent value="vouchers" className="space-y-4">
          <VouchersTab />
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <AccountsReceivableTab />
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <AccountsPayableTab />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <CashFlowTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsFinance;
