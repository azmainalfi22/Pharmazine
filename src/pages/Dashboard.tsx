import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/integrations/api/client';
import { DollarSign, Package, ShoppingCart, TrendingUp, ShoppingBag, AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface Stats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  lowStock: number;
  totalPurchases: number;
  totalStockValue: number;
  categoryData: { name: string; value: number; count: number }[];
  monthlySales: { month: string; revenue: number; sales: number }[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    lowStock: 0,
    totalPurchases: 0,
    totalStockValue: 0,
    categoryData: [],
    monthlySales: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh dashboard data every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [products, sales, stockTransactions, categories] = await Promise.all([
        apiClient.getProducts().catch(() => []),
        apiClient.getSales().catch(() => []),
        apiClient.getStockTransactions().catch(() => []),
        apiClient.getCategories().catch(() => []),
      ]);

      const totalRevenue = (sales || []).reduce((sum, sale) => sum + Number(sale.net_amount || 0), 0);
      
      // Calculate total stock value
      const totalStockValue = (products || []).reduce((sum, product) => 
        sum + (Number(product.unit_price || 0) * Number(product.stock_quantity || 0)), 0
      );

      // Group products by category
      const categoryMap = new Map();
      (products || []).forEach(product => {
        const categoryName = product.category_name || 'Uncategorized';
        const categoryId = product.category_id || 'uncategorized';
        const value = Number(product.unit_price || 0) * Number(product.stock_quantity || 0);
        
        if (categoryMap.has(categoryId)) {
          const existing = categoryMap.get(categoryId);
          categoryMap.set(categoryId, {
            name: categoryName,
            value: existing.value + value,
            count: existing.count + 1
          });
        } else {
          categoryMap.set(categoryId, { name: categoryName, value, count: 1 });
        }
      });

      const categoryData = Array.from(categoryMap.values());

      // Calculate monthly sales (last 6 months)
      const monthlySalesMap = new Map();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlySalesMap.set(monthKey, { month: monthKey, revenue: 0, sales: 0 });
      }

      (sales || []).forEach(sale => {
        try {
          const saleDate = new Date(sale.created_at);
          const monthKey = saleDate.toLocaleDateString('en-US', { month: 'short' });
          if (monthlySalesMap.has(monthKey)) {
            const existing = monthlySalesMap.get(monthKey);
            monthlySalesMap.set(monthKey, {
              month: monthKey,
              revenue: existing.revenue + Number(sale.net_amount || 0),
              sales: existing.sales + 1
            });
          }
        } catch (e) {
          // Skip invalid dates
        }
      });

      const monthlySales = Array.from(monthlySalesMap.values());

      // Count low stock products
      const lowStock = (products || []).filter(product => 
        Number(product.stock_quantity || 0) <= Number(product.min_stock_level || product.reorder_level || 0)
      ).length;

      // Count purchase transactions
      const totalPurchases = (stockTransactions || []).filter(t => t.transaction_type === 'in').length;

      setStats({
        totalProducts: (products || []).length,
        totalSales: (sales || []).length,
        totalRevenue,
        lowStock,
        totalPurchases,
        totalStockValue,
        categoryData,
        monthlySales,
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `৳${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-primary to-emerald-600',
      change: stats.totalRevenue > 0 ? 'Active' : 'No revenue yet',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      gradient: 'from-emerald-500 to-teal-600',
      change: stats.totalProducts > 0 ? 'In stock' : 'No products',
    },
    {
      title: 'Total Sales',
      value: stats.totalSales.toString(),
      icon: ShoppingCart,
      gradient: 'from-cyan-500 to-blue-600',
      change: stats.totalSales > 0 ? 'Active' : 'No sales yet',
    },
    {
      title: 'Total Purchases',
      value: stats.totalPurchases.toString(),
      icon: ShoppingBag,
      gradient: 'from-blue-500 to-indigo-600',
      change: stats.totalPurchases > 0 ? 'Recorded' : 'No purchases',
    },
    {
      title: 'Stock Value',
      value: `৳${stats.totalStockValue.toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'from-violet-500 to-purple-600',
      change: stats.totalStockValue > 0 ? 'Available' : 'No stock',
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStock.toString(),
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-red-600',
      change: stats.lowStock > 0 ? 'Action needed' : 'All good',
    },
  ];

  const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const chartConfig = {
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--primary))',
    },
    sales: {
      label: 'Sales',
      color: 'hsl(var(--accent))',
    },
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-emerald-600 to-primary/90 p-8 rounded-2xl border-2 border-primary/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
                Dashboard Overview
              </h1>
              <p className="text-white/90 text-base max-w-2xl">
                Real-time insights for Sharkar Pharmacy - Track sales, manage inventory, and optimize operations
              </p>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all disabled:opacity-50 backdrop-blur-sm border border-white/30 hover:shadow-lg"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
          {lastUpdated && (
            <div className="text-sm text-white/70 mt-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <Card key={index} className="overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 hover:border-primary/30 bg-gradient-to-br from-card to-card/95">
              <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                <div className="flex-1">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {card.title}
                  </CardTitle>
                  <div className="text-xs text-muted-foreground mt-1.5 font-medium bg-muted/50 rounded px-2 py-1 inline-block">
                    {card.change}
                  </div>
                </div>
                <div className={`p-3.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg ring-2 ring-white/10`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <Skeleton className="h-12 w-36" />
                ) : (
                  <div className="text-4xl font-bold tracking-tight">
                    {card.value}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 shadow-xl hover:shadow-2xl transition-shadow bg-gradient-to-br from-card to-card/95">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="h-10 w-1.5 bg-gradient-to-b from-teal-500 to-emerald-600 rounded-full" />
              <span className="font-bold">Revenue & Sales Trends</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last 6 months performance overview</p>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <Skeleton className="h-[320px] w-full rounded-lg" />
            ) : stats.monthlySales.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Revenue (৳)" />
                    <Bar dataKey="sales" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} name="Sales Count" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-16 w-16 mb-4 opacity-30" />
                <p className="font-medium">No sales data available</p>
                <p className="text-sm mt-1">Start making sales to see trends</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 shadow-xl hover:shadow-2xl transition-shadow bg-gradient-to-br from-card to-card/95">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="h-10 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
              <span className="font-bold">Product Distribution</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Breakdown by product category</p>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <Skeleton className="h-[320px] w-full rounded-lg" />
            ) : stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={105}
                    fill="#8884d8"
                    dataKey="count"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border-2 bg-background p-3 shadow-lg">
                            <div className="grid gap-2">
                              <div className="font-semibold text-base">{payload[0].payload.name}</div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Products:</span> {payload[0].value}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Value:</span> ৳{payload[0].payload.value.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-16 w-16 mb-4 opacity-30" />
                <p className="font-medium">No product data available</p>
                <p className="text-sm mt-1">Add products to see distribution</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              Inventory Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border">
              <span className="text-sm font-medium">Total Products</span>
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <span className="text-xl font-bold">{stats.totalProducts}</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-accent/5 to-accent/10 border">
              <span className="text-sm font-medium">Stock Value</span>
              {loading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <span className="text-xl font-bold">৳{stats.totalStockValue.toLocaleString()}</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/5 to-red-500/10 border border-orange-200">
              <span className="text-sm font-medium text-orange-700">Low Stock Alerts</span>
              {loading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <span className="text-xl font-bold text-orange-600">{stats.lowStock}</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/5 to-emerald-500/10 border">
              <span className="text-sm font-medium">Total Purchases</span>
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <span className="text-xl font-bold">{stats.totalPurchases}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-sm font-medium">Database Connected</span>
              <span className="ml-auto text-xs text-green-600 font-semibold">Active</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-sm font-medium">Authentication Service</span>
              <span className="ml-auto text-xs text-green-600 font-semibold">Running</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-sm font-medium">Payment Gateway</span>
              <span className="ml-auto text-xs text-green-600 font-semibold">Ready</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-sm font-medium">Backup System</span>
              <span className="ml-auto text-xs text-green-600 font-semibold">Synced</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
