import { useState, useEffect } from "react";
import { FileText, Download, Printer, TrendingUp, Package, DollarSign, Calendar, BarChart3, PieChart, Users, ShoppingCart } from "lucide-react";
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

const API_BASE = "http://localhost:8000/api";

export default function EnhancedReports() {
  const [activeTab, setActiveTab] = useState("sales");
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

  useEffect(() => {
    if (activeTab === "sales") loadSalesReport();
    if (activeTab === "stock") loadStockReport();
    if (activeTab === "financial") loadFinancialReport();
  }, [activeTab, dateRange]);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const loadSalesReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/sales`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter((sale: any) => {
          const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
          return saleDate >= dateRange.from && saleDate <= dateRange.to;
        });
        
        setSalesData(filtered);
        setSalesStats({
          totalSales: filtered.length,
          totalRevenue: filtered.reduce((sum: number, s: any) => sum + s.net_amount, 0),
          totalProfit: filtered.reduce((sum: number, s: any) => sum + (s.net_amount * 0.2), 0), // Simplified
          averageOrderValue: filtered.length > 0 
            ? filtered.reduce((sum: number, s: any) => sum + s.net_amount, 0) / filtered.length 
            : 0
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
      const response = await fetch(`${API_BASE}/products`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setStockData(data);
        setStockStats({
          totalProducts: data.length,
          totalValue: data.reduce((sum: number, p: any) => sum + (p.stock_quantity * p.cost_price), 0),
          lowStockItems: data.filter((p: any) => p.stock_quantity <= p.min_stock_level).length,
          expiringSoon: 0 // Would need batch data
        });
      }
    } catch (error) {
      toast.error("Error loading stock report");
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/reports/profit-loss?from_date=${dateRange.from}&to_date=${dateRange.to}`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive business reports and insights
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="pharmacy-card">
        <CardContent className="p-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDateRange({
                  from: format(new Date(), "yyyy-MM-dd"),
                  to: format(new Date(), "yyyy-MM-dd")
                })}
              >
                Today
              </Button>
              <Button
                variant="outline"
                onClick={() => setDateRange({
                  from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
                  to: format(new Date(), "yyyy-MM-dd")
                })}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                onClick={() => setDateRange({
                  from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                  to: format(endOfMonth(new Date()), "yyyy-MM-dd")
                })}
              >
                This Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="sales">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Sales Report
          </TabsTrigger>
          <TabsTrigger value="stock">
            <Package className="w-4 h-4 mr-2" />
            Stock Report
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="w-4 h-4 mr-2" />
            Financial Report
          </TabsTrigger>
          <TabsTrigger value="customer">
            <Users className="w-4 h-4 mr-2" />
            Customer Report
          </TabsTrigger>
          <TabsTrigger value="purchase">
            <TrendingUp className="w-4 h-4 mr-2" />
            Purchase Report
          </TabsTrigger>
        </TabsList>

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
                          <TableCell className="text-right">${sale.total_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-red-600">${sale.discount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${sale.tax.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">${sale.net_amount.toFixed(2)}</TableCell>
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
                          <TableCell className="text-right">${product.cost_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(product.selling_price || product.unit_price).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">
                            ${(product.stock_quantity * product.cost_price).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {product.stock_quantity <= product.min_stock_level ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : product.stock_quantity <= product.reorder_level ? (
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
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>Customer Analytics</CardTitle>
              <CardDescription>Customer purchase patterns and outstanding balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Customer analytics coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PURCHASE REPORT TAB */}
        <TabsContent value="purchase" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>Purchase Analytics</CardTitle>
              <CardDescription>Supplier-wise purchase analysis and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Purchase analytics coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

