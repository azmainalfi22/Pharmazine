import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Receipt, Search, X, FileDown, Printer, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { downloadInvoicePDF, printInvoicePDF } from '@/utils/pdfGenerator';

interface Product {
  id: string;
  name: string;
  sku: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  supplier?: string;
  country?: string;
  stock_quantity: number;
  unit_price: number;
  mrp_unit?: number;
  cost_price: number;
  description?: string;
  unit_type?: string;
  unit_size?: string;
  unit_multiplier?: number;
  purchase_price?: number;
  selling_price?: number;
  created_at: string;
  updated_at: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Sale {
  id: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  discount?: number;
  tax?: number;
  net_amount: number;
  emi_enabled?: boolean;
  emi_months?: number | null;
  emi_amount?: number | null;
  created_at: string;
}

const Sales = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Determine active view based on current path
  const getActiveView = () => {
    if (location.pathname === '/sales/history') return 'history';
    return 'pos';
  };
  
  const [activeView, setActiveView] = useState<'pos' | 'history'>(getActiveView());
  
  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'upay' | 'visa' | 'bank_transfer'>('cash');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  
  // EMI
  const [emiEnabled, setEmiEnabled] = useState(false);
  const [emiMonths, setEmiMonths] = useState<number>(3);
  const [emiInterestRate, setEmiInterestRate] = useState(12);

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, []);

  useEffect(() => {
    setActiveView(getActiveView());
  }, [location.pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F9 - Complete sale
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && customerName.trim()) {
          processSale();
        }
      }
      // F5 - Focus search
      if (e.key === 'F5') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      }
      // ESC - Clear cart
      if (e.key === 'Escape' && cart.length > 0) {
        if (confirm('Clear cart?')) {
          setCart([]);
        }
      }
      // F2 - New customer
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('customer-name')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart, customerName]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProducts();
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const data = await apiClient.getSales();
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to fetch sales');
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        unitPrice: product.unit_price,
        totalPrice: product.unit_price
      }]);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash': return 'default';
      case 'card': return 'secondary';
      case 'upi': return 'outline';
      case 'bank_transfer': return 'destructive';
      default: return 'default';
    }
  };

  const handleDownloadInvoice = async (sale: Sale) => {
    try {
      // Fetch sale items
      const saleItems = await apiClient.getSaleItems(sale.id);
      
      const invoiceData = {
        invoice_no: sale.id.substring(0, 8).toUpperCase(),
        date: sale.created_at,
        customer_name: sale.customer_name,
        customer_phone: sale.customer_phone || undefined,
        customer_address: undefined,
        items: saleItems.map((item: any) => ({
          product_name: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: 0,
          total: item.total_price,
        })),
        subtotal: sale.total_amount,
        tax: sale.tax,
        discount: sale.discount,
        total: sale.net_amount,
        payment_type: sale.payment_method,
        payment_status: sale.payment_status,
      };
      
      downloadInvoicePDF(invoiceData);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handlePrintInvoice = async (sale: Sale) => {
    try {
      // Fetch sale items
      const saleItems = await apiClient.getSaleItems(sale.id);
      
      const invoiceData = {
        invoice_no: sale.id.substring(0, 8).toUpperCase(),
        date: sale.created_at,
        customer_name: sale.customer_name,
        customer_phone: sale.customer_phone || undefined,
        customer_address: undefined,
        items: saleItems.map((item: any) => ({
          product_name: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: 0,
          total: item.total_price,
        })),
        subtotal: sale.total_amount,
        tax: sale.tax,
        discount: sale.discount,
        total: sale.net_amount,
        payment_type: sale.payment_method,
        payment_status: sale.payment_status,
      };
      
      printInvoicePDF(invoiceData);
      toast.success('Invoice sent to printer');
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Failed to print invoice');
    }
  };

  const calculateTotals = () => {
    const grossAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = (grossAmount * discount) / 100;
    const taxableAmount = grossAmount - discountAmount;
    const taxAmount = (taxableAmount * tax) / 100;
    const netAmount = taxableAmount + taxAmount;
    
    return { grossAmount, discountAmount, taxAmount, netAmount };
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const { grossAmount, discountAmount, taxAmount, netAmount } = calculateTotals();
      
      const saleData = {
        customer_name: customerName,
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        payment_method: paymentMethod,
        payment_status: 'completed',
        total_amount: grossAmount,
        discount: discountAmount,
        tax: taxAmount,
        net_amount: netAmount,
        emi_enabled: emiEnabled,
        emi_months: emiEnabled ? emiMonths : null,
        emi_amount: emiEnabled ? netAmount / emiMonths : null,
      };

      const sale = await apiClient.createSale(saleData);

      // Create sale items
      for (const item of cart) {
        await apiClient.createSaleItem({
          sale_id: sale.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
        });
      }

      toast.success('Sale completed successfully!');
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setDiscount(0);
      setTax(0);
      setEmiEnabled(false);
      
      // Refresh sales
      fetchSales();
      
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Failed to process sale');
    }
  };

  const { grossAmount, discountAmount, taxAmount, netAmount } = calculateTotals();

  return (
    <div className="space-y-6 p-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">Point of Sale Terminal</h1>
            <p className="text-white/90 text-base max-w-2xl">
              Complete sales with multiple payment options and EMI management
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
            <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
            <span className="text-white font-medium text-sm">System Active</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {/* POS Terminal Content */}
        {activeView === 'pos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Selection */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-card/95">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
                          <Search className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold">Product Selection</span>
                      </CardTitle>
                      <Badge variant="outline" className="text-sm font-medium px-3 py-1 border-2">
                        {filteredProducts.length} Products
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="product-search"
                        placeholder="Search products by name, SKU, or brand... (Press F5)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="pl-12 h-12 text-base border-2 bg-background"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setSearchQuery('')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-2 custom-scrollbar">
                      {loading ? (
                        Array.from({ length: 12 }).map((_, i) => (
                          <Skeleton key={i} className="h-24 rounded-xl" />
                        ))
                      ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                          <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                          <p className="font-medium text-base">No products found</p>
                          <p className="text-sm mt-1">Try adjusting your search criteria</p>
                        </div>
                      ) : (
                        filteredProducts.map((product) => {
                          const unitDisplay = product.unit_type 
                            ? `${product.unit_size || ''} ${product.unit_type}`.trim() 
                            : '';
                          const sellingPrice = product.selling_price || product.unit_price;
                          
                          return (
                          <Card 
                            key={product.id} 
                            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-teal-400/50 hover:-translate-y-1 bg-gradient-to-br from-card to-card/95" 
                            onClick={() => addToCart(product)}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                      {product.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-mono truncate">{product.sku}</p>
                                    {unitDisplay && (
                                      <Badge variant="secondary" className="text-xs font-mono">
                                        {unitDisplay}
                                      </Badge>
                                    )}
                                    {product.brand && (
                                      <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
                                    )}
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs px-2 py-0.5 flex-shrink-0 border-2",
                                      product.stock_quantity > 10 ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-300" :
                                      product.stock_quantity > 0 ? "border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-300" :
                                      "border-red-200 text-red-700 dark:border-red-800 dark:text-red-300"
                                    )}
                                  >
                                    {product.stock_quantity} {product.unit_type || 'units'}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <span className="text-lg font-bold text-teal-600 dark:text-teal-400">৳{sellingPrice.toLocaleString()}</span>
                                  <Button 
                                    size="sm" 
                                    variant="default" 
                                    className="h-8 w-8 p-0 bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-lg" 
                                    onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                  >
                                    <Plus className="h-4 w-4 text-white" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cart & Checkout */}
              <div className="space-y-4">
                <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-card/95">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-bold">Cart ({cart.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="font-medium text-base">Cart is empty</p>
                        <p className="text-sm mt-1">Add products to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                        {cart.map((item) => (
                          <div key={item.product.id} className="flex items-center gap-3 p-4 border-2 rounded-xl hover:shadow-md transition-shadow bg-background">
                            <div className="flex-1 space-y-1.5">
                              <h4 className="font-semibold text-sm">{item.product.name}</h4>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>৳{item.unitPrice.toLocaleString()} × {item.quantity}</span>
                                <span className="font-semibold text-foreground">= ৳{item.totalPrice.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                className="h-8 w-8 border-2"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span className="text-sm font-bold w-10 text-center bg-muted px-2 py-1 rounded-md">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                className="h-8 w-8 border-2"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                title="Remove from cart"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Info */}
                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/95">
                  <CardHeader className="pb-4 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-950/10 dark:to-emerald-950/10">
                    <CardTitle className="text-lg font-bold">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="font-medium">Name *</Label>
                      <Input
                        id="customer-name"
                        placeholder="Enter customer name (F2)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-11 border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone" className="font-medium">Phone</Label>
                      <Input
                        id="customerPhone"
                        placeholder="Enter phone number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="h-11 border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail" className="font-medium">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="Enter email address"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="h-11 border-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Options */}
                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/95">
                  <CardHeader className="pb-4 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-950/10 dark:to-emerald-950/10">
                    <CardTitle className="text-lg font-bold">Payment Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4" />
                              Cash
                            </div>
                          </SelectItem>
                          <SelectItem value="bkash">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              bKash
                            </div>
                          </SelectItem>
                          <SelectItem value="upay">Upay</SelectItem>
                          <SelectItem value="visa">Visa/MasterCard</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discount">Discount (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          max="100"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax">Tax (%)</Label>
                        <Input
                          id="tax"
                          type="number"
                          min="0"
                          value={tax}
                          onChange={(e) => setTax(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* EMI Options */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="emi"
                          checked={emiEnabled}
                          onCheckedChange={setEmiEnabled}
                        />
                        <Label htmlFor="emi">Enable EMI</Label>
                      </div>
                      {emiEnabled && (
                        <div className="space-y-2">
                          <Label htmlFor="emiMonths">EMI Months</Label>
                          <Select value={emiMonths.toString()} onValueChange={(value) => setEmiMonths(Number(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 Months</SelectItem>
                              <SelectItem value="6">6 Months</SelectItem>
                              <SelectItem value="12">12 Months</SelectItem>
                              <SelectItem value="24">24 Months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="border-2 shadow-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20">
                  <CardHeader className="pb-4 border-b-2 border-teal-200 dark:border-teal-800">
                    <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Gross Amount:</span>
                        <span className="font-semibold">৳{grossAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount ({discount}%):</span>
                        <span className="font-semibold text-destructive">-৳{discountAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax ({tax}%):</span>
                        <span className="font-semibold">৳{taxAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg border-2">
                      <span className="text-base font-bold">Total:</span>
                      <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">৳{netAmount.toLocaleString()}</span>
                    </div>
                    {emiEnabled && (
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">Monthly EMI ({emiMonths} months):</div>
                        <div className="text-base font-semibold">৳{(netAmount / emiMonths).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      </div>
                    )}
                    <Button
                      onClick={processSale}
                      className="w-full h-12 text-base font-bold bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all border-0"
                      size="lg"
                      disabled={cart.length === 0 || !customerName.trim()}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Complete Sale (F9)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Sales History Content */}
        {activeView === 'history' && (
          <div className="space-y-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Sales History</h2>
                  <p className="text-white/90 text-base">View and manage all sales transactions</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                  <span className="text-white font-medium text-sm">
                    {sales.length} {sales.length === 1 ? 'sale' : 'sales'}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No sales found. Start by creating your first sale.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.customer_name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {sale.customer_phone && (
                                <div className="text-sm">{sale.customer_phone}</div>
                              )}
                              {sale.customer_email && (
                                <div className="text-sm text-muted-foreground">{sale.customer_email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPaymentMethodBadge(sale.payment_method)}>
                              {sale.payment_method.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ৳{Number(sale.net_amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              {sale.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(sale.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadInvoice(sale)}
                                className="hover:bg-primary/10"
                                title="Download Invoice PDF"
                              >
                                <FileDown className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePrintInvoice(sale)}
                                className="hover:bg-primary/10"
                                title="Print Invoice"
                              >
                                <Printer className="h-4 w-4 text-green-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Sales;