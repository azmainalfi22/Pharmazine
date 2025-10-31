import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, ShoppingCart, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  category_id?: string;
  category?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

interface PurchaseItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  currentStock: number;
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

const PurchasePage = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [newItem, setNewItem] = useState({
    itemCode: '',
    itemName: '',
    category: '',
    currentStock: 0,
    quantity: 0,
    unitPrice: 0
  });

  // Product search states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiClient.getSuppliers();
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setNewItem({
      itemCode: product.sku,
      itemName: product.name,
      category: product.category || 'Unknown',
      currentStock: product.stock_quantity,
      quantity: 0,
      unitPrice: product.cost_price
    });
  };

  const handleAddItem = () => {
    if (!selectedProduct || newItem.quantity <= 0) {
      toast.error('Please select a product and enter quantity');
      return;
    }

    const item: PurchaseItem = {
      id: selectedProduct.id,
      itemCode: newItem.itemCode,
      itemName: newItem.itemName,
      category: newItem.category,
      currentStock: newItem.currentStock,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      totalValue: 0
    };

    setPurchaseItems((prevItems) => [...prevItems, item]);
    
    // Reset form
    setSelectedProduct(null);
    setSearchValue('');
    setShowDropdown(false);
    setNewItem({
      itemCode: '',
      itemName: '',
      category: '',
      currentStock: 0,
      quantity: 0,
      unitPrice: 0
    });
  };

  const removeItem = (id: string) => {
    setPurchaseItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const processPurchase = async () => {
    if (purchaseItems.length === 0) {
      toast.error('Please add items to process purchase');
      return;
    }

    if (!selectedSupplier) {
      toast.error('Please select a supplier');
      return;
    }

    try {
      for (const item of purchaseItems) {
        await apiClient.createStockTransaction({
          product_id: item.id,
          transaction_type: 'purchase',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          reference_id: referenceNumber || null,
          notes: notes || null,
        });
      }

      toast.success('Purchase completed successfully!');
      
      setPurchaseItems([]);
      setSelectedSupplier('');
      setReferenceNumber('');
      setNotes('');
      
      fetchProducts();
      
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase');
    }
  };

  // Minimal GRN flow: create purchase from current items and confirm GRN
  const createPurchaseAndConfirmGRN = async () => {
    if (purchaseItems.length === 0) {
      toast.error('Please add items to create a GRN');
      return;
    }
    if (!selectedSupplier) {
      toast.error('Please select a supplier');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        supplier_id: selectedSupplier || undefined,
        invoice_no: referenceNumber || undefined,
        date: new Date().toISOString().slice(0, 10),
        items: purchaseItems.map((it) => ({
          product_id: it.id,
          qty: it.quantity,
          unit: 'piece',
          unit_price: it.unitPrice || 0,
        })),
        payment_status: 'pending' as const,
      };
      const created = await apiClient.createPurchase(payload as any);
      await apiClient.confirmGRN({ purchase_id: created.id, date: new Date().toISOString().slice(0, 10) });
      toast.success('GRN confirmed and stock updated');
      // reset
      setPurchaseItems([]);
      setSelectedSupplier('');
      setReferenceNumber('');
      setNotes('');
      await fetchProducts();
    } catch (err) {
      console.error('GRN error:', err);
      toast.error('Failed to confirm GRN');
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Purchase Management</h1>
            <p className="text-white/90 text-base">
              Record goods purchased from suppliers and update inventory
            </p>
          </div>
          <Button
            onClick={fetchProducts}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Purchase Details */}
      <div className="bg-card border-2 rounded-lg overflow-hidden mb-12 shadow-lg">
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 p-4 border-b-2 border-teal-200 dark:border-teal-800">
          <h2 className="text-lg font-bold text-teal-900 dark:text-teal-100">Purchase Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                placeholder="PO-2024-001"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
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
                      value={searchValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchValue(value);
                        setShowDropdown(value.length > 0 && !selectedProduct);
                        if (value === '') {
                          setSelectedProduct(null);
                          setShowDropdown(false);
                          setNewItem({
                            itemCode: '',
                            itemName: '',
                            category: '',
                            currentStock: 0,
                            quantity: 0,
                            unitPrice: 0
                          });
                        }
                      }}
                      className="border-0 focus:ring-0 text-right placeholder:text-right"
                    />
                    {showDropdown && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto mt-1" style={{scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9'}}>
                        <style>{`
                          .dropdown-scroll::-webkit-scrollbar {
                            width: 8px;
                          }
                          .dropdown-scroll::-webkit-scrollbar-track {
                            background: #f1f5f9;
                            border-radius: 4px;
                          }
                          .dropdown-scroll::-webkit-scrollbar-thumb {
                            background: #cbd5e1;
                            border-radius: 4px;
                          }
                          .dropdown-scroll::-webkit-scrollbar-thumb:hover {
                            background: #94a3b8;
                          }
                        `}</style>
                        <div className="dropdown-scroll">
                        {products
                          .filter(product =>
                            product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                            product.sku.toLowerCase().includes(searchValue.toLowerCase())
                          )
                          .slice(0, 15)
                          .map((product) => (
                            <div
                              key={product.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                handleProductSelect(product);
                                setSearchValue(product.sku);
                                setShowDropdown(false);
                              }}
                            >
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">
                                Code: {product.sku} | Stock: {product.stock_quantity} | Price: ৳{product.cost_price}
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
                    value={newItem.itemName}
                    readOnly
                    className="border-0 focus:ring-0 bg-gray-100 text-right placeholder:text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    placeholder="Category"
                    value={newItem.category}
                    readOnly
                    className="border-0 focus:ring-0 bg-gray-100 text-right placeholder:text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    value={newItem.currentStock}
                    readOnly
                    className="border-0 focus:ring-0 bg-gray-100 text-right placeholder:text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    placeholder="0"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                    className="border-0 focus:ring-0 text-right placeholder:text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    placeholder="0"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({...newItem, unitPrice: Number(e.target.value)})}
                    className="border-0 focus:ring-0 text-right placeholder:text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={handleAddItem}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
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
          {purchaseItems.length === 0 ? (
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
                    <TableHead className="text-white font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseItems.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="text-right py-4">{index + 1}</TableCell>
                      <TableCell className="text-right font-medium py-4">{item.itemCode}</TableCell>
                      <TableCell className="text-right py-4">{item.itemName}</TableCell>
                      <TableCell className="text-right text-gray-500 py-4">{item.category}</TableCell>
                      <TableCell className="text-right text-gray-500 py-4">{item.currentStock}</TableCell>
                      <TableCell className="text-right font-semibold py-4">{item.quantity}</TableCell>
                      <TableCell className="text-right font-semibold py-4">৳{item.unitPrice}</TableCell>
                      <TableCell className="text-right py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
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
        <div className="bg-gray-50 p-4 flex justify-end gap-3">
          <Button variant="outline" className="bg-gray-600 text-white hover:bg-gray-700">
            Cancel
          </Button>
          <Button onClick={createPurchaseAndConfirmGRN} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
            Confirm GRN (Quick)
          </Button>
          <Button onClick={processPurchase} className="bg-green-600 hover:bg-green-700 text-white">
            Complete Purchase
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
