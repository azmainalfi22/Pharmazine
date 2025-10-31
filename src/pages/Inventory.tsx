import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle, ChevronRight, RefreshCw, ShoppingCart, RotateCcw, Warehouse, ArrowRightLeft, Settings, Package2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { StockTransactionDialog } from '@/components/inventory/StockTransactionDialog';
import { ProductFormDialog } from '@/components/inventory/ProductFormDialog';
import PurchasePage from './PurchasePage';
import SalesReturnPage from './SalesReturnPage';
import OpeningStockPage from './OpeningStockPage';
import StockAdjustmentPage from './StockAdjustmentPage';
import MiscReceivePage from './MiscReceivePage';
import TransferInPage from './TransferInPage';
import SalesPage from './SalesPage';
import SupplierReturnPage from './SupplierReturnPage';
import ProductionOutPage from './ProductionOutPage';
import PurchaseReturnPage from './PurchaseReturnPage';
import StockAdjustmentOutPage from './StockAdjustmentOutPage';
import TransferOutPage from './TransferOutPage';
import MiscIssuePage from './MiscIssuePage';

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  reorder_level?: number;
  category?: string;
  unit_type?: string;
  unit_size?: string;
  unit_multiplier?: number;
  purchase_price?: number;
  selling_price?: number;
}

const stockInOptions = [
  { id: 'purchase', label: 'Purchase', description: 'Record goods purchased from suppliers', icon: ShoppingCart, hasChevron: true },
  { id: 'sales_return', label: 'Sales Return', description: 'Manage returned items from customers', icon: RotateCcw, hasChevron: false },
  { id: 'opening_stock', label: 'Opening Stock', description: 'Set initial stock levels', icon: Warehouse, hasChevron: true },
  { id: 'transfer_in', label: 'Transfer from Other Store', description: 'Receive stock from other locations', icon: ArrowRightLeft, hasChevron: false },
  { id: 'stock_adjustment_in', label: 'Stock Adjustment', description: 'Adjust stock levels (increase)', icon: Settings, hasChevron: true },
  { id: 'misc_receive', label: 'Misc/Others Receive', description: 'Handle miscellaneous incoming stock', icon: Package2, hasChevron: false },
];

const stockOutOptions = [
  { id: 'sales', label: 'Sales', description: 'Record goods sold to customers', icon: ShoppingCart, hasChevron: true },
  { id: 'supplier-return', label: 'Supplier Return', description: 'Return stock to suppliers', icon: RotateCcw, hasChevron: false },
  { id: 'production-out', label: 'Production Out/Consume', description: 'Stock consumed for production', icon: Package, hasChevron: true },
  { id: 'purchase-return', label: 'Purchase Return', description: 'Return purchased items to suppliers', icon: ArrowRightLeft, hasChevron: false },
  { id: 'stock-adjustment', label: 'Stock Adjustment', description: 'Adjust stock levels (decrease)', icon: Settings, hasChevron: true },
  { id: 'transfer-out', label: 'Transfer to Other Store', description: 'Send stock to other locations', icon: ArrowRightLeft, hasChevron: false },
  { id: 'misc-issue', label: 'Misc/Others Issue', description: 'Handle miscellaneous stock issues', icon: Package2, hasChevron: false },
];

const Inventory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Determine active view based on current path
  const getActiveView = () => {
    if (location.pathname === '/inventory/stock-in') return 'stock-in';
    if (location.pathname === '/inventory/stock-out') return 'stock-out';
    if (location.pathname.startsWith('/inventory/stock-in/')) return 'stock-in-activity';
    if (location.pathname.startsWith('/inventory/stock-out/')) return 'stock-out-activity';
    return 'overview';
  };
  
  const [activeView, setActiveView] = useState<'overview' | 'stock-in' | 'stock-out' | 'stock-in-activity' | 'stock-out-activity'>(getActiveView());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<{ id: string; label: string } | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const newActiveView = getActiveView();
    console.log('Path changed to:', location.pathname, 'Active view:', newActiveView);
    setActiveView(newActiveView);
    
    // Auto-refresh products when returning to overview
    if (newActiveView === 'overview') {
      console.log('Auto-refreshing products for overview');
      // Add a small delay to ensure the component is fully rendered
      setTimeout(() => {
        fetchProducts();
      }, 100);
    }
  }, [location.pathname]);

  // Additional refresh on window focus (when user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (activeView === 'overview') {
        console.log('Window focused, refreshing products');
        fetchProducts();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeView]);

  // Force refresh when component becomes visible (additional safety)
  useEffect(() => {
    if (activeView === 'overview') {
      console.log('Component mounted/updated for overview, refreshing products');
      fetchProducts();
    }
  }, [activeView]);

  const fetchProducts = async (showToast = false) => {
    try {
      setLoading(true);
      const data = await apiClient.getProducts();
      setProducts(data || []);
      if (showToast) {
        toast.success('Products refreshed successfully');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransactionClick = (transactionId: string, transactionLabel: string) => {
    // Navigate to Purchase page for purchase transactions
    if (transactionId === 'purchase') {
      navigate('/purchase');
      return;
    }
    
    setSelectedTransaction({ id: transactionId, label: transactionLabel });
    setDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await apiClient.deleteProduct(productToDelete.id);
      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  return (
    <div className="space-y-6">

      {/* Content Area */}
      <div className="space-y-6">

        {/* Product Overview Content */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Product Overview</h2>
                  <p className="text-white/90 text-base">Manage your pharmacy inventory and track stock levels</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => fetchProducts(true)}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2 h-10 border-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="font-medium">Refresh</span>
                  </Button>
                  <Button className="gap-2 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all border-0" onClick={() => setProductDialogOpen(true)}>
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Add Product</span>
                  </Button>
                </div>
              </div>
            </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, SKU, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-11 bg-background border-2"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-background px-4 py-2 rounded-lg border-2">
                  <Package className="h-4 w-4" />
                  <span>{filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}</span>
                </div>
              </div>
              
              <div className="rounded-xl border-2 overflow-hidden bg-card shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-xs uppercase">ID</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Product Name</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">SKU</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Category</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Unit</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Stock</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Purchase</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Selling</TableHead>
                      <TableHead className="font-semibold text-xs uppercase text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          {searchQuery ? 'No products match your search.' : 'No products found. Add your first product to get started.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((product) => {
                const isLowStock = product.stock_quantity <= product.reorder_level;
                const unitDisplay = product.unit_type 
                  ? `${product.unit_size || ''} ${product.unit_type}`.trim() 
                  : 'N/A';
                
                return (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {product.id.slice(0, 4)}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {product.name}
                                {isLowStock && (
                                  <Badge variant="destructive" className="gap-1 text-xs">
                                    <AlertTriangle className="h-3 w-3" />
                                    Low Stock
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {unitDisplay}
                              </Badge>
                            </TableCell>
                            <TableCell className={isLowStock ? 'text-destructive font-semibold' : ''}>
                              {product.stock_quantity} {product.unit_type ? (product.unit_type === 'piece' ? 'pcs' : product.unit_type) : 'units'}
                            </TableCell>
                            <TableCell>৳{(product.purchase_price || product.cost_price || 0).toLocaleString()}</TableCell>
                            <TableCell className="font-semibold">৳{(product.selling_price || product.unit_price || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                        <Button 
                                  variant="ghost"
                                  size="icon"
                          onClick={() => {
                            setSelectedProduct(product);
                            setProductDialogOpen(true);
                          }}
                                  className="hover:bg-teal-500/10 h-9 w-9"
                                  title="Edit Product"
                                >
                                  <Pencil className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setTransactionDialogOpen(true);
                                  }}
                                  className="hover:bg-blue-500/10 h-9 w-9"
                                  title="Stock Transaction"
                                >
                                  <Package className="h-4 w-4 text-blue-500" />
                                </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openDeleteDialog(product)}
                                      className="hover:bg-destructive/10 h-9 w-9"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {filteredProducts.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-muted/20">
              <div className="text-sm text-muted-foreground font-medium">
                Showing <span className="text-foreground font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-foreground font-semibold">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="text-foreground font-semibold">{filteredProducts.length}</span> products
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 border-2"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(filteredProducts.length / itemsPerPage)) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-9 w-9 ${currentPage === page ? 'shadow-lg' : 'border-2'}`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                  className="h-9 border-2"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

        {/* Stock IN Content */}
        {activeView === 'stock-in' && (
          <div className="space-y-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <ArrowDownCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Stock IN - Receiving Stock</h1>
                  <p className="text-white/90 text-base">
                    Manage all activities related to receiving stock into your store
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stockInOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Card 
                    key={option.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-teal-400/50 hover:scale-[1.02]"
                    onClick={() => handleTransactionClick(option.id, option.label)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{option.label}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{option.description}</p>
                        </div>
                        {option.hasChevron && (
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            </div>
          )}

        {/* Stock OUT Content */}
        {activeView === 'stock-out' && (
          <div className="space-y-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <ArrowUpCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Stock OUT - Issuing Stock</h1>
                  <p className="text-white/90 text-base">
                    Manage all activities related to removing stock from inventory
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stockOutOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Card 
                    key={option.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-teal-400/50 hover:scale-[1.02]"
                    onClick={() => handleTransactionClick(option.id, option.label)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{option.label}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{option.description}</p>
                        </div>
                        {option.hasChevron && (
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Stock IN Activity Content */}
        {activeView === 'stock-in-activity' && (
          <div className="space-y-6">
            {(() => {
              const pathSegments = location.pathname.split('/');
              const activityId = pathSegments[pathSegments.length - 1];
              
              // Render specific pages for each activity
              if (activityId === 'purchase') {
                return <PurchasePage />;
              }
              
              if (activityId === 'sales-return') {
                return <SalesReturnPage />;
              }
              
              if (activityId === 'opening-stock') {
                return <OpeningStockPage />;
              }
              
              if (activityId === 'stock-adjustment') {
                return <StockAdjustmentPage />;
              }
              
              if (activityId === 'misc-receive') {
                return <MiscReceivePage />;
              }
              
              if (activityId === 'transfer-in') {
                return <TransferInPage />;
              }
              
              const activity = stockInOptions.find(opt => opt.id === activityId);
              
              if (!activity) {
                return null;
              }
              
              const IconComponent = activity.icon;
              
              return (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-teal-500/10">
                      <IconComponent className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">{activity.label}</h1>
                      <p className="text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Manage {activity.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <IconComponent className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">{activity.label} Management</h3>
                        <p className="text-muted-foreground mb-6">
                          This feature will be implemented to handle {activity.label.toLowerCase()} operations.
                        </p>
                        <Button onClick={() => handleTransactionClick(activityId, activity.label)}>
                          Start {activity.label}
                        </Button>
              </div>
            </CardContent>
          </Card>
                </>
              );
            })()}
          </div>
        )}

        {/* Individual Stock OUT Activity Content */}
        {activeView === 'stock-out-activity' && (
          <div className="space-y-6">
            {(() => {
              const pathSegments = location.pathname.split('/');
              const activityId = pathSegments[pathSegments.length - 1];
              
              // Render specific pages for each activity
              if (activityId === 'sales') {
                return <SalesPage />;
              }
              
              if (activityId === 'supplier-return') {
                return <SupplierReturnPage />;
              }
              
              if (activityId === 'production-out') {
                return <ProductionOutPage />;
              }
              
              if (activityId === 'purchase-return') {
                return <PurchaseReturnPage />;
              }
              
              if (activityId === 'stock-adjustment') {
                return <StockAdjustmentOutPage />;
              }
              
              if (activityId === 'transfer-out') {
                return <TransferOutPage />;
              }
              
              if (activityId === 'misc-issue') {
                return <MiscIssuePage />;
              }
              
              const activity = stockOutOptions.find(opt => opt.id === activityId);
              
              if (!activity) return null;
              
              const IconComponent = activity.icon;
              
              return (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-teal-500/10">
                      <IconComponent className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">{activity.label}</h1>
                      <p className="text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  </div>

          <Card>
            <CardHeader>
                      <CardTitle>Manage {activity.label}</CardTitle>
            </CardHeader>
            <CardContent>
                      <div className="text-center py-12">
                        <IconComponent className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">{activity.label} Management</h3>
                        <p className="text-muted-foreground mb-6">
                          This feature will be implemented to handle {activity.label.toLowerCase()} operations.
                        </p>
                        <Button onClick={() => handleTransactionClick(activityId, activity.label)}>
                          Start {activity.label}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        )}
              </div>

      {selectedTransaction && (
        <StockTransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          transactionType={selectedTransaction.id}
          transactionLabel={selectedTransaction.label}
          products={products}
          onSuccess={fetchProducts}
        />
      )}

      <ProductFormDialog
        open={productDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open);
          if (!open) setSelectedProduct(null);
        }}
        onSuccess={fetchProducts}
        product={selectedProduct}
      />

      {/* Beautiful Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Delete Product
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{productToDelete?.name}"</span>?
              <br />
              <span className="text-sm text-red-600 font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <div className="text-sm text-gray-600 space-y-1">
              <div><span className="font-medium">Product ID:</span> {productToDelete?.id}</div>
              <div><span className="font-medium">SKU:</span> {productToDelete?.sku}</div>
              <div><span className="font-medium">Category:</span> {productToDelete?.category}</div>
              <div><span className="font-medium">Current Stock:</span> {productToDelete?.stock_quantity} units</div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="px-6 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
