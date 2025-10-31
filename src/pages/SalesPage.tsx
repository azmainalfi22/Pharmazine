import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, ShoppingCart, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  category: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface SaleItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const SalesPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, customersData] = await Promise.all([
        apiClient.getProducts(),
        apiClient.getCustomers(),
      ]);
      setProducts(productsData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToSale = (product: Product) => {
    if (product.stock_quantity <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    const existingItem = saleItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error('Cannot add more items than available in stock');
        return;
      }
      setSaleItems(saleItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setSaleItems([...saleItems, {
        product,
        quantity: 1,
        unitPrice: product.unit_price,
        totalPrice: product.unit_price
      }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setSaleItems(saleItems.filter(item => item.product.id !== productId));
    } else {
      const product = products.find(p => p.id === productId);
      if (product && quantity > product.stock_quantity) {
        toast.error('Cannot sell more items than available in stock');
        return;
      }
      setSaleItems(saleItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      ));
    }
  };

  const updateUnitPrice = (productId: string, unitPrice: number) => {
    setSaleItems(saleItems.map(item =>
      item.product.id === productId
        ? { ...item, unitPrice, totalPrice: item.quantity * unitPrice }
        : item
    ));
  };

  const removeFromSale = (productId: string) => {
    setSaleItems(saleItems.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const processSale = async () => {
    if (saleItems.length === 0) {
      toast.error('Please add products to sell');
      return;
    }

    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    try {
      // Create sale
      const sale = await apiClient.createSale({
        customer_id: selectedCustomer,
        net_amount: calculateTotal(),
        payment_method: paymentMethod as any,
        notes: 'POS Sale',
      });

      // Create sale items
      for (const item of saleItems) {
        await apiClient.createSaleItem({
          sale_id: sale.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
        });
      }

      // Create stock transactions for each item
      for (const item of saleItems) {
        await apiClient.createStockTransaction({
          product_id: item.product.id,
          transaction_type: 'sale',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          reference_id: sale.id,
          notes: 'Sale transaction',
        });
      }

      toast.success('Sale completed successfully!');
      
      // Reset form
      setSaleItems([]);
      setSelectedCustomer('');
      setSearchQuery('');
      
      // Refresh data
      fetchData();
      
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Failed to process sale');
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Sales Management</h1>
            <p className="text-white/90 text-base">
              Record goods sold to customers and update inventory
            </p>
          </div>
          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Sale Details */}
      <div className="bg-card border-2 rounded-lg overflow-hidden mb-12 shadow-lg">
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 p-4 border-b-2 border-teal-200 dark:border-teal-800">
          <h2 className="text-lg font-bold text-teal-900 dark:text-teal-100">Sale Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="upay">Upay</SelectItem>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      <div className="bg-white border rounded-lg overflow-hidden mb-12">
        {/* Header Row */}
        <div className="bg-gray-800 text-white">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-800">
                <TableHead className="text-white font-semibold text-right">Item Code</TableHead>
                <TableHead className="text-white font-semibold text-right">Item Name</TableHead>
                <TableHead className="text-white font-semibold text-right">Category</TableHead>
                <TableHead className="text-white font-semibold text-right">Current Stock</TableHead>
                <TableHead className="text-white font-semibold text-right">Quantity *</TableHead>
                <TableHead className="text-white font-semibold text-right">Unit Price</TableHead>
                <TableHead className="text-white font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </div>

        {/* Input Row */}
        <div className="bg-white">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="text-right">
                  <div className="relative w-full">
                    <Input
                      placeholder="Search product code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 focus:ring-0 text-right placeholder:text-right"
                    />
                    {searchQuery && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto mt-1">
                        <div className="p-2">
                          {filteredProducts.slice(0, 10).map((product) => (
                            <div
                              key={product.id}
                              className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => addToSale(product)}
                            >
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">
                                Code: {product.sku} | Stock: {product.stock_quantity} | Price: ৳{product.unit_price}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    placeholder="Product name"
                    readOnly
                    className="border-0 focus:ring-0 bg-gray-100 text-right placeholder:text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    placeholder="Category"
                    readOnly
                    className="border-0 focus:ring-0 bg-gray-100 text-right placeholder:text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    readOnly
                    className="border-0 focus:ring-0 bg-gray-100 text-right placeholder:text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    placeholder="0"
                    className="border-0 focus:ring-0 text-right placeholder:text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    placeholder="0"
                    className="border-0 focus:ring-0 text-right placeholder:text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                    disabled
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Items List Area */}
        <div className="bg-gray-50 p-6">
          {saleItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No items added yet</p>
              <p className="text-sm">Add items using the form above</p>
            </div>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800 hover:bg-gray-800">
                    <TableHead className="text-white font-semibold text-right">SL</TableHead>
                    <TableHead className="text-white font-semibold text-right">Item Code</TableHead>
                    <TableHead className="text-white font-semibold text-right">Item Name</TableHead>
                    <TableHead className="text-white font-semibold text-right">Category</TableHead>
                    <TableHead className="text-white font-semibold text-right">Current Stock</TableHead>
                    <TableHead className="text-white font-semibold text-right">Quantity</TableHead>
                    <TableHead className="text-white font-semibold text-right">Unit Price</TableHead>
                    <TableHead className="text-white font-semibold text-right">Total</TableHead>
                    <TableHead className="text-white font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleItems.map((item, index) => (
                    <TableRow key={item.product.id} className="hover:bg-gray-50">
                      <TableCell className="text-right py-4">{index + 1}</TableCell>
                      <TableCell className="text-right font-medium py-4">{item.product.sku}</TableCell>
                      <TableCell className="text-right py-4">{item.product.name}</TableCell>
                      <TableCell className="text-right text-gray-500 py-4">{item.product.category}</TableCell>
                      <TableCell className="text-right text-gray-500 py-4">{item.product.stock_quantity}</TableCell>
                      <TableCell className="text-right font-semibold py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold py-4">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateUnitPrice(item.product.id, Number(e.target.value))}
                          className="text-xs h-8 w-20 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold py-4">৳{item.totalPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromSale(item.product.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-between items-center">
          <div className="text-lg font-bold">
            Total: ৳{calculateTotal().toLocaleString()}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-gray-600 text-white hover:bg-gray-700">
              Cancel
            </Button>
            <Button 
              onClick={processSale} 
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={saleItems.length === 0 || !selectedCustomer}
            >
              Complete Sale
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
