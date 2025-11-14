import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ShoppingCart, Package } from "lucide-react";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  min_stock_level?: number;
  reorder_level?: number;
  category?: string;
  unit_price: number;
  cost_price: number;
}

export default function LowStockAlerts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    outOfStock: 0,
    criticallyLow: 0,
    lowStock: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.API_ROOT}/products`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data: Product[] = await response.json();

        // Filter for low stock items
        const lowStockItems = data.filter((p) => {
          const minLevel = p.min_stock_level || p.reorder_level || 10;
          return p.stock_quantity <= minLevel;
        });

        setProducts(lowStockItems);

        // Calculate stats
        const outOfStock = lowStockItems.filter((p) => p.stock_quantity === 0).length;
        const criticallyLow = lowStockItems.filter(
          (p) => p.stock_quantity > 0 && p.stock_quantity <= ((p.min_stock_level || 10) / 2)
        ).length;
        const totalValue = lowStockItems.reduce((sum, p) => sum + p.stock_quantity * p.cost_price, 0);

        setStats({
          outOfStock,
          criticallyLow,
          lowStock: lowStockItems.length - outOfStock - criticallyLow,
          totalValue,
        });

        toast.success(`Found ${lowStockItems.length} items needing attention`);
      } else {
        toast.error("Failed to load products");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return <Badge variant="destructive">OUT OF STOCK</Badge>;
    }
    const minLevel = product.min_stock_level || product.reorder_level || 10;
    if (product.stock_quantity <= minLevel / 2) {
      return <Badge className="bg-orange-100 text-orange-800">CRITICALLY LOW</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">LOW STOCK</Badge>;
  };

  const getQuantityNeeded = (product: Product): number => {
    const targetLevel = (product.min_stock_level || 10) * 2; // Reorder to 2x minimum
    return Math.max(0, targetLevel - product.stock_quantity);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Prominent Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-orange-700 p-8 rounded-2xl border-2 border-orange-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">Low Stock Alerts</h1>
                <p className="text-white/90 text-base">Products that need reordering</p>
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
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80 text-sm mb-1">Out of Stock</p>
              <p className="text-3xl font-bold text-white">{stats.outOfStock}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80 text-sm mb-1">Critically Low</p>
              <p className="text-3xl font-bold text-orange-300">{stats.criticallyLow}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80 text-sm mb-1">Low Stock</p>
              <p className="text-3xl font-bold text-yellow-300">{stats.lowStock}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/80 text-sm mb-1">Total Items</p>
              <p className="text-3xl font-bold text-white">{products.length}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Products Needing Reorder</CardTitle>
              <CardDescription>Items below minimum stock level - create purchase orders to restock</CardDescription>
            </div>
            <Link to="/purchase">
              <Button className="pharmacy-button">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">All Good!</h3>
              <p className="text-muted-foreground">All products are adequately stocked.</p>
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
                    <TableHead className="text-center">Min Level</TableHead>
                    <TableHead className="text-center">Suggested Order</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const quantityNeeded = getQuantityNeeded(product);
                    const estimatedCost = quantityNeeded * product.cost_price;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category || "Uncategorized"}</TableCell>
                        <TableCell className="text-center font-bold">
                          <span
                            className={
                              product.stock_quantity === 0
                                ? "text-red-600"
                                : product.stock_quantity <= ((product.min_stock_level || 10) / 2)
                                ? "text-orange-600"
                                : "text-yellow-600"
                            }
                          >
                            {product.stock_quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {product.min_stock_level || product.reorder_level || 10}
                        </TableCell>
                        <TableCell className="text-center font-bold text-blue-600">{quantityNeeded}</TableCell>
                        <TableCell className="text-right font-medium">${estimatedCost.toFixed(2)}</TableCell>
                        <TableCell className="text-center">{getStockStatus(product)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Total Items to Reorder: {products.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Estimated Total Cost: ${products.reduce((sum, p) => sum + getQuantityNeeded(p) * p.cost_price, 0).toFixed(2)}
                  </p>
                </div>
                <Link to="/purchase">
                  <Button size="lg" className="pharmacy-button">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Create Bulk Purchase Order
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

