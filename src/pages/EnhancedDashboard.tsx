import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Package, Users, TrendingUp, AlertTriangle, DollarSign, Calendar, Pill, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { apiClient } from "@/integrations/api/client";

export default function EnhancedDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    todaySales: 0,
    todayRevenue: 0
  });

  const [systemHealth, setSystemHealth] = useState({
    backend: false,
    database: false,
    redis: false,
    lastCheck: new Date()
  });

  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Auto-refresh every 30 seconds
    const dataInterval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const handleManualRefresh = () => {
    loadDashboardData();
  };

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      // Load real-time dashboard stats
      try {
        const realtimeData = await apiClient.getRealtimeDashboard();
        setStats({
          ...stats,
          todaySales: realtimeData.today_transactions || 0,
          todayRevenue: realtimeData.today_sales || 0,
          lowStockProducts: realtimeData.low_stock_count || 0,
          totalCustomers: realtimeData.today_customers || 0,
          totalRevenue: realtimeData.month_sales || 0
        });
      } catch (error) {
        console.error("Error loading realtime stats:", error);
      }

      // Load top products today
      try {
        const topProductsData = await apiClient.getTopProductsToday();
        setTopProducts(topProductsData.products || []);
      } catch (error) {
        console.error("Error loading top products:", error);
      }

      // Load hourly sales
      try {
        const hourlyData = await apiClient.getHourlySales();
        setHourlyData(hourlyData.hourly_data || []);
      } catch (error) {
        console.error("Error loading hourly sales:", error);
      }
      
      // Check system health
      try {
        const healthData = await apiClient.healthCheck();
        setSystemHealth({
          backend: healthData.status === "OK",
          database: healthData.database === "Connected",
          redis: true,
          lastCheck: new Date()
        });
      } catch (error) {
        setSystemHealth({
          backend: false,
          database: false,
          redis: false,
          lastCheck: new Date()
        });
      }

      // Load stats
      const statsData = await apiClient.getDashboardStats();
      setStats(prevStats => ({
        ...prevStats,
        totalProducts: statsData.totalProducts || 0,
        totalSales: statsData.totalSales || 0,
        totalCustomers: statsData.totalCustomers || 0,
        lowStockProducts: statsData.lowStockProducts || 0
      }));

      // Load recent sales
      const salesResponse = await fetch(`${API_CONFIG.API_ROOT}/sales`, {
        headers: getAuthHeaders()
      });
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        setRecentSales(salesData.slice(0, 5));
      }

      // Load expiry alerts
      try {
        const expiryResponse = await fetch(`${API_CONFIG.PHARMACY_BASE}/expiry-alerts?days=30`, {
          headers: getAuthHeaders()
        });
        if (expiryResponse.ok) {
          const expiryData = await expiryResponse.json();
          setExpiryAlerts(expiryData.slice(0, 5));
        }
      } catch (error) {
        console.log("Expiry alerts not available");
      }

      // Load pharmacy statistics
      try {
        const pharmaStatsResponse = await fetch(`${API_CONFIG.PHARMACY_BASE}/statistics/medicines`, {
          headers: getAuthHeaders()
        });
        if (pharmaStatsResponse.ok) {
          const pharmaStats = await pharmaStatsResponse.json();
          // Update stats with pharmacy data
          setStats(prev => ({
            ...prev,
            totalProducts: pharmaStats.total_medicines || prev.totalProducts,
            lowStockProducts: pharmaStats.low_stock_count || prev.lowStockProducts
          }));
        }
      } catch (error) {
        console.log("Pharmacy statistics not available");
      }

      // Load low stock items
      const productsResponse = await fetch(`${API_CONFIG.API_ROOT}/products`, {
        headers: getAuthHeaders()
      });
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const lowStockItems = productsData.filter(
          (p: any) => p.stock_quantity <= p.min_stock_level
        );
        setLowStock(lowStockItems.slice(0, 5));
      }
    } catch (error) {
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Big Real-Time Header with Auto-Refresh */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl mb-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        
        <div className="relative z-10">
          {/* Top Row: Title and Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">
                  Dashboard Overview
                </h1>
                <p className="text-white/90 text-base">
                  Real-time pharmacy statistics and updates
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Real-Time Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Link to="/inventory" className="block">
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg hover:bg-white/25 hover:shadow-xl transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-5 w-5 text-white/80" />
                  <span className="text-xs text-white/70 font-medium">PRODUCTS</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalProducts}</div>
                <div className="text-xs text-white/70">Total Items</div>
              </div>
            </Link>

            <Link to="/sales/history" className="block">
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg hover:bg-white/25 hover:shadow-xl transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="h-5 w-5 text-white/80" />
                  <span className="text-xs text-white/70 font-medium">SALES</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalSales}</div>
                <div className="text-xs text-white/70">Total Transactions</div>
              </div>
            </Link>

            <Link to="/customers" className="block">
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg hover:bg-white/25 hover:shadow-xl transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-white/80" />
                  <span className="text-xs text-white/70 font-medium">CUSTOMERS</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalCustomers}</div>
                <div className="text-xs text-white/70">Registered</div>
              </div>
            </Link>

            <Link to="/inventory/low-stock" className="block">
              <div className="bg-red-500/30 backdrop-blur-md rounded-xl p-4 border border-red-300/30 shadow-lg hover:bg-red-500/40 hover:shadow-xl transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="h-5 w-5 text-white/90" />
                  <span className="text-xs text-white/70 font-medium">ALERTS</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.lowStockProducts}</div>
                <div className="text-xs text-white/70">Low Stock Items</div>
              </div>
            </Link>
          </div>

          {/* Bottom Row: Time and Status */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-white/20">
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                <span className="text-sm font-medium">
                  {isRefreshing ? 'Auto-refreshing...' : 'Live'}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Time:</span>{' '}
                {format(currentTime, "HH:mm:ss")}
              </div>
              <div className="text-sm hidden md:block">
                <span className="font-medium">Date:</span>{' '}
                {format(currentTime, "EEEE, MMMM d, yyyy")}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-white/80 text-sm">
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Last updated: {format(lastUpdated, "HH:mm:ss")}</span>
              <span className="text-white/60 hidden md:inline">•</span>
              <span className="hidden md:inline">Auto-refresh: Every 30s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="pharmacy-card bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link to="/sales" className="block">
              <Button className="w-full h-auto flex flex-col gap-2 p-4 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white border-2 border-teal-500/30 shadow-md hover:shadow-lg transition-all">
                <ShoppingCart className="w-6 h-6" />
                <span className="text-sm font-medium">New Sale</span>
              </Button>
            </Link>
            <Link to="/purchase" className="block">
              <Button className="w-full h-auto flex flex-col gap-2 p-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-2 border-blue-500/30 shadow-md hover:shadow-lg transition-all">
                <Package className="w-6 h-6" />
                <span className="text-sm font-medium">New Purchase</span>
              </Button>
            </Link>
            <Link to="/customers" className="block">
              <Button className="w-full h-auto flex flex-col gap-2 p-4 bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-2 border-slate-500/30 shadow-md hover:shadow-lg transition-all">
                <Users className="w-6 h-6" />
                <span className="text-sm font-medium">Customers</span>
              </Button>
            </Link>
            <Link to="/reports/sales" className="block">
              <Button className="w-full h-auto flex flex-col gap-2 p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-2 border-emerald-500/30 shadow-md hover:shadow-lg transition-all">
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm font-medium">Reports</span>
              </Button>
            </Link>
            <Link to="/inventory" className="block">
              <Button className="w-full h-auto flex flex-col gap-2 p-4 bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white border-2 border-cyan-500/30 shadow-md hover:shadow-lg transition-all">
                <Package className="w-6 h-6" />
                <span className="text-sm font-medium">Inventory</span>
              </Button>
            </Link>
            <Link to="/medicine-management" className="block">
              <Button className="w-full h-auto flex flex-col gap-2 p-4 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white border-2 border-indigo-500/30 shadow-md hover:shadow-lg transition-all">
                <Pill className="w-6 h-6" />
                <span className="text-sm font-medium">Medicines</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="pharmacy-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Sales</CardTitle>
              <Link to="/sales/history">
                <Button variant="link" className="text-primary">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sales yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg glass-subtle">
                    <div>
                      <div className="font-medium">{sale.customer_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(sale.created_at), "dd MMM yyyy HH:mm")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">${sale.net_amount.toFixed(2)}</div>
                      <Badge variant={sale.payment_status === "completed" ? "default" : "secondary"} className="pharmacy-badge text-xs">
                        {sale.payment_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products Today */}
        {topProducts.length > 0 && (
          <Card className="pharmacy-card border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <TrendingUp className="h-5 w-5" />
                Top Selling Products Today
              </CardTitle>
              <CardDescription>Best performers of the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topProducts.slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-green-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">SKU: {item.sku} • Stock: {item.current_stock}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-700">${item.revenue?.toFixed(2) || '0.00'}</p>
                      <p className="text-xs text-gray-600">{item.quantity_sold} units • {item.order_count} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiry Alerts */}
        <Card className="pharmacy-card border-red-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Expiry Alerts
              </CardTitle>
              <Link to="/medicine-management/expiry-alerts">
                <Button variant="link" className="text-primary">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : expiryAlerts.length === 0 ? (
              <div className="text-center py-8 text-green-600">
                ✓ No medicines expiring soon
              </div>
            ) : (
              <div className="space-y-3">
                {expiryAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                    <div>
                      <div className="font-medium">{alert.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Batch: {alert.batch_number} | Exp: {format(new Date(alert.expiry_date), "dd MMM yyyy")}
                      </div>
                    </div>
                    <Badge variant="destructive">
                      {alert.days_to_expiry < 0 ? "Expired" : `${alert.days_to_expiry}d left`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="pharmacy-card border-orange-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Low Stock Alerts
              </CardTitle>
              <Link to="/inventory/low-stock">
                <Button variant="link" className="text-primary">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : lowStock.length === 0 ? (
              <div className="text-center py-8 text-green-600">
                ✓ All items adequately stocked
              </div>
            ) : (
              <div className="space-y-3">
                {lowStock.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {product.sku}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600">{product.stock_quantity} left</div>
                      <div className="text-xs text-muted-foreground">Min: {product.min_stock_level}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="pharmacy-card bg-gradient-to-br from-card to-green-50 dark:to-green-950/20 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Today's Performance
            </CardTitle>
            <CardDescription>{format(new Date(), "EEEE, dd MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500 shadow-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-base">Sales Today</div>
                    <div className="text-sm text-muted-foreground">{stats.todaySales || 0} transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-2xl text-green-600">${(stats.todayRevenue || 0).toFixed(2)}</div>
                  <div className="text-xs text-green-600/70">Revenue</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500 shadow-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-base">Total Revenue</div>
                    <div className="text-sm text-muted-foreground">All time</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-2xl text-blue-600">${(stats.totalRevenue || 0).toFixed(2)}</div>
                  <div className="text-xs text-blue-600/70">Accumulated</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalCustomers}</div>
                  <div className="text-xs text-muted-foreground mt-1">Customers</div>
                </div>
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 text-center">
                  <div className="text-2xl font-bold text-teal-600">{stats.totalProducts}</div>
                  <div className="text-xs text-muted-foreground mt-1">Products</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="pharmacy-card bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-50 dark:from-teal-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${systemHealth.backend && systemHealth.database ? 'bg-green-500' : 'bg-red-500'}`} />
            System Status & Health
          </CardTitle>
          <CardDescription>
            {systemHealth.backend && systemHealth.database 
              ? "All systems operational" 
              : "System issues detected"}
            {" • Last checked: "}
            {format(systemHealth.lastCheck, "HH:mm:ss")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Database Status */}
            <div className={`text-center p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 border shadow-sm ${systemHealth.database ? 'border-green-200' : 'border-red-200'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${systemHealth.database ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <div className={`text-2xl font-bold ${systemHealth.database ? 'text-green-600' : 'text-red-600'}`}>
                  {systemHealth.database ? '✓' : '✗'}
                </div>
              </div>
              <div className="text-sm font-semibold">Database</div>
              <div className={`text-xs mt-1 ${systemHealth.database ? 'text-green-600' : 'text-red-600'}`}>
                {systemHealth.database ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            {/* Backend Status */}
            <div className={`text-center p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 border shadow-sm ${systemHealth.backend ? 'border-green-200' : 'border-red-200'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${systemHealth.backend ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <div className={`text-2xl font-bold ${systemHealth.backend ? 'text-green-600' : 'text-red-600'}`}>
                  {systemHealth.backend ? '✓' : '✗'}
                </div>
              </div>
              <div className="text-sm font-semibold">API Server</div>
              <div className={`text-xs mt-1 ${systemHealth.backend ? 'text-green-600' : 'text-red-600'}`}>
                {systemHealth.backend ? 'Running' : 'Offline'}
              </div>
            </div>

            {/* Redis Status */}
            <div className={`text-center p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 border shadow-sm ${systemHealth.redis ? 'border-green-200' : 'border-orange-200'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${systemHealth.redis ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                <div className={`text-2xl font-bold ${systemHealth.redis ? 'text-green-600' : 'text-orange-600'}`}>
                  {systemHealth.redis ? '✓' : '⚠'}
                </div>
              </div>
              <div className="text-sm font-semibold">Cache (Redis)</div>
              <div className={`text-xs mt-1 ${systemHealth.redis ? 'text-green-600' : 'text-orange-600'}`}>
                {systemHealth.redis ? 'Active' : 'Inactive'}
              </div>
            </div>

            {/* Data Status */}
            <div className="text-center p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-blue-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                <div className="text-xl font-bold text-blue-600">{stats.totalProducts}</div>
              </div>
              <div className="text-sm font-semibold">Products</div>
              <div className="text-xs text-blue-600 mt-1">In System</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



