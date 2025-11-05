import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, RefreshCw, Download, AlertTriangle, TrendingUp, Package, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/integrations/api/client";
import { useNavigate } from "react-router-dom";

interface ReorderRecommendation {
  product_id: string;
  sku: string;
  product_name: string;
  current_stock: number;
  min_stock_level: number;
  reorder_point: number;
  avg_daily_sales: number;
  days_of_supply: number;
  recommended_order_qty: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  abc_class: 'A' | 'B' | 'C';
  reason: string;
  estimated_cost: number;
  supplier_id: string;
}

interface SupplierGroup {
  supplier_id: string;
  supplier_name?: string;
  product_count: number;
  total_estimated_cost: number;
  products: ReorderRecommendation[];
}

export default function AutoReorderPage() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<ReorderRecommendation[]>([]);
  const [groupedBySupplier, setGroupedBySupplier] = useState<SupplierGroup[]>([]);
  const [days, setDays] = useState("30");
  const [viewMode, setViewMode] = useState<'all' | 'by-supplier'>('all');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    loadRecommendations();
  }, [days]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      // Load all recommendations
      const allData = await apiClient.getReorderRecommendations(parseInt(days));
      setRecommendations(allData.recommendations);
      
      // Load grouped by supplier
      const supplierData = await apiClient.getReorderBySupplier(parseInt(days));
      setGroupedBySupplier(supplierData.suppliers);
      
      toast.success("Reorder recommendations loaded");
    } catch (error) {
      console.error("Error loading recommendations:", error);
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const generatePOForSupplier = async (supplierId: string) => {
    try {
      const data = await apiClient.generatePOFromReorder(supplierId, parseInt(days));
      toast.success(`Draft PO created with ${data.total_items} items`);
      navigate('/purchase');
    } catch (error) {
      console.error("Error generating PO:", error);
      toast.error("Error generating PO");
    }
  };

  const filteredRecommendations = filterPriority === 'ALL'
    ? recommendations
    : recommendations.filter(r => r.priority === filterPriority);

  const stats = {
    critical: recommendations.filter(r => r.priority === 'CRITICAL').length,
    high: recommendations.filter(r => r.priority === 'HIGH').length,
    medium: recommendations.filter(r => r.priority === 'MEDIUM').length,
    totalCost: recommendations.reduce((sum, r) => sum + r.estimated_cost, 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-8 rounded-2xl border-2 border-blue-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">Auto-Reorder System</h1>
              <p className="text-white/90 text-base">Smart purchase order recommendations based on sales velocity</p>
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
              onClick={loadRecommendations}
              variant="outline"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Priority</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">{'<'} 3 days supply</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
                <p className="text-xs text-muted-foreground">{'<'} 7 days supply</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medium Priority</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
                <p className="text-xs text-muted-foreground">Monitor closely</p>
              </div>
              <Package className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Est. Cost</p>
                <p className="text-2xl font-bold">${stats.totalCost.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{recommendations.length} products</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-3">
        <Button
          variant={viewMode === 'all' ? 'default' : 'outline'}
          onClick={() => setViewMode('all')}
        >
          All Products
        </Button>
        <Button
          variant={viewMode === 'by-supplier' ? 'default' : 'outline'}
          onClick={() => setViewMode('by-supplier')}
        >
          By Supplier
        </Button>
      </div>

      {/* All Products View */}
      {viewMode === 'all' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Reorder Recommendations</CardTitle>
                <CardDescription>Products that need reordering based on sales velocity and stock levels</CardDescription>
              </div>
              <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="CRITICAL">Critical Only</SelectItem>
                  <SelectItem value="HIGH">High Only</SelectItem>
                  <SelectItem value="MEDIUM">Medium Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading recommendations...</div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">All Stocked!</h3>
                <p className="text-muted-foreground">No products need reordering at this time.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead className="text-center">Current</TableHead>
                      <TableHead className="text-center">Days Supply</TableHead>
                      <TableHead className="text-right">Avg Daily Sales</TableHead>
                      <TableHead className="text-right">Order Qty</TableHead>
                      <TableHead className="text-right">Est. Cost</TableHead>
                      <TableHead className="text-center">ABC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecommendations.map((rec) => (
                      <TableRow key={rec.product_id}>
                        <TableCell>
                          <Badge variant={
                            rec.priority === 'CRITICAL' ? 'destructive' :
                            rec.priority === 'HIGH' ? 'secondary' : 'outline'
                          } className={
                            rec.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {rec.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{rec.sku}</TableCell>
                        <TableCell className="font-medium">{rec.product_name}</TableCell>
                        <TableCell className="text-center">
                          <span className={rec.current_stock === 0 ? 'text-red-600 font-bold' : ''}>
                            {rec.current_stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={rec.days_of_supply < 3 ? 'destructive' : 'outline'}>
                            {rec.days_of_supply}d
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{rec.avg_daily_sales}</TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          {rec.recommended_order_qty}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${rec.estimated_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{rec.abc_class}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* By Supplier View */}
      {viewMode === 'by-supplier' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : groupedBySupplier.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No reorder recommendations</p>
            </div>
          ) : (
            groupedBySupplier.map((group) => (
              <Card key={group.supplier_id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{group.supplier_name || `Supplier ${group.supplier_id}`}</CardTitle>
                      <CardDescription>
                        {group.product_count} products · Est. ${group.total_estimated_cost.toFixed(2)}
                      </CardDescription>
                    </div>
                    <Button
                      className="pharmacy-button"
                      onClick={() => generatePOForSupplier(group.supplier_id)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Generate PO
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Priority</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Current Stock</TableHead>
                          <TableHead className="text-right">Order Qty</TableHead>
                          <TableHead className="text-right">Est. Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.products.map((rec) => (
                          <TableRow key={rec.product_id}>
                            <TableCell>
                              <Badge variant={rec.priority === 'CRITICAL' ? 'destructive' : rec.priority === 'HIGH' ? 'secondary' : 'outline'}>
                                {rec.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{rec.product_name}</div>
                                <div className="text-sm text-muted-foreground">{rec.sku}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{rec.current_stock}</TableCell>
                            <TableCell className="text-right font-bold text-blue-600">
                              {rec.recommended_order_qty}
                            </TableCell>
                            <TableCell className="text-right">${rec.estimated_cost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

