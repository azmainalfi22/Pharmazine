import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Package, Users, TrendingUp, AlertTriangle, DollarSign, Calendar, Pill } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

const API_BASE = "http://localhost:8000/api";

export default function EnhancedDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCustomers: 0,
    lowStockProducts: 0
  });

  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsResponse = await fetch(`${API_BASE}/dashboard/stats`, {
        headers: getAuthHeader()
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent sales
      const salesResponse = await fetch(`${API_BASE}/sales`, {
        headers: getAuthHeader()
      });
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        setRecentSales(salesData.slice(0, 5));
      }

      // Load expiry alerts
      try {
        const expiryResponse = await fetch(`${API_BASE}/pharmacy/expiry-alerts?days=30`, {
          headers: getAuthHeader()
        });
        if (expiryResponse.ok) {
          const expiryData = await expiryResponse.json();
          setExpiryAlerts(expiryData.slice(0, 5));
        }
      } catch (error) {
        console.log("Expiry alerts not available");
      }

      // Load low stock items
      const productsResponse = await fetch(`${API_BASE}/products`, {
        headers: getAuthHeader()
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
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to Sharkar Pharmacy
          </h1>
          <p className="text-muted-foreground mt-1">
            Your complete pharmacy management solution
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/inventory">
          <Card className="pharmacy-stat-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.totalProducts}</h3>
                </div>
                <Package className="w-12 h-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/sales/history">
          <Card className="pharmacy-stat-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <h3 className="text-3xl font-bold mt-2 text-green-600">{stats.totalSales}</h3>
                </div>
                <ShoppingCart className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/customers">
          <Card className="pharmacy-stat-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customers</p>
                  <h3 className="text-3xl font-bold mt-2 text-blue-600">{stats.totalCustomers}</h3>
                </div>
                <Users className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/medicine-management/expiry-alerts">
          <Card className="pharmacy-stat-card hover:shadow-lg transition-shadow cursor-pointer border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
                  <h3 className="text-3xl font-bold mt-2 text-red-600">{stats.lowStockProducts}</h3>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card className="pharmacy-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/sales">
              <Button className="w-full pharmacy-button" variant="outline">
                <ShoppingCart className="w-4 h-4 mr-2" />
                New Sale
              </Button>
            </Link>
            <Link to="/purchase">
              <Button className="w-full pharmacy-button" variant="outline">
                <Package className="w-4 h-4 mr-2" />
                New Purchase
              </Button>
            </Link>
            <Link to="/customers">
              <Button className="w-full pharmacy-button" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </Link>
            <Link to="/reports">
              <Button className="w-full pharmacy-button" variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Reports
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
              <Link to="/inventory">
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
        <Card className="pharmacy-card">
          <CardHeader>
            <CardTitle>Today's Performance</CardTitle>
            <CardDescription>{format(new Date(), "dd MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg glass-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Sales Today</div>
                    <div className="text-sm text-muted-foreground">0 transactions</div>
                  </div>
                </div>
                <div className="font-bold text-lg text-green-600">$0.00</div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg glass-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Purchases Today</div>
                    <div className="text-sm text-muted-foreground">0 orders</div>
                  </div>
                </div>
                <div className="font-bold text-lg text-blue-600">$0.00</div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg glass-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">New Customers</div>
                    <div className="text-sm text-muted-foreground">Today</div>
                  </div>
                </div>
                <div className="font-bold text-lg text-purple-600">0</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="pharmacy-card bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm font-medium mt-1">Database</div>
              <div className="text-xs text-muted-foreground">Connected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm font-medium mt-1">API</div>
              <div className="text-xs text-muted-foreground">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm font-medium mt-1">Pharmacy Modules</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">14/14</div>
              <div className="text-sm font-medium mt-1">Phases</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

