import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpCircle, ArrowDownCircle, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface CashFlowData {
  date: string;
  cashIn: number;
  cashOut: number;
  netFlow: number;
}

interface CashFlowSummary {
  openingBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  closingBalance: number;
  netCashFlow: number;
}

export default function CashFlowTab() {
  const [loading, setLoading] = useState(false);
  const [cashFlow, setCashFlow] = useState<CashFlowData[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary>({
    openingBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    closingBalance: 0,
    netCashFlow: 0
  });

  useEffect(() => {
    loadCashFlowData();
  }, []);

  const loadCashFlowData = async () => {
    setLoading(true);
    try {
      // Load sales (cash inflow)
      const salesRes = await fetch(`${API_CONFIG.API_ROOT}/sales`, {
        headers: getAuthHeaders()
      });

      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      if (salesRes.ok) {
        const sales = await salesRes.json();
        
        // Group by date
        const dailyFlow: { [date: string]: { cashIn: number; cashOut: number } } = {};
        
        sales.forEach((sale: any) => {
          const saleDate = format(new Date(sale.created_at), "yyyy-MM-dd");
          if (saleDate >= monthStart && saleDate <= monthEnd) {
            if (!dailyFlow[saleDate]) {
              dailyFlow[saleDate] = { cashIn: 0, cashOut: 0 };
            }
            dailyFlow[saleDate].cashIn += parseFloat(sale.net_amount || 0);
          }
        });

        const flowData = Object.entries(dailyFlow)
          .map(([date, flow]) => ({
            date,
            cashIn: flow.cashIn,
            cashOut: flow.cashOut,
            netFlow: flow.cashIn - flow.cashOut
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setCashFlow(flowData);

        const totalIn = flowData.reduce((sum, d) => sum + d.cashIn, 0);
        const totalOut = flowData.reduce((sum, d) => sum + d.cashOut, 0);

        setSummary({
          openingBalance: 0,
          totalCashIn: totalIn,
          totalCashOut: totalOut,
          closingBalance: totalIn - totalOut,
          netCashFlow: totalIn - totalOut
        });
      }
    } catch (error) {
      toast.error("Error loading cash flow data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const maxFlow = cashFlow.length > 0 ? Math.max(...cashFlow.map(d => Math.max(d.cashIn, d.cashOut))) : 1;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading cash flow...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Cash In</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      ${summary.totalCashIn.toFixed(2)}
                    </p>
                  </div>
                  <ArrowUpCircle className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Cash Out</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      ${summary.totalCashOut.toFixed(2)}
                    </p>
                  </div>
                  <ArrowDownCircle className="w-12 h-12 text-red-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className={summary.netCashFlow >= 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Net Cash Flow</p>
                    <p className={`text-3xl font-bold mt-2 ${summary.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ${summary.netCashFlow.toFixed(2)}
                    </p>
                  </div>
                  <Activity className={`w-12 h-12 opacity-20 ${summary.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Closing Balance</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      ${summary.closingBalance.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Flow Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Daily Cash Flow (Current Month)
              </CardTitle>
              <CardDescription>Daily cash inflow and outflow analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlow.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No cash flow data available for the current month
                </div>
              ) : (
                <div className="space-y-3">
                  {cashFlow.map((day, idx) => (
                    <div key={idx} className="space-y-2 p-3 rounded-lg bg-muted/30">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{format(new Date(day.date), "dd MMM yyyy")}</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <ArrowUpCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">${day.cashIn.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ArrowDownCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 font-medium">${day.cashOut.toFixed(2)}</span>
                          </div>
                          <div className={`font-bold ${day.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Net: ${day.netFlow.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Progress 
                            value={maxFlow > 0 ? (day.cashIn / maxFlow * 100) : 0} 
                            className="h-2 bg-green-200"
                          />
                          <div className="text-xs text-muted-foreground mt-1">Cash In</div>
                        </div>
                        <div>
                          <Progress 
                            value={maxFlow > 0 ? (day.cashOut / maxFlow * 100) : 0} 
                            className="h-2 bg-red-200"
                          />
                          <div className="text-xs text-muted-foreground mt-1">Cash Out</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cash Flow Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Cash Flow Summary</CardTitle>
              <CardDescription>Period: {format(startOfMonth(new Date()), "dd MMM")} - {format(endOfMonth(new Date()), "dd MMM yyyy")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg border-b pb-3">
                  <span className="text-muted-foreground">Opening Balance:</span>
                  <span className="font-bold">${summary.openingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-green-600 border-b pb-3">
                  <span className="flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5" />
                    Total Cash Inflow:
                  </span>
                  <span className="font-bold text-xl">+${summary.totalCashIn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-red-600 border-b pb-3">
                  <span className="flex items-center gap-2">
                    <ArrowDownCircle className="w-5 h-5" />
                    Total Cash Outflow:
                  </span>
                  <span className="font-bold text-xl">-${summary.totalCashOut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold border-t-2 border-primary pt-4">
                  <span>Closing Balance:</span>
                  <span className={summary.closingBalance >= 0 ? "text-primary" : "text-red-600"}>
                    ${summary.closingBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

