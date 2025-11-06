import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FileText, Download, Printer, TrendingUp, Package, DollarSign, Calendar, BarChart3, PieChart, Users, ShoppingCart, CreditCard, Pill } from "lucide-react";
import MedicineReportsTab from "@/components/reports/MedicineReportsTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

export default function EnhancedReports() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial tab based on route
  const getInitialTab = () => {
    const path = location.pathname;
    // Map all report routes to tabs
    if (path === "/reports/medicine") return "medicine";
    if (path === "/reports/sales") return "sales";
    if (path === "/reports/stock" || path === "/reports/low-stock" || path === "/reports/stock-movement") return "stock";
    if (path === "/reports/financial" || path === "/reports/profit-loss") return "financial";
    if (path === "/reports/customer" || path === "/reports/customers") return "customer";
    if (path === "/reports/purchase" || path === "/reports/purchases") return "purchase";
    if (path === "/reports/inventory") return "stock"; // Inventory reports go to stock tab
    if (path === "/reports/category-analysis" || path === "/reports/trend-analysis") return "sales"; // Analysis reports go to sales tab
    return "medicine"; // default - start with medicine reports
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    to: format(endOfMonth(new Date()), "yyyy-MM-dd")
  });
  const [loading, setLoading] = useState(false);

  // Sales Report Data
  const [salesData, setSalesData] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    averageOrderValue: 0
  });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);

  // Stock Report Data
  const [stockData, setStockData] = useState<any[]>([]);
  const [stockStats, setStockStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    expiringSoon: 0
  });

  // Financial Report Data
  const [financialData, setFinancialData] = useState({
    totalSales: 0,
    cogs: 0,
    grossProfit: 0,
    expenses: 0,
    netProfit: 0
  });

  // Update tab when route changes
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname]);
  
  // Customer Report Data
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  });

  // Purchase Report Data
  const [purchaseData, setPurchaseData] = useState<any[]>([]);
  const [purchaseStats, setPurchaseStats] = useState({
    totalPurchases: 0,
    totalValue: 0,
    averagePurchase: 0,
    totalSuppliers: 0
  });

  // Expiry Alerts for Stock Report
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "sales") loadSalesReport();
    if (activeTab === "stock") {
      loadStockReport();
      loadExpiryAlerts();
    }
    if (activeTab === "financial") loadFinancialReport();
    if (activeTab === "customer") loadCustomerReport();
    if (activeTab === "purchase") loadPurchaseReport();
    // Medicine tab loads its own data internally
  }, [activeTab, dateRange]);


  const loadSalesReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/sales`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter((sale: any) => {
          const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
          return saleDate >= dateRange.from && saleDate <= dateRange.to;
        });
        
        setSalesData(filtered);
        
        // Calculate top customers
        const customerSales: { [key: string]: { name: string; total: number; count: number } } = {};
        filtered.forEach((sale: any) => {
          const customerName = sale.customer_name || "Walk-in";
          if (!customerSales[customerName]) {
            customerSales[customerName] = { name: customerName, total: 0, count: 0 };
          }
          customerSales[customerName].total += parseFloat(sale.net_amount || 0);
          customerSales[customerName].count += 1;
        });
        
        const topCustomersList = Object.values(customerSales)
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);
        setTopCustomers(topCustomersList);
        
        // Calculate top products (would need sales_items data - simplified for now)
        setTopProducts([]);
        
        const totalRev = filtered.reduce((sum: number, s: any) => sum + parseFloat(s.net_amount || 0), 0);
        const totalDiscount = filtered.reduce((sum: number, s: any) => sum + parseFloat(s.discount || 0), 0);
        const estimatedCost = totalRev * 0.6; // Assume 40% margin
        
        setSalesStats({
          totalSales: filtered.length,
          totalRevenue: totalRev,
          totalProfit: totalRev - estimatedCost,
          averageOrderValue: filtered.length > 0 ? totalRev / filtered.length : 0
        });
      }
    } catch (error) {
      toast.error("Error loading sales report");
    } finally {
      setLoading(false);
    }
  };

  const loadStockReport = async () => {
    setLoading(true);
    try {
      // Load products
      const productsRes = await fetch(`${API_CONFIG.BASE_URL}/products`, {
        headers: getAuthHeaders()
      });
      
      // Load batches for more accurate inventory
      const batchesRes = await fetch(`${API_CONFIG.PHARMACY_BASE}/batches`, {
        headers: getAuthHeaders()
      });

      if (productsRes.ok) {
        const products = await productsRes.json();
        
        let totalValue = 0;
        let lowStockCount = 0;

        // If we have batch data, use it for calculations
        if (batchesRes.ok) {
          const batches = await batchesRes.json();
          totalValue = batches.reduce((sum: number, b: any) => 
            sum + (parseFloat(b.quantity_remaining || 0) * parseFloat(b.purchase_price || 0)), 0);
          
          // Count products with low stock
          const productStockMap: { [key: string]: number } = {};
          batches.forEach((b: any) => {
            if (b.is_active) {
              productStockMap[b.product_id] = (productStockMap[b.product_id] || 0) + parseFloat(b.quantity_remaining || 0);
            }
          });

          lowStockCount = products.filter((p: any) => {
            const currentStock = productStockMap[p.id] || 0;
            const reorderLevel = parseFloat(p.reorder_level || p.min_stock_level || 0);
            return currentStock <= reorderLevel;
          }).length;
        } else {
          // Fallback to product stock_quantity
          totalValue = products.reduce((sum: number, p: any) => 
            sum + (parseFloat(p.stock_quantity || 0) * parseFloat(p.cost_price || 0)), 0);
          lowStockCount = products.filter((p: any) => 
            parseFloat(p.stock_quantity || 0) <= parseFloat(p.min_stock_level || 0)).length;
        }
        
        setStockData(products);
        setStockStats({
          totalProducts: products.length,
          totalValue,
          lowStockItems: lowStockCount,
          expiringSoon: expiryAlerts.length
        });
      }
    } catch (error) {
      toast.error("Error loading stock report");
    } finally {
      setLoading(false);
    }
  };

  const loadExpiryAlerts = async () => {
    try {
      const response = await fetch(`${API_CONFIG.PHARMACY_BASE}/expiry-alerts?days=90`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setExpiryAlerts(data);
        setStockStats(prev => ({
          ...prev,
          expiringSoon: data.length
        }));
      }
    } catch (error) {
      console.log("Expiry alerts not available");
    }
  };

  const loadCustomerReport = async () => {
    setLoading(true);
    try {
      // Load customers
      const customersResponse = await fetch(`${API_CONFIG.BASE_URL}/customers`, {
        headers: getAuthHeaders()
      });
      
      // Load sales to calculate customer analytics
      const salesResponse = await fetch(`${API_CONFIG.BASE_URL}/sales`, {
        headers: getAuthHeaders()
      });

      if (customersResponse.ok && salesResponse.ok) {
        const customers = await customersResponse.json();
        const sales = await salesResponse.json();
        
        // Filter sales by date range
        const filteredSales = sales.filter((sale: any) => {
          const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
          return saleDate >= dateRange.from && saleDate <= dateRange.to;
        });

        // Calculate customer analytics
        const customerAnalytics = customers.map((customer: any) => {
          const customerSales = filteredSales.filter((s: any) => s.customer_name === customer.name || s.customer_id === customer.id);
          const totalRevenue = customerSales.reduce((sum: number, s: any) => sum + s.net_amount, 0);
          return {
            ...customer,
            purchaseCount: customerSales.length,
            totalRevenue,
            averageOrderValue: customerSales.length > 0 ? totalRevenue / customerSales.length : 0,
            lastPurchase: customerSales.length > 0 
              ? customerSales.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
              : null
          };
        }).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

        setCustomerData(customerAnalytics);
        setCustomerStats({
          totalCustomers: customers.length,
          activeCustomers: customerAnalytics.filter((c: any) => c.purchaseCount > 0).length,
          totalRevenue: filteredSales.reduce((sum: number, s: any) => sum + s.net_amount, 0),
          averageOrderValue: filteredSales.length > 0
            ? filteredSales.reduce((sum: number, s: any) => sum + s.net_amount, 0) / filteredSales.length
            : 0
        });
      }
    } catch (error) {
      toast.error("Error loading customer report");
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseReport = async () => {
    setLoading(true);
    try {
      // Load purchases/requisitions - adjust endpoint as needed
      const purchasesResponse = await fetch(`${API_CONFIG.BASE_URL}/requisitions`, {
        headers: getAuthHeaders()
      });

      // Load suppliers
      const suppliersResponse = await fetch(`${API_CONFIG.BASE_URL}/suppliers`, {
        headers: getAuthHeaders()
      });

      if (purchasesResponse.ok && suppliersResponse.ok) {
        const purchases = await purchasesResponse.json();
        const suppliers = await suppliersResponse.json();
        
        // Filter purchases by date range if they have created_at
        const filteredPurchases = purchases.filter((p: any) => {
          if (!p.created_at) return true;
          const purchaseDate = new Date(p.created_at).toISOString().split('T')[0];
          return purchaseDate >= dateRange.from && purchaseDate <= dateRange.to;
        });

        setPurchaseData(filteredPurchases);
        setPurchaseStats({
          totalPurchases: filteredPurchases.length,
          totalValue: filteredPurchases.reduce((sum: number, p: any) => sum + (p.total_amount || p.amount || 0), 0),
          averagePurchase: filteredPurchases.length > 0
            ? filteredPurchases.reduce((sum: number, p: any) => sum + (p.total_amount || p.amount || 0), 0) / filteredPurchases.length
            : 0,
          totalSuppliers: suppliers.length
        });
      }
    } catch (error) {
      toast.error("Error loading purchase report");
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialReport = async () => {
    setLoading(true);
    try {
      // Try to load from report endpoint first
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/reports/profit-loss?from_date=${dateRange.from}&to_date=${dateRange.to}`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setFinancialData(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.log("Profit-loss endpoint not available, calculating manually");
      }

      // Fallback: Calculate from sales data
      const salesRes = await fetch(`${API_CONFIG.BASE_URL}/sales`, {
        headers: getAuthHeaders()
      });
      
      if (salesRes.ok) {
        const sales = await salesRes.json();
        const filtered = sales.filter((sale: any) => {
          const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
          return saleDate >= dateRange.from && saleDate <= dateRange.to;
        });

        const totalSales = filtered.reduce((sum: number, s: any) => sum + parseFloat(s.net_amount || 0), 0);
        const totalDiscount = filtered.reduce((sum: number, s: any) => sum + parseFloat(s.discount || 0), 0);
        
        // Estimate COGS at 60% of sales (can be refined with actual purchase data)
        const estimatedCOGS = totalSales * 0.6;
        const grossProfit = totalSales - estimatedCOGS;
        
        // Estimate expenses at 10% of sales (can be refined with actual expense data)
        const estimatedExpenses = totalSales * 0.1;
        const netProfit = grossProfit - estimatedExpenses;

        setFinancialData({
          totalSales,
          cogs: estimatedCOGS,
          grossProfit,
          expenses: estimatedExpenses,
          netProfit
        });
      }
    } catch (error) {
      toast.error("Error loading financial report");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(","));
    const csvContent = [headers, ...rows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Report exported successfully");
  };

  const exportToPDF = () => {
    window.print();
    toast.success("Opening print dialog");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Prominent Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-8 rounded-2xl border-2 border-blue-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">
                  Reports & Analytics
                </h1>
                <p className="text-white/90 text-base">
                  Comprehensive business insights and performance metrics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20">
                <div className="text-xs text-white/70 font-medium">REPORT PERIOD</div>
                <div className="text-sm text-white font-semibold mt-1">
                  {format(new Date(dateRange.from), "dd MMM")} - {format(new Date(dateRange.to), "dd MMM yyyy")}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg text-center">
              <div className="text-2xl font-bold text-white">{salesStats.totalSales}</div>
              <div className="text-xs text-white/70 mt-1">Total Sales</div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg text-center">
              <div className="text-2xl font-bold text-white">${(salesStats.totalRevenue / 1000).toFixed(1)}k</div>
              <div className="text-xs text-white/70 mt-1">Revenue</div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg text-center">
              <div className="text-2xl font-bold text-white">{stockStats.totalProducts}</div>
              <div className="text-xs text-white/70 mt-1">Products</div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg text-center">
              <div className="text-2xl font-bold text-white">{customerStats.totalCustomers}</div>
              <div className="text-xs text-white/70 mt-1">Customers</div>
            </div>
            <div className="bg-red-500/30 backdrop-blur-md rounded-xl p-3 border border-red-300/30 shadow-lg text-center">
              <div className="text-2xl font-bold text-white">{stockStats.expiringSoon}</div>
              <div className="text-xs text-white/70 mt-1">Expiring Soon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="pharmacy-card bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-primary" />
            Report Date Range
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm font-medium">From Date</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="pharmacy-input mt-1"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm font-medium">To Date</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="pharmacy-input mt-1"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({
                  from: format(new Date(), "yyyy-MM-dd"),
                  to: format(new Date(), "yyyy-MM-dd")
                })}
                className="bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white border-teal-500/30"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({
                  from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
                  to: format(new Date(), "yyyy-MM-dd")
                })}
                className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-blue-500/30"
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({
                  from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                  to: format(endOfMonth(new Date()), "yyyy-MM-dd")
                })}
                className="bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-emerald-500/30"
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({
                  from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
                  to: format(new Date(), "yyyy-MM-dd")
                })}
                className="bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white border-indigo-500/30"
              >
                Last 30 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        // Navigate to route when tab changes
        const routeMap: { [key: string]: string } = {
          medicine: "/reports/medicine",
          sales: "/reports/sales",
          stock: "/reports/stock",
          financial: "/reports/financial",
          customer: "/reports/customer",
          purchase: "/reports/purchase"
        };
        if (routeMap[value] && location.pathname !== routeMap[value]) {
          navigate(routeMap[value], { replace: true });
        }
      }} className="space-y-4">
        <TabsList className="glass grid grid-cols-6 w-full">
          <TabsTrigger value="medicine" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white">
            <Pill className="w-4 h-4 mr-2" />
            Medicine
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-600 data-[state=active]:to-teal-700 data-[state=active]:text-white">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="stock" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white">
            <DollarSign className="w-4 h-4 mr-2" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="customer" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-700 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="purchase" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-600 data-[state=active]:to-cyan-700 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Purchases
          </TabsTrigger>
        </TabsList>

        {/* MEDICINE REPORT TAB */}
        <TabsContent value="medicine" className="space-y-4">
          <MedicineReportsTab dateRange={dateRange} />
        </TabsContent>

        {/* SALES REPORT TAB */}
        <TabsContent value="sales" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">{salesStats.totalSales}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">${salesStats.totalRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Profit</p>
                    <p className="text-2xl font-bold text-blue-600">${salesStats.totalProfit.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold">${salesStats.averageOrderValue.toFixed(2)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales List */}
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sales Transactions</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(salesData, "sales-report")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : salesData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No sales in the selected date range
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                        <TableHead className="text-right">Net Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{format(new Date(sale.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                          <TableCell className="font-medium">{sale.customer_name}</TableCell>
                          <TableCell className="text-right">${parseFloat(sale.total_amount || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right text-red-600">${parseFloat(sale.discount || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">${parseFloat(sale.tax || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">${parseFloat(sale.net_amount || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="pharmacy-badge capitalize">
                              {sale.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sale.payment_status === "completed" ? "default" : "secondary"}>
                              {sale.payment_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Insights */}
          {salesData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Customers */}
              {topCustomers.length > 0 && (
                <Card className="pharmacy-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Top Customers
                    </CardTitle>
                    <CardDescription>Highest spending customers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topCustomers.map((customer, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg glass-subtle">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                            </div>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-xs text-muted-foreground">{customer.count} purchases</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">${customer.total.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Methods */}
              <Card className="pharmacy-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>Sales by payment type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const paymentMethods: { [key: string]: number } = {};
                      salesData.forEach((sale: any) => {
                        const method = sale.payment_method || "cash";
                        paymentMethods[method] = (paymentMethods[method] || 0) + parseFloat(sale.net_amount || 0);
                      });
                      return Object.entries(paymentMethods)
                        .sort((a, b) => b[1] - a[1])
                        .map(([method, total], idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg glass-subtle">
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-5 h-5 text-primary/50" />
                              <div className="font-medium capitalize">{method}</div>
                            </div>
                            <div className="font-bold">${total.toFixed(2)}</div>
                          </div>
                        ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* STOCK REPORT TAB */}
        <TabsContent value="stock" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">{stockStats.totalProducts}</p>
                  </div>
                  <Package className="w-8 h-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Stock Value</p>
                    <p className="text-2xl font-bold text-green-600">${stockStats.totalValue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                    <p className="text-2xl font-bold text-orange-600">{stockStats.lowStockItems}</p>
                  </div>
                  <Package className="w-8 h-8 text-orange-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold text-red-600">{stockStats.expiringSoon}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-red-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Current Stock</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(stockData, "stock-report")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Cost Price</TableHead>
                        <TableHead className="text-right">Selling Price</TableHead>
                        <TableHead className="text-right">Stock Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockData.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={product.stock_quantity <= product.min_stock_level ? "text-red-600" : ""}>
                              {product.stock_quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">${parseFloat(product.cost_price || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">${parseFloat(product.selling_price || product.unit_price || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">
                            ${(parseFloat(product.stock_quantity || 0) * parseFloat(product.cost_price || 0)).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {parseFloat(product.stock_quantity || 0) <= parseFloat(product.min_stock_level || 0) ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : parseFloat(product.stock_quantity || 0) <= parseFloat(product.reorder_level || 0) ? (
                              <Badge variant="default">Reorder</Badge>
                            ) : (
                              <Badge variant="secondary">Good</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expiry Alerts Section */}
          {expiryAlerts.length > 0 && (
            <Card className="pharmacy-card border-red-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-red-600" />
                    Expiry Alerts
                  </CardTitle>
                  <Badge variant="destructive">{expiryAlerts.length} items</Badge>
                </div>
                <CardDescription>Medicines expiring within 90 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-red-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Batch Number</TableHead>
                        <TableHead className="text-right">Remaining Qty</TableHead>
                        <TableHead className="text-right">Purchase Price</TableHead>
                        <TableHead className="text-right">Value at Risk</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Days Left</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiryAlerts.slice(0, 20).map((alert, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{alert.product_name}</TableCell>
                          <TableCell>{alert.batch_number}</TableCell>
                          <TableCell className="text-right">{alert.quantity_remaining}</TableCell>
                          <TableCell className="text-right">${parseFloat(alert.purchase_price || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            ${parseFloat(alert.value_at_risk || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(alert.expiry_date), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={alert.days_to_expiry < 0 ? "destructive" : alert.days_to_expiry <= 30 ? "default" : "secondary"}>
                              {alert.days_to_expiry < 0 ? "Expired" : `${alert.days_to_expiry}d`}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {expiryAlerts.length > 20 && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Showing top 20 items. Total: {expiryAlerts.length} items
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* FINANCIAL REPORT TAB */}
        <TabsContent value="financial" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                Period: {format(new Date(dateRange.from), "dd MMM yyyy")} - {format(new Date(dateRange.to), "dd MMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border p-6 space-y-4">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium">Revenue</span>
                      <span className="font-bold text-green-600">${financialData.totalSales.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center border-t pt-4">
                      <span className="text-muted-foreground">Cost of Goods Sold (COGS)</span>
                      <span className="font-medium text-red-600">${financialData.cogs.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center border-t pt-4">
                      <span className="font-medium">Gross Profit</span>
                      <span className="font-bold text-blue-600">${financialData.grossProfit.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center border-t pt-4">
                      <span className="text-muted-foreground">Operating Expenses</span>
                      <span className="font-medium text-red-600">${financialData.expenses.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center border-t-2 border-primary pt-4">
                      <span className="text-xl font-bold">Net Profit</span>
                      <span className="text-3xl font-bold text-primary">
                        ${financialData.netProfit.toFixed(2)}
                      </span>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm">
                        <span>Gross Profit Margin:</span>
                        <span className="font-medium">
                          {financialData.totalSales > 0 
                            ? ((financialData.grossProfit / financialData.totalSales) * 100).toFixed(2)
                            : "0"}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span>Net Profit Margin:</span>
                        <span className="font-medium">
                          {financialData.totalSales > 0 
                            ? ((financialData.netProfit / financialData.totalSales) * 100).toFixed(2)
                            : "0"}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={exportToPDF}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Report
                    </Button>
                    <Button variant="outline" onClick={() => exportToCSV([financialData], "profit-loss")}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUSTOMER REPORT TAB */}
        <TabsContent value="customer" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold">{customerStats.totalCustomers}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Customers</p>
                    <p className="text-2xl font-bold text-green-600">{customerStats.activeCustomers}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">${customerStats.totalRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold">${customerStats.averageOrderValue.toFixed(2)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer List */}
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Customer Performance</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(customerData, "customer-report")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : customerData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No customer data available
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Purchases</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Avg Order</TableHead>
                        <TableHead>Last Purchase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerData.slice(0, 50).map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email || "N/A"}</TableCell>
                          <TableCell>{customer.phone || "N/A"}</TableCell>
                          <TableCell className="text-right">{customer.purchaseCount || 0}</TableCell>
                          <TableCell className="text-right font-bold">${(customer.totalRevenue || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(customer.averageOrderValue || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            {customer.lastPurchase 
                              ? format(new Date(customer.lastPurchase), "dd MMM yyyy")
                              : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PURCHASE REPORT TAB */}
        <TabsContent value="purchase" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Purchases</p>
                    <p className="text-2xl font-bold">{purchaseStats.totalPurchases}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Value</p>
                    <p className="text-2xl font-bold text-blue-600">${purchaseStats.totalValue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Purchase</p>
                    <p className="text-2xl font-bold text-green-600">${purchaseStats.averagePurchase.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="pharmacy-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Suppliers</p>
                    <p className="text-2xl font-bold">{purchaseStats.totalSuppliers}</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase List */}
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Purchase Transactions</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(purchaseData, "purchase-report")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToPDF}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : purchaseData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No purchase data available for the selected date range
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Requisition ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseData.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            {purchase.created_at 
                              ? format(new Date(purchase.created_at), "dd MMM yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell className="font-medium">{purchase.id?.substring(0, 8) || purchase.requisition_id || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={purchase.status === "approved" ? "default" : "secondary"}>
                              {purchase.status || "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            ${parseFloat(purchase.total_amount || purchase.amount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{purchase.notes || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

