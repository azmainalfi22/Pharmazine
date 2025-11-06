import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package, 
  DollarSign, 
  AlertTriangle,
  Clock,
  Calendar
} from "lucide-react";
import { apiClient } from "@/integrations/api/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Link } from "react-router-dom";

interface DashboardStats {
  today_sales: number;
  today_transactions: number;
  today_customers: number;
  week_sales: number;
  month_sales: number;
  low_stock_count: number;
  out_of_stock_count: number;
  expiring_soon_count: number;
  pending_requisitions: number;
  total_inventory_value: number;
}

interface TopProduct {
  id: string;
  sku: string;
  name: string;
  quantity_sold: number;
  revenue: number;
  current_stock: number;
}

export default function EnhancedDashboardV2() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [hourlySales, setHourlySales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await apiClient.getRealtimeDashboard();
      setStats(data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      // Fallback to basic stats
      try {
        const fallbackData = await apiClient.getDashboardStats();
        setStats(fallbackData as any);
      } catch (e) {
        console.error("Fallback failed:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Live Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Real-time pharmacy operations overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
          <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-800">Live</span>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.today_sales?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.today_transactions || 0} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customers Today</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today_customers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">unique customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total_inventory_value?.toFixed(0) || '0'}</div>
            <p className="text-xs text-muted-foreground mt-1">current stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.month_sales?.toFixed(0) || '0'}</div>
            <p className="text-xs text-muted-foreground mt-1">monthly revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-3 gap-4">
        <Link to="/inventory/low-stock">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.low_stock_count || 0}</p>
                  <p className="text-xs text-orange-600 mt-1">Needs reordering</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/medicine-management/expiry-alerts">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                  <p className="text-3xl font-bold text-red-600">{stats.expiring_soon_count || 0}</p>
                  <p className="text-xs text-red-600 mt-1">Within 30 days</p>
                </div>
                <Clock className="h-10 w-10 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/inventory/auto-reorder">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Auto-Reorder</p>
                  <p className="text-3xl font-bold text-blue-600">{(stats.low_stock_count || 0)}</p>
                  <p className="text-xs text-blue-600 mt-1">Smart suggestions</p>
                </div>
                <ShoppingCart className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-5 gap-3">
        <Link to="/sales">
          <Card className="hover:bg-primary/5 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">New Sale</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/purchase">
          <Card className="hover:bg-blue-50 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Purchase Order</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/customers">
          <Card className="hover:bg-green-50 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Customers</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/inventory">
          <Card className="hover:bg-purple-50 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium">Inventory</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/reports">
          <Card className="hover:bg-indigo-50 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
              <p className="text-sm font-medium">Reports</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

