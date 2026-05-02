import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, BarChart3, DollarSign, Package,
  Users, ShoppingCart, Download, RefreshCw, FileText,
  ArrowUpRight, ArrowDownRight, Zap, Target, Activity,
  ShoppingBag,
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

// ─── Colour palette ──────────────────────────────────────────────────────────
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtK = (n: number) => (n >= 1000 ? `৳${(n / 1000).toFixed(1)}k` : `৳${n.toFixed(0)}`);

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CurrencyTooltip = ({ active, payload, label }: {active?: boolean; payload?: {name:string;value:number;color:string}[]; label?: string}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, trend, color = "blue" }: {
  title: string; value: string; sub: string;
  icon: React.ElementType; trend?: number; color?: string;
}) {
  const colors: Record<string, string> = {
    blue: "from-blue-500 to-blue-600", green: "from-emerald-500 to-green-600",
    amber: "from-amber-500 to-orange-500", purple: "from-purple-500 to-violet-600",
    teal: "from-teal-500 to-cyan-600", red: "from-red-500 to-rose-600",
  };
  return (
    <Card className="pharmacy-card overflow-hidden">
      <CardContent className="p-0">
        <div className={`bg-gradient-to-br ${colors[color] || colors.blue} p-4 text-white`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-white/70 font-medium uppercase tracking-wide">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              <p className="text-xs text-white/80 mt-1">{sub}</p>
            </div>
            <div className="p-2 bg-white/20 rounded-xl">
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-200" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-200" />
              )}
              <span className={`text-xs font-medium ${trend >= 0 ? "text-green-200" : "text-red-200"}`}>
                {Math.abs(trend).toFixed(1)}% vs last month
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BiDashboard() {
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [stats, setStats] = useState<Record<string, number>>({});
  const [salesTrend, setSalesTrend] = useState<{ date: string; revenue: number; transactions: number }[]>([]);
  const [paymentMix, setPaymentMix] = useState<{ name: string; value: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; revenue: number; qty: number }[]>([]);
  const [plData, setPlData] = useState<Record<string, number>>({});
  const [inventoryTurnover, setInventoryTurnover] = useState<{ name: string; turnover: number; stock: number }[]>([]);
  const [supplierSpend, setSupplierSpend] = useState<{ name: string; amount: number }[]>([]);
  const [customerLTV, setCustomerLTV] = useState<{ name: string; ltv: number; visits: number }[]>([]);
  const [cashflow, setCashflow] = useState<{ month: string; inflow: number; outflow: number; net: number }[]>([]);

  useEffect(() => {
    loadAll();
  }, [period]);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadSalesTrend(),
        loadTopProducts(),
        loadPL(),
        loadInventoryTurnover(),
        loadSupplierSpend(),
        loadCustomerLTV(),
        loadCashflow(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  // ── Data loaders ─────────────────────────────────────────────────────────

  const loadStats = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/dashboard/realtime-stats`, { headers: getAuthHeaders() });
      if (r.ok) {
        const d = await r.json();
        setStats(d);
      }
    } catch (e) { logger.error("stats", e); }
  };

  const loadSalesTrend = async () => {
    try {
      const days = parseInt(period);
      const from = format(subDays(new Date(), days), "yyyy-MM-dd");
      const to = format(new Date(), "yyyy-MM-dd");
      const r = await fetch(`${API_CONFIG.API_ROOT}/sales?from=${from}&to=${to}`, { headers: getAuthHeaders() });
      if (r.ok) {
        const sales: { created_at: string; net_amount: number; payment_method: string }[] = await r.json();

        // Build daily trend
        const byDay: Record<string, { revenue: number; transactions: number }> = {};
        const payMix: Record<string, number> = {};
        for (const s of sales) {
          const day = format(new Date(s.created_at), "MMM dd");
          if (!byDay[day]) byDay[day] = { revenue: 0, transactions: 0 };
          byDay[day].revenue += s.net_amount;
          byDay[day].transactions += 1;
          payMix[s.payment_method] = (payMix[s.payment_method] || 0) + s.net_amount;
        }

        const trendArr = Object.entries(byDay)
          .map(([date, v]) => ({ date, ...v }))
          .slice(-Math.min(30, days));
        setSalesTrend(trendArr);

        setPaymentMix(
          Object.entries(payMix).map(([name, value]) => ({ name: name || "cash", value }))
        );
      }
    } catch (e) { logger.error("trend", e); }
  };

  const loadTopProducts = async () => {
    try {
      const days = parseInt(period);
      const from = format(subDays(new Date(), days), "yyyy-MM-dd");
      const r = await fetch(`${API_CONFIG.API_ROOT}/products/sales-analytics?start_date=${from}`, { headers: getAuthHeaders() });
      if (r.ok) {
        const data: { name: string; total_revenue?: number; total_sold?: number; avg_daily_sales?: number }[] = await r.json();
        const sorted = data
          .filter(p => (p.total_revenue || 0) > 0)
          .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
          .slice(0, 10)
          .map(p => ({ name: p.name.length > 20 ? p.name.substring(0, 20) + "…" : p.name, revenue: p.total_revenue || 0, qty: p.total_sold || 0 }));
        setTopProducts(sorted);
      }
    } catch (e) { logger.error("topProducts", e); }
  };

  const loadPL = async () => {
    try {
      const days = parseInt(period);
      const from = format(subDays(new Date(), days), "yyyy-MM-dd");
      const r = await fetch(`${API_CONFIG.API_ROOT}/reports/profit-loss?from=${from}`, { headers: getAuthHeaders() });
      if (r.ok) setPlData(await r.json());
    } catch (e) { logger.error("pl", e); }
  };

  const loadInventoryTurnover = async () => {
    try {
      const days = parseInt(period);
      const from = format(subDays(new Date(), days), "yyyy-MM-dd");
      const r = await fetch(`${API_CONFIG.API_ROOT}/products/sales-analytics?start_date=${from}`, { headers: getAuthHeaders() });
      if (r.ok) {
        const data: { name: string; avg_daily_sales?: number; days_of_supply?: number; stock_quantity?: number }[] = await r.json();
        const top = data
          .filter(p => (p.avg_daily_sales || 0) > 0)
          .sort((a, b) => (b.avg_daily_sales || 0) - (a.avg_daily_sales || 0))
          .slice(0, 10)
          .map(p => ({
            name: p.name.length > 18 ? p.name.substring(0, 18) + "…" : p.name,
            turnover: parseFloat(((p.avg_daily_sales || 0) * 30).toFixed(1)),
            stock: p.stock_quantity || 0,
          }));
        setInventoryTurnover(top);
      }
    } catch (e) { logger.error("inventory", e); }
  };

  const loadSupplierSpend = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/purchases`, { headers: getAuthHeaders() });
      if (r.ok) {
        const data: { supplier_name?: string; total_amount?: number }[] = await r.json();
        const bySupplier: Record<string, number> = {};
        for (const p of data) {
          const s = p.supplier_name || "Unknown";
          bySupplier[s] = (bySupplier[s] || 0) + (p.total_amount || 0);
        }
        const sorted = Object.entries(bySupplier)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, amount]) => ({ name: name.length > 15 ? name.substring(0, 15) + "…" : name, amount }));
        setSupplierSpend(sorted);
      }
    } catch (e) { logger.error("supplier", e); }
  };

  const loadCustomerLTV = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/customers`, { headers: getAuthHeaders() });
      if (r.ok) {
        const customers: { name: string; total_purchases?: number; loyalty_points?: number }[] = await r.json();
        const top = customers
          .filter(c => (c.total_purchases || 0) > 0)
          .sort((a, b) => (b.total_purchases || 0) - (a.total_purchases || 0))
          .slice(0, 10)
          .map(c => ({
            name: c.name.length > 15 ? c.name.substring(0, 15) + "…" : c.name,
            ltv: c.total_purchases || 0,
            visits: c.loyalty_points || 0,
          }));
        setCustomerLTV(top);
      }
    } catch (e) { logger.error("ltv", e); }
  };

  const loadCashflow = async () => {
    // Build 6-month cashflow from P&L data trend
    try {
      const months: { month: string; inflow: number; outflow: number; net: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const from = format(startOfMonth(d), "yyyy-MM-dd");
        const to = format(endOfMonth(d), "yyyy-MM-dd");
        try {
          const r = await fetch(`${API_CONFIG.API_ROOT}/reports/profit-loss?from=${from}&to=${to}`, { headers: getAuthHeaders() });
          if (r.ok) {
            const pl = await r.json();
            months.push({
              month: format(d, "MMM yy"),
              inflow: pl.total_sales || 0,
              outflow: (pl.total_purchases || 0) + (pl.total_expenses || 0),
              net: (pl.total_sales || 0) - (pl.total_purchases || 0) - (pl.total_expenses || 0),
            });
          } else {
            months.push({ month: format(d, "MMM yy"), inflow: 0, outflow: 0, net: 0 });
          }
        } catch {
          months.push({ month: format(d, "MMM yy"), inflow: 0, outflow: 0, net: 0 });
        }
      }
      setCashflow(months);
    } catch (e) { logger.error("cashflow", e); }
  };

  // ── D7: PDF Export ────────────────────────────────────────────────────────

  const exportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Title
      doc.setFontSize(18);
      doc.setTextColor(16, 185, 129);
      doc.text("Pharmazine — BI Report", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")} | Period: last ${period} days`, 14, 28);

      // KPI summary
      doc.setFontSize(13);
      doc.setTextColor(30);
      doc.text("Key Performance Indicators", 14, 38);
      autoTable(doc, {
        startY: 42,
        head: [["Metric", "Value"]],
        body: [
          ["Total Sales", fmt(stats.today_sales || 0)],
          ["Month Sales", fmt(stats.month_sales || 0)],
          ["Customers", String(stats.today_customers || 0)],
          ["Gross Profit", fmt(plData.gross_profit || 0)],
          ["Net Profit", fmt(plData.net_profit || 0)],
          ["Gross Margin", `${((plData.gross_margin || 0) * 100).toFixed(1)}%`],
        ],
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129] },
      });

      // Top Products
      const afterKPI = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
      doc.setFontSize(13);
      doc.text("Top Products by Revenue", 14, afterKPI);
      autoTable(doc, {
        startY: afterKPI + 4,
        head: [["Product", "Revenue (৳)", "Qty Sold"]],
        body: topProducts.slice(0, 10).map(p => [p.name, fmt(p.revenue), String(p.qty)]),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Cashflow
      const afterProd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
      doc.setFontSize(13);
      doc.text("6-Month Cashflow", 14, afterProd);
      autoTable(doc, {
        startY: afterProd + 4,
        head: [["Month", "Inflow (৳)", "Outflow (৳)", "Net (৳)"]],
        body: cashflow.map(c => [c.month, fmt(c.inflow), fmt(c.outflow), fmt(c.net)]),
        theme: "striped",
        headStyles: { fillColor: [139, 92, 246] },
      });

      doc.save(`bi-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF exported successfully");
    } catch (e) {
      logger.error("PDF export", e);
      toast.error("PDF export failed");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 rounded-2xl border-2 border-purple-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">BI Analytics Dashboard</h1>
              <p className="text-white/90 text-sm mt-1">
                Revenue trends · P&L · Inventory turnover · Customer LTV · Cashflow
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36 bg-white/20 text-white border-white/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last 1 year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={refresh}
              disabled={refreshing}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={exportPDF}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Today Sales" value={fmt(stats.today_sales || 0)} sub="Today's revenue" icon={DollarSign} color="green" trend={stats.sales_trend_pct} />
        <KpiCard title="Month Sales" value={fmtK(stats.month_sales || 0)} sub="This month" icon={TrendingUp} color="blue" />
        <KpiCard title="Gross Profit" value={fmt(plData.gross_profit || 0)} sub={`Margin: ${((plData.gross_margin || 0) * 100).toFixed(1)}%`} icon={Target} color="purple" />
        <KpiCard title="Net Profit" value={fmt(plData.net_profit || 0)} sub="After expenses" icon={Activity} color="teal" />
        <KpiCard title="Customers" value={String(stats.today_customers || 0)} sub="Unique today" icon={Users} color="amber" />
        <KpiCard title="Week Sales" value={fmtK(stats.week_sales || 0)} sub="Last 7 days" icon={Zap} color="red" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pl">P&L</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
        </TabsList>

        {/* ── Tab: Overview ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue trend */}
            <Card className="pharmacy-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Daily Revenue Trend
                </CardTitle>
                <CardDescription>Revenue and transaction volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…
                  </div>
                ) : salesTrend.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={salesTrend}>
                      <defs>
                        <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CurrencyTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Payment mix */}
            <Card className="pharmacy-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Payment Mix
                </CardTitle>
                <CardDescription>Revenue by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                {loading || paymentMix.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : "No data"}
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={paymentMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                          {paymentMix.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {paymentMix.map((p, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="capitalize">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top products */}
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                Top 10 Products by Revenue
              </CardTitle>
              <CardDescription>Best-selling products in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || topProducts.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : "No data"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                      {topProducts.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: P&L ──────────────────────────────────────────────────── */}
        <TabsContent value="pl" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Total Sales", key: "total_sales", color: "bg-green-50 border-green-200", textColor: "text-green-700", icon: TrendingUp },
              { label: "COGS", key: "cogs", color: "bg-red-50 border-red-200", textColor: "text-red-700", icon: TrendingDown },
              { label: "Gross Profit", key: "gross_profit", color: "bg-blue-50 border-blue-200", textColor: "text-blue-700", icon: DollarSign },
              { label: "Gross Margin %", key: "gross_margin", color: "bg-purple-50 border-purple-200", textColor: "text-purple-700", icon: Target, isPercent: true },
              { label: "Total Expenses", key: "total_expenses", color: "bg-amber-50 border-amber-200", textColor: "text-amber-700", icon: FileText },
              { label: "Net Profit", key: "net_profit", color: "bg-teal-50 border-teal-200", textColor: "text-teal-700", icon: Activity },
            ].map((item) => (
              <Card key={item.key} className={`pharmacy-card border ${item.color}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${item.textColor}`}>
                        {loading ? "—" : (item as {isPercent?: boolean}).isPercent
                          ? `${((plData[item.key] || 0) * 100).toFixed(1)}%`
                          : fmt(plData[item.key] || 0)}
                      </p>
                    </div>
                    <item.icon className={`w-8 h-8 ${item.textColor} opacity-40`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>P&L Breakdown</CardTitle>
              <CardDescription>Visual profit & loss breakdown for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: "Sales", value: plData.total_sales || 0 },
                  { name: "COGS", value: plData.cogs || 0 },
                  { name: "Gross Profit", value: plData.gross_profit || 0 },
                  { name: "Expenses", value: plData.total_expenses || 0 },
                  { name: "Net Profit", value: plData.net_profit || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={fmtK} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
                    {[COLORS[0], COLORS[3], COLORS[1], COLORS[2], COLORS[4]].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Inventory ────────────────────────────────────────────── */}
        <TabsContent value="inventory">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Inventory Turnover — Top 10 Fast Movers
              </CardTitle>
              <CardDescription>Monthly units moved for the top-selling products</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || inventoryTurnover.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : "No data — check your date range"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={inventoryTurnover} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: "Units/month", position: "insideBottom", offset: -5 }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="turnover" name="Monthly turnover (units)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="stock" name="Current stock" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Suppliers ────────────────────────────────────────────── */}
        <TabsContent value="suppliers">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                Supplier Spend Analysis
              </CardTitle>
              <CardDescription>Total purchase amount by supplier</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || supplierSpend.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : "No supplier data found"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={supplierSpend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Bar dataKey="amount" name="Spend" radius={[4, 4, 0, 0]}>
                      {supplierSpend.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Customers (LTV) ──────────────────────────────────────── */}
        <TabsContent value="customers">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                Customer Lifetime Value — Top 10
              </CardTitle>
              <CardDescription>Cumulative purchase value per customer</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || customerLTV.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : "No customer data"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={customerLTV} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend />
                    <Bar dataKey="ltv" name="Total Purchases" radius={[0, 4, 4, 0]}>
                      {customerLTV.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Cashflow ─────────────────────────────────────────────── */}
        <TabsContent value="cashflow">
          <div className="space-y-4">
            <Card className="pharmacy-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  6-Month Cashflow Forecast
                </CardTitle>
                <CardDescription>Inflow vs outflow with net cash position</CardDescription>
              </CardHeader>
              <CardContent>
                {loading || cashflow.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : "No data"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cashflow}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CurrencyTooltip />} />
                      <Legend />
                      <Bar dataKey="inflow" name="Inflow (Sales)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outflow" name="Outflow (Purchases+Exp)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="pharmacy-card">
              <CardHeader>
                <CardTitle>Net Cash Position</CardTitle>
              </CardHeader>
              <CardContent>
                {cashflow.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={cashflow}>
                      <defs>
                        <linearGradient id="net" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CurrencyTooltip />} />
                      <Area type="monotone" dataKey="net" name="Net Cash" stroke="#8b5cf6" fill="url(#net)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              {cashflow.slice(-1).map((m) => (
                <>
                  <Card className="pharmacy-card" key="inflow">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Last Month Inflow</p>
                      <p className="text-xl font-bold text-green-600">{fmt(m.inflow)}</p>
                    </CardContent>
                  </Card>
                  <Card className="pharmacy-card" key="outflow">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Last Month Outflow</p>
                      <p className="text-xl font-bold text-red-600">{fmt(m.outflow)}</p>
                    </CardContent>
                  </Card>
                  <Card className="pharmacy-card" key="net">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Net Cash Position</p>
                      <p className={`text-xl font-bold ${m.net >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(m.net)}</p>
                    </CardContent>
                  </Card>
                </>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

