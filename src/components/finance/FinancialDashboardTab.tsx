import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, ArrowUpCircle, ArrowDownCircle, Calendar, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

interface FinancialDashboardData {
  cashInHand: number;
  bankBalance: number;
  totalReceivables: number;
  totalPayables: number;
  todayRevenue: number;
  todayExpenses: number;
  weekRevenue: number;
  monthRevenue: number;
  profitMargin: number;
}

export default function FinancialDashboardTab() {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<FinancialDashboardData>({
    cashInHand: 0,
    bankBalance: 0,
    totalReceivables: 0,
    totalPayables: 0,
    todayRevenue: 0,
    todayExpenses: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    profitMargin: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      // Load sales data
      const salesRes = await fetch(`${API_CONFIG.BASE_URL}/sales`, {
        headers: getAuthHeaders()
      });

      // Load manufacturer payables
      const mfrRes = await fetch(`${API_CONFIG.PHARMACY_BASE}/manufacturers`, {
        headers: getAuthHeaders()
      });

      let data = { ...dashboardData };

      if (salesRes.ok) {
        const sales = await salesRes.json();
        
        // Today's revenue
        data.todayRevenue = sales
          .filter((s: any) => format(new Date(s.created_at), "yyyy-MM-dd") === today)
          .reduce((sum: number, s: any) => sum + parseFloat(s.net_amount || 0), 0);

        // Week revenue
        data.weekRevenue = sales
          .filter((s: any) => format(new Date(s.created_at), "yyyy-MM-dd") >= weekAgo)
          .reduce((sum: number, s: any) => sum + parseFloat(s.net_amount || 0), 0);

        // Month revenue
        data.monthRevenue = sales
          .filter((s: any) => format(new Date(s.created_at), "yyyy-MM-dd") >= monthAgo)
          .reduce((sum: number, s: any) => sum + parseFloat(s.net_amount || 0), 0);

        // Receivables
        data.totalReceivables = sales
          .filter((s: any) => s.payment_status !== "completed")
          .reduce((sum: number, s: any) => sum + parseFloat(s.net_amount || 0), 0);

        // Cash in hand (cash sales today)
        data.cashInHand = sales
          .filter((s: any) => 
            format(new Date(s.created_at), "yyyy-MM-dd") === today && 
            s.payment_method === "cash"
          )
          .reduce((sum: number, s: any) => sum + parseFloat(s.net_amount || 0), 0);

        // Estimate profit margin
        const totalCost = data.monthRevenue * 0.6; // 60% cost estimate
        data.profitMargin = data.monthRevenue > 0 ? ((data.monthRevenue - totalCost) / data.monthRevenue * 100) : 0;
      }

      if (mfrRes.ok) {
        const manufacturers = await mfrRes.json();
        data.totalPayables = manufacturers.reduce((sum: number, m: any) => 
          sum + parseFloat(m.current_balance || 0), 0);
      }

      setDashboardData(data);
    } catch (error) {
      toast.error("Error loading dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const workingCapital = dashboardData.cashInHand + dashboardData.bankBalance + dashboardData.totalReceivables - dashboardData.totalPayables;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading financial dashboard...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Cash in Hand</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      ${dashboardData.cashInHand.toFixed(2)}
                    </p>
                  </div>
                  <Wallet className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Bank Balance</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      ${dashboardData.bankBalance.toFixed(2)}
                    </p>
                  </div>
                  <CreditCard className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Receivables</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      ${dashboardData.totalReceivables.toFixed(2)}
                    </p>
                  </div>
                  <ArrowUpCircle className="w-12 h-12 text-orange-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Payables</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      ${dashboardData.totalPayables.toFixed(2)}
                    </p>
                  </div>
                  <ArrowDownCircle className="w-12 h-12 text-red-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Today's Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      ${dashboardData.todayRevenue.toFixed(2)}
                    </p>
                  </div>
                  <Calendar className="w-10 h-10 text-emerald-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-teal-200 bg-teal-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">This Week</p>
                    <p className="text-2xl font-bold text-teal-600 mt-1">
                      ${dashboardData.weekRevenue.toFixed(2)}
                    </p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-teal-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-cyan-200 bg-cyan-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">This Month</p>
                    <p className="text-2xl font-bold text-cyan-600 mt-1">
                      ${dashboardData.monthRevenue.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-cyan-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Working Capital & Profit Margin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardHeader>
                <CardTitle className="text-lg">Working Capital</CardTitle>
                <CardDescription>Available funds for operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-indigo-600">
                    ${workingCapital.toFixed(2)}
                  </div>
                  <div className={`text-sm ${workingCapital >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {workingCapital >= 0 ? 'Positive' : 'Negative'}
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cash + Bank:</span>
                    <span className="font-medium">${(dashboardData.cashInHand + dashboardData.bankBalance).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receivables:</span>
                    <span className="font-medium text-green-600">+${dashboardData.totalReceivables.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payables:</span>
                    <span className="font-medium text-red-600">-${dashboardData.totalPayables.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="text-lg">Profit Margin</CardTitle>
                <CardDescription>Estimated gross profit (30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-purple-600">
                    {dashboardData.profitMargin.toFixed(1)}%
                  </div>
                  <div className={`text-sm ${dashboardData.profitMargin >= 30 ? 'text-green-600' : 'text-orange-600'}`}>
                    {dashboardData.profitMargin >= 30 ? 'Healthy' : 'Monitor'}
                  </div>
                </div>
                <Progress value={dashboardData.profitMargin} className="h-3 mb-4" />
                <div className="text-sm text-muted-foreground">
                  Revenue: ${dashboardData.monthRevenue.toFixed(2)} | 
                  Est. Profit: ${(dashboardData.monthRevenue * dashboardData.profitMargin / 100).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Info */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• <strong>Cash in Hand:</strong> Today's cash sales and collections</p>
              <p>• <strong>Receivables:</strong> Pending customer payments from credit sales</p>
              <p>• <strong>Payables:</strong> Outstanding balances to manufacturers/suppliers</p>
              <p>• <strong>Working Capital:</strong> Net funds available after accounting for dues</p>
              <p className="pt-2 border-t">
                <strong>Note:</strong> Use the tabs above to manage collections, vouchers, receivables, and payables.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}



