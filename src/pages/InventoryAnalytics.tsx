import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Package, DollarSign, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ProductAnalytics {
  product_id: string;
  product_name: string;
  sku: string;
  total_sold: number;
  order_count: number;
  total_revenue: number;
  avg_daily_sales: number;
  current_stock: number;
  days_of_supply: number | null;
  abc_class: 'A' | 'B' | 'C';
}

export default function InventoryAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ProductAnalytics[]>([]);
  const [days, setDays] = useState("30");
  const [filterClass, setFilterClass] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSalesAnalytics(parseInt(days));
      setAnalytics(data);
      toast.success(`Loaded analytics for ${data.length} products`);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Error loading analytics");
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalytics = filterClass === 'ALL' 
    ? analytics 
    : analytics.filter(item => item.abc_class === filterClass);

  const getClassStats = () => {
    const aItems = analytics.filter(item => item.abc_class === 'A');
    const bItems = analytics.filter(item => item.abc_class === 'B');
    const cItems = analytics.filter(item => item.abc_class === 'C');

    const totalRevenue = analytics.reduce((sum, item) => sum + item.total_revenue, 0);
    const aRevenue = aItems.reduce((sum, item) => sum + item.total_revenue, 0);
    const bRevenue = bItems.reduce((sum, item) => sum + item.total_revenue, 0);
    const cRevenue = cItems.reduce((sum, item) => sum + item.total_revenue, 0);

    return {
      a: { count: aItems.length, revenue: aRevenue, percentage: ((aRevenue / totalRevenue) * 100) || 0 },
      b: { count: bItems.length, revenue: bRevenue, percentage: ((bRevenue / totalRevenue) * 100) || 0 },
      c: { count: cItems.length, revenue: cRevenue, percentage: ((cRevenue / totalRevenue) * 100) || 0 },
      total: totalRevenue
    };
  };

  const stats = getClassStats();

  const pieData = [
    { name: 'Class A (High Value)', value: stats.a.revenue, count: stats.a.count, color: '#8b5cf6' },
    { name: 'Class B (Medium Value)', value: stats.b.revenue, count: stats.b.count, color: '#3b82f6' },
    { name: 'Class C (Low Value)', value: stats.c.revenue, count: stats.c.count, color: '#9ca3af' }
  ];

  const barData = [
    { class: 'A', products: stats.a.count, revenue: stats.a.revenue / 1000 },
    { class: 'B', products: stats.b.count, revenue: stats.b.revenue / 1000 },
    { class: 'C', products: stats.c.count, revenue: stats.c.revenue / 1000 }
  ];

  const exportToCSV = () => {
    if (analytics.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["SKU", "Product Name", "ABC Class", "Total Sold", "Revenue", "Avg Daily Sales", "Current Stock", "Days of Supply"].join(",");
    const rows = analytics.map((item) =>
      [
        item.sku,
        item.product_name,
        item.abc_class,
        item.total_sold,
        item.total_revenue.toFixed(2),
        item.avg_daily_sales,
        item.current_stock,
        item.days_of_supply || "N/A"
      ].join(",")
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abc-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Report exported successfully");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 p-8 rounded-2xl border-2 border-purple-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">ABC Inventory Analysis</h1>
              <p className="text-white/90 text-base">Strategic product classification based on sales value</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[150px] bg-white/20 border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="60">Last 60 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={loadAnalytics}
              variant="outline"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ABC Explanation Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-100 text-purple-800">Class A</Badge>
                <span className="text-sm font-semibold">High Value Items</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Top 20% products generating 80% revenue. Requires tight inventory control and frequent monitoring.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-100 text-blue-800">Class B</Badge>
                <span className="text-sm font-semibold">Medium Value Items</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Next 30% products generating 15% revenue. Moderate control with regular review cycles.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Class C</Badge>
                <span className="text-sm font-semibold">Low Value Items</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Remaining 50% products generating 5% revenue. Minimal control with periodic reviews.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class A Products</p>
                <p className="text-2xl font-bold">{stats.a.count}</p>
                <p className="text-xs text-muted-foreground mt-1">${stats.a.revenue.toFixed(0)} ({stats.a.percentage.toFixed(1)}%)</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class B Products</p>
                <p className="text-2xl font-bold">{stats.b.count}</p>
                <p className="text-xs text-muted-foreground mt-1">${stats.b.revenue.toFixed(0)} ({stats.b.percentage.toFixed(1)}%)</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class C Products</p>
                <p className="text-2xl font-bold">{stats.c.count}</p>
                <p className="text-xs text-muted-foreground mt-1">${stats.c.revenue.toFixed(0)} ({stats.c.percentage.toFixed(1)}%)</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Package className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.total.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{analytics.length} products</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>ABC classification by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.split(' ')[1]} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products vs Revenue</CardTitle>
            <CardDescription>Number of products and revenue by class</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="products" fill="#8b5cf6" name="Products" />
                <Bar yAxisId="right" dataKey="revenue" fill="#3b82f6" name="Revenue (K)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Detailed ABC analysis with sales performance metrics</CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={filterClass} onValueChange={(value) => setFilterClass(value as 'ALL' | 'A' | 'B' | 'C')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  <SelectItem value="A">Class A Only</SelectItem>
                  <SelectItem value="B">Class B Only</SelectItem>
                  <SelectItem value="C">Class C Only</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : filteredAnalytics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No products found</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-center">ABC</TableHead>
                    <TableHead className="text-right">Total Sold</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg Daily Sales</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Days Supply</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalytics.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={item.abc_class === 'A' ? 'default' : item.abc_class === 'B' ? 'secondary' : 'outline'}
                          className={item.abc_class === 'A' ? 'bg-purple-100 text-purple-800' : item.abc_class === 'B' ? 'bg-blue-100 text-blue-800' : ''}
                        >
                          {item.abc_class}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.total_sold.toFixed(0)}</TableCell>
                      <TableCell className="text-right">{item.order_count}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">${item.total_revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.avg_daily_sales.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.current_stock === 0 ? 'destructive' : 'outline'}>
                          {item.current_stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.days_of_supply ? (
                          <Badge variant={item.days_of_supply < 7 ? 'destructive' : item.days_of_supply < 14 ? 'secondary' : 'outline'}>
                            {item.days_of_supply}d
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
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
    </div>
  );
}

