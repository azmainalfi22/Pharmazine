import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  ShoppingBag, 
  Package, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Receipt,
  Calendar,
  Building2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const purchaseItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  qty: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.coerce.number().min(0, 'Unit price must be non-negative'),
  unit: z.string().optional(),
  batch_no: z.string().optional(),
  expiry_date: z.string().optional(),
  mrp: z.coerce.number().optional(),
  gst_percent: z.coerce.number().optional(),
});

const purchaseFormSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  invoice_no: z.string().optional(),
  date: z.string().optional(),
  payment_status: z.string().default('pending'),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
});

const grnFormSchema = z.object({
  purchase_id: z.string().min(1, 'Purchase is required'),
  date: z.string().optional(),
});

interface Purchase {
  id: string;
  supplier_id: string | null;
  invoice_no: string | null;
  date: string | null;
  total_amount: number;
  payment_status: string;
  created_at: string;
  items?: PurchaseItem[];
  supplier?: { name: string };
}

interface PurchaseItem {
  id: string;
  product_id: string;
  qty: number;
  unit_price: number;
  total_price: number;
  product?: { name: string; sku: string };
}

interface GRN {
  id: string;
  purchase_id: string;
  date: string | null;
  created_by: string | null;
  purchase?: Purchase;
}

const Purchase = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'purchases' | 'grns'>('purchases');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalAmount: 0,
    pendingPurchases: 0,
    completedGRNs: 0,
  });
  
  // Dialog states
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [grnDialogOpen, setGrnDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const purchaseForm = useForm<z.infer<typeof purchaseFormSchema>>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplier_id: '',
      invoice_no: '',
      date: new Date().toISOString().split('T')[0],
      payment_status: 'pending',
      items: [],
    },
  });

  const grnForm = useForm<z.infer<typeof grnFormSchema>>({
    resolver: zodResolver(grnFormSchema),
    defaultValues: {
      purchase_id: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterPurchases();
  }, [purchases, searchTerm, paymentFilter]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPurchases(),
        fetchGRNs(),
        fetchProducts(),
        fetchSuppliers(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const data = await apiClient.getPurchases();
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load purchases');
    }
  };

  const fetchGRNs = async () => {
    try {
      const data = await apiClient.getGRNs();
      setGrns(data || []);
    } catch (error) {
      console.error('Error fetching GRNs:', error);
      toast.error('Failed to load GRNs');
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiClient.getSuppliers();
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const filterPurchases = () => {
    let filtered = [...purchases];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.items?.some(item => item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Payment status filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter((p) => p.payment_status === paymentFilter);
    }

    setFilteredPurchases(filtered);

    // Update stats
    const totalAmount = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const pendingPurchases = purchases.filter(p => p.payment_status === 'pending').length;
    const completedGRNs = grns.length;

    setStats({
      totalPurchases: purchases.length,
      totalAmount,
      pendingPurchases,
      completedGRNs,
    });
  };

  const handleCreatePurchase = async (values: z.infer<typeof purchaseFormSchema>) => {
    try {
      await apiClient.createPurchase({
        ...values,
        created_by: user?.id || '',
      });
      toast.success('Purchase created successfully');
      setPurchaseDialogOpen(false);
      purchaseForm.reset();
      fetchAllData();
    } catch (error: any) {
      console.error('Error creating purchase:', error);
      toast.error(error.message || 'Failed to create purchase');
    }
  };

  const handleConfirmGRN = async (values: z.infer<typeof grnFormSchema>) => {
    try {
      await apiClient.confirmGRN({
        ...values,
        created_by: user?.id || '',
      });
      toast.success('GRN confirmed successfully. Stock has been updated.');
      setGrnDialogOpen(false);
      grnForm.reset();
      fetchAllData();
    } catch (error: any) {
      console.error('Error confirming GRN:', error);
      toast.error(error.message || 'Failed to confirm GRN');
    }
  };

  const addPurchaseItem = () => {
    const currentItems = purchaseForm.getValues('items') || [];
    purchaseForm.setValue('items', [
      ...currentItems,
      {
        product_id: '',
        qty: 1,
        unit_price: 0,
        unit: '',
        batch_no: '',
        expiry_date: '',
        mrp: 0,
        gst_percent: 0,
      },
    ]);
  };

  const removePurchaseItem = (index: number) => {
    const currentItems = purchaseForm.getValues('items') || [];
    purchaseForm.setValue('items', currentItems.filter((_, i) => i !== index));
  };

  const viewPurchaseDetails = async (purchaseId: string) => {
    try {
      const purchase = await apiClient.getPurchase(purchaseId);
      setSelectedPurchase(purchase);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching purchase details:', error);
      toast.error('Failed to load purchase details');
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'N/A';
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return 'N/A';
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'N/A';
  };

  const purchasesWithoutGRN = purchases.filter(p => 
    !grns.some(g => g.purchase_id === p.id)
  );

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPurchases = filteredPurchases.slice(startIndex, startIndex + itemsPerPage);

  const statCards = [
    {
      title: 'Total Purchases',
      value: stats.totalPurchases.toString(),
      icon: ShoppingBag,
      gradient: 'from-blue-500 to-indigo-600',
      change: 'Active orders',
    },
    {
      title: 'Total Amount',
      value: `৳${stats.totalAmount.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      change: 'Total value',
    },
    {
      title: 'Pending Payment',
      value: stats.pendingPurchases.toString(),
      icon: Clock,
      gradient: 'from-orange-500 to-red-600',
      change: 'Awaiting payment',
    },
    {
      title: 'Completed GRNs',
      value: stats.completedGRNs.toString(),
      icon: CheckCircle2,
      gradient: 'from-purple-500 to-pink-600',
      change: 'Stock received',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
              Purchases & GRN Management
            </h1>
            <p className="text-white/90 text-base max-w-2xl">
              Manage purchase orders and Goods Receipt Notes with comprehensive tracking
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchAllData}
              disabled={loading}
              variant="outline"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {activeTab === 'purchases' && (
              <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    New Purchase
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Create New Purchase</DialogTitle>
                  </DialogHeader>
                  <Form {...purchaseForm}>
                    <form onSubmit={purchaseForm.handleSubmit(handleCreatePurchase)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={purchaseForm.control}
                          name="supplier_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Supplier *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11 border-2">
                                    <SelectValue placeholder="Select supplier" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                      {supplier.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={purchaseForm.control}
                          name="invoice_no"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Invoice Number</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-11 border-2" placeholder="Enter invoice number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={purchaseForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Purchase Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} className="h-11 border-2" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={purchaseForm.control}
                          name="payment_status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11 border-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="partial">Partial</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base font-semibold">Purchase Items *</FormLabel>
                          <Button type="button" variant="outline" onClick={addPurchaseItem} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Item
                          </Button>
                        </div>

                        {purchaseForm.watch('items')?.map((item, index) => (
                          <Card key={index} className="p-4 border-2">
                            <div className="grid grid-cols-12 gap-4 items-end">
                              <FormField
                                control={purchaseForm.control}
                                name={`items.${index}.product_id`}
                                render={({ field }) => (
                                  <FormItem className="col-span-5">
                                    <FormLabel>Product *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="h-11 border-2">
                                          <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {products.map((product) => (
                                          <SelectItem key={product.id} value={product.id}>
                                            {product.name} ({product.sku})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={purchaseForm.control}
                                name={`items.${index}.qty`}
                                render={({ field }) => (
                                  <FormItem className="col-span-2">
                                    <FormLabel>Qty *</FormLabel>
                                    <FormControl>
                                      <Input type="number" step="0.01" {...field} className="h-11 border-2" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={purchaseForm.control}
                                name={`items.${index}.unit_price`}
                                render={({ field }) => (
                                  <FormItem className="col-span-2">
                                    <FormLabel>Unit Price (৳) *</FormLabel>
                                    <FormControl>
                                      <Input type="number" step="0.01" {...field} className="h-11 border-2" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="col-span-2 text-right">
                                <div className="text-sm text-muted-foreground mb-1">Total</div>
                                <div className="font-semibold text-base">
                                  ৳{((item.qty || 0) * (item.unit_price || 0)).toFixed(2)}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePurchaseItem(index)}
                                className="col-span-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <div className="text-lg font-semibold">Total Amount:</div>
                        <div className="text-2xl font-bold text-primary">
                          ৳{purchaseForm.watch('items')?.reduce((sum, item) => 
                            sum + ((item.qty || 0) * (item.unit_price || 0)), 0
                          ).toFixed(2) || '0.00'}
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Purchase</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
            {activeTab === 'grns' && (
              <Dialog open={grnDialogOpen} onOpenChange={setGrnDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm GRN
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Confirm Goods Receipt Note</DialogTitle>
                  </DialogHeader>
                  <Form {...grnForm}>
                    <form onSubmit={grnForm.handleSubmit(handleConfirmGRN)} className="space-y-4">
                      <FormField
                        control={grnForm.control}
                        name="purchase_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purchase Order *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 border-2">
                                  <SelectValue placeholder="Select purchase order" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {purchasesWithoutGRN.map((purchase) => (
                                  <SelectItem key={purchase.id} value={purchase.id}>
                                    Invoice: {purchase.invoice_no || purchase.id.slice(0, 8)} - ৳{purchase.total_amount.toLocaleString()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={grnForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GRN Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="h-11 border-2" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="bg-muted/50 p-4 rounded-lg border-2">
                        <p className="text-sm text-muted-foreground">
                          Confirming this GRN will update stock quantities for all items in the purchase order.
                        </p>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setGrnDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Confirm GRN</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'purchases' | 'grns')} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/30 border-2">
          <TabsTrigger value="purchases" className="text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Purchases ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="grns" className="text-base font-semibold data-[state=active]:bg-background data-[state=active]:shadow-lg">
            <Receipt className="h-4 w-4 mr-2" />
            GRNs ({grns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-6">
          <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-card/95">
            <CardHeader className="pb-4 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-950/10 dark:to-emerald-950/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-2xl font-bold">Purchase Orders</CardTitle>
                <div className="flex gap-2">
                  <Select value={paymentFilter} onValueChange={(v: any) => setPaymentFilter(v)}>
                    <SelectTrigger className="w-[150px] h-10 border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg border mb-6">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice, supplier, or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-11 bg-background border-2"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-background px-4 py-2 rounded-lg border-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span>{filteredPurchases.length} {filteredPurchases.length === 1 ? 'Purchase' : 'Purchases'}</span>
                </div>
              </div>

              <div className="rounded-xl border-2 overflow-hidden bg-card shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-xs uppercase">Invoice</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Supplier</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Items</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Total Amount</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Payment Status</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Date</TableHead>
                      <TableHead className="font-semibold text-xs uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : paginatedPurchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                          {searchTerm || paymentFilter !== 'all' ? 'No purchases match your filters.' : 'No purchase orders found. Create your first purchase to get started.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-medium">
                            {purchase.invoice_no || `PO-${purchase.id.slice(0, 8)}`}
                          </TableCell>
                          <TableCell>{getSupplierName(purchase.supplier_id)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {purchase.items?.length || 0} items
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-base">
                            ৳{purchase.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={purchase.payment_status === 'completed' ? 'default' : 'secondary'}
                              className={purchase.payment_status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : ''}
                            >
                              {purchase.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {purchase.date ? format(new Date(purchase.date), 'MMM dd, yyyy') : 
                             format(new Date(purchase.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => viewPurchaseDetails(purchase.id)}
                                className="hover:bg-primary/10 h-9 w-9"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4 text-primary" />
                              </Button>
                              {!grns.some(g => g.purchase_id === purchase.id) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    grnForm.setValue('purchase_id', purchase.id);
                                    setGrnDialogOpen(true);
                                  }}
                                  className="hover:bg-green-500/10 h-9 w-9"
                                  title="Create GRN"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-muted/20 rounded-b-xl mt-4">
                  <div className="text-sm text-muted-foreground font-medium">
                    Showing <span className="text-foreground font-semibold">{startIndex + 1}</span> to{' '}
                    <span className="text-foreground font-semibold">{Math.min(startIndex + itemsPerPage, filteredPurchases.length)}</span> of{' '}
                    <span className="text-foreground font-semibold">{filteredPurchases.length}</span> purchases
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
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-9 border-2"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grns" className="space-y-6">
          <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-card/95">
            <CardHeader className="pb-4 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-950/10 dark:to-emerald-950/10">
              <CardTitle className="text-2xl font-bold">Goods Receipt Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-xl border-2 overflow-hidden bg-card shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-xs uppercase">GRN ID</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Purchase Invoice</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Date</TableHead>
                      <TableHead className="font-semibold text-xs uppercase">Created By</TableHead>
                      <TableHead className="font-semibold text-xs uppercase text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : grns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                          No GRNs found. Confirm a purchase order to create a GRN.
                        </TableCell>
                      </TableRow>
                    ) : (
                      grns.map((grn) => {
                        const purchase = purchases.find(p => p.id === grn.purchase_id);
                        return (
                          <TableRow key={grn.id}>
                            <TableCell className="font-medium font-mono">
                              {grn.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              {purchase?.invoice_no || `PO-${grn.purchase_id.slice(0, 8)}`}
                            </TableCell>
                            <TableCell>
                              {grn.date ? format(new Date(grn.date), 'MMM dd, yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">System</TableCell>
                            <TableCell>
                              <div className="flex justify-end">
                                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Purchase Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Purchase Order Details</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Invoice Number</div>
                  <div className="font-semibold">{selectedPurchase.invoice_no || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Supplier</div>
                  <div className="font-semibold">{getSupplierName(selectedPurchase.supplier_id)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Purchase Date</div>
                  <div className="font-semibold">
                    {selectedPurchase.date ? format(new Date(selectedPurchase.date), 'MMM dd, yyyy') : 
                     format(new Date(selectedPurchase.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Payment Status</div>
                  <Badge variant={selectedPurchase.payment_status === 'completed' ? 'default' : 'secondary'}>
                    {selectedPurchase.payment_status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-primary">৳{selectedPurchase.total_amount.toLocaleString()}</div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPurchase.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{getProductName(item.product_id)}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>৳{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">৳{item.total_price.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchase;
