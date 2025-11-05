import { useState, useEffect } from "react";
import { Search, Package, RefreshCw, AlertTriangle, TrendingDown, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string;
  stock_quantity: number;
  min_stock_level?: number;
  max_stock_level?: number;
  unit_price: number;
  cost_price: number;
  expiry_date?: string;
  batch_number?: string;
  is_prescription_required?: boolean;
  is_schedule_drug?: boolean;
}

interface SalesAnalytics {
  product_id: string;
  avg_daily_sales: number;
  days_of_supply: number | null;
  abc_class: 'A' | 'B' | 'C';
  total_revenue: number;
}

export default function StockManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<Map<string, SalesAnalytics>>(new Map());
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStock: 0,
    totalValue: 0
  });

  useEffect(() => {
    loadProducts();
    loadSalesAnalytics();
  }, []);

  const loadSalesAnalytics = async () => {
    try {
      const data = await apiClient.getSalesAnalytics(30);
      const analyticsMap = new Map();
      data.forEach((item: SalesAnalytics) => {
        analyticsMap.set(item.product_id, item);
      });
      setSalesAnalytics(analyticsMap);
    } catch (error) {
      console.error("Error loading sales analytics:", error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log("Loading products from:", API_CONFIG.BASE_URL);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/products`, {
        headers: getAuthHeaders()
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Products loaded:", data.length);
        setProducts(data);
        
        // Calculate stats
        const lowStock = data.filter((p: Product) => 
          p.stock_quantity <= (p.min_stock_level || 10)
        ).length;
        const outOfStock = data.filter((p: Product) => p.stock_quantity === 0).length;
        const totalValue = data.reduce((sum: number, p: Product) => 
          sum + (p.stock_quantity * p.cost_price), 0
        );
        
        setStats({
          totalProducts: data.length,
          lowStockItems: lowStock,
          outOfStock: outOfStock,
          totalValue: totalValue
        });
        
        toast.success(`Products loaded: ${data.length} items`);
      } else {
        console.error("Failed to load products, status:", response.status);
        toast.error(`Failed to load products (${response.status})`);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error loading products - check console");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log("StockManagement rendering - Products:", products.length, "Loading:", loading);

  return (
    <div className="p-6 space-y-6">
      {/* Prominent Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">
                  Products & Stock
                </h1>
                <p className="text-white/90 text-base">
                  View all products and current stock levels
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadProducts}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Link to="/inventory" className="block">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all cursor-pointer">
                <p className="text-white/80 text-sm mb-1">Total Products</p>
                <p className="text-3xl font-bold text-white">{stats.totalProducts}</p>
              </div>
            </Link>
            <Link to="/inventory/low-stock" className="block">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all cursor-pointer">
                <p className="text-white/80 text-sm mb-1">Low Stock Items</p>
                <p className="text-3xl font-bold text-orange-300">{stats.lowStockItems}</p>
              </div>
            </Link>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80 text-sm mb-1">Out of Stock</p>
              <p className="text-3xl font-bold text-red-300">{stats.outOfStock}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80 text-sm mb-1">Total Inventory Value</p>
              <p className="text-3xl font-bold text-white">${stats.totalValue.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/inventory/movements" className="block">
          <Button variant="outline" className="w-full h-auto flex flex-col gap-2 p-4 hover:bg-primary/5">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Stock Movements</span>
          </Button>
        </Link>
        <Link to="/inventory/low-stock" className="block">
          <Button variant="outline" className="w-full h-auto flex flex-col gap-2 p-4 hover:bg-orange-50">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium">Low Stock Alerts</span>
          </Button>
        </Link>
        <Link to="/inventory/stock-in/stock-adjustment" className="block">
          <Button variant="outline" className="w-full h-auto flex flex-col gap-2 p-4 hover:bg-purple-50">
            <TrendingDown className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium">Physical Count</span>
          </Button>
        </Link>
        <Link to="/purchase" className="block">
          <Button variant="outline" className="w-full h-auto flex flex-col gap-2 p-4 hover:bg-blue-50">
            <Package className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Create Purchase Order</span>
          </Button>
        </Link>
      </div>

      {/* Products Table */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Products - Current Stock</CardTitle>
              <CardDescription>Complete inventory with real-time stock levels</CardDescription>
            </div>
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="text-center">Days Supply</TableHead>
                    <TableHead className="text-center">Expiry</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Stock Value</TableHead>
                    <TableHead className="text-center">ABC</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const isLowStock = product.stock_quantity <= (product.min_stock_level || 10);
                    const isOutOfStock = product.stock_quantity === 0;
                    const stockValue = product.stock_quantity * product.cost_price;
                    const analytics = salesAnalytics.get(product.id);
                    const daysSupply = analytics?.days_of_supply;
                    const abcClass = analytics?.abc_class || 'C';
                    
                    // Parse and check expiry date
                    const expiryDate = product.expiry_date ? new Date(product.expiry_date) : null;
                    const today = new Date();
                    const daysUntilExpiry = expiryDate ? Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 90 && daysUntilExpiry > 0;
                    const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">
                          {product.sku}
                          {product.is_prescription_required && <Badge variant="outline" className="ml-1 text-xs">Rx</Badge>}
                          {product.is_schedule_drug && <Badge variant="destructive" className="ml-1 text-xs">⚠️</Badge>}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category || "Uncategorized"}</TableCell>
                        <TableCell className="text-center font-bold">
                          <span className={isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-green-600"}>
                            {product.stock_quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {daysSupply ? (
                            <Badge variant={daysSupply < 7 ? "destructive" : daysSupply < 14 ? "secondary" : "outline"}>
                              {daysSupply}d
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {expiryDate ? (
                            <div className="flex flex-col items-center">
                              <span className={`text-sm ${isExpired ? 'text-red-600 font-bold' : isExpiringSoon ? 'text-orange-600' : ''}`}>
                                {expiryDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                              </span>
                              {isExpired && <Badge variant="destructive" className="text-xs mt-1">EXPIRED</Badge>}
                              {isExpiringSoon && <Badge className="bg-orange-100 text-orange-800 text-xs mt-1">{daysUntilExpiry}d</Badge>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">${product.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${stockValue.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={abcClass === 'A' ? 'default' : abcClass === 'B' ? 'secondary' : 'outline'} 
                                 className={abcClass === 'A' ? 'bg-purple-100 text-purple-800' : abcClass === 'B' ? 'bg-blue-100 text-blue-800' : ''}>
                            {abcClass}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {isOutOfStock ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">Low Stock</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
