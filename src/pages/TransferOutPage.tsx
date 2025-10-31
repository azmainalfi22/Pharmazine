import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Package, ArrowRightLeft, RefreshCw } from 'lucide-react';
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

interface TransferItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  category: string;
  current_stock: number;
  quantity: number;
  to_location: string;
  notes: string;
}

const TransferOutPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferNumber, setTransferNumber] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  // Product search states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [newItem, setNewItem] = useState({
    product_id: '',
    product_name: '',
    product_sku: '',
    category: '',
    current_stock: 0,
    quantity: 0,
    to_location: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const productsData = await apiClient.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setNewItem({
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      category: product.category || 'Unknown',
      current_stock: product.stock_quantity,
      quantity: 0,
      to_location: toLocation,
      notes: ''
    });
    setSearchValue(product.sku);
    setShowDropdown(false);
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (newItem.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (newItem.quantity > newItem.current_stock) {
      toast.error('Quantity cannot exceed current stock');
      return;
    }

    if (!newItem.to_location) {
      toast.error('Please enter destination location');
      return;
    }

    const newTransferItem: TransferItem = {
      id: Date.now().toString(),
      product_id: newItem.product_id,
      product_name: newItem.product_name,
      product_sku: newItem.product_sku,
      category: newItem.category,
      current_stock: newItem.current_stock,
      quantity: newItem.quantity,
      to_location: newItem.to_location,
      notes: newItem.notes
    };

    setTransferItems([...transferItems, newTransferItem]);
    
    // Reset form
    setSelectedProduct(null);
    setSearchValue('');
    setNewItem({
      product_id: '',
      product_name: '',
      product_sku: '',
      category: '',
      current_stock: 0,
      quantity: 0,
      to_location: toLocation,
      notes: ''
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setTransferItems(transferItems.filter(item => item.id !== itemId));
  };

  const handleSubmitTransfer = async () => {
    if (transferItems.length === 0) {
      toast.error('Please add at least one item to transfer');
      return;
    }

    try {
      for (const item of transferItems) {
        await apiClient.createStockTransaction({
          product_id: item.product_id,
          transaction_type: 'transfer_out',
          quantity: item.quantity,
          unit_price: 0,
          notes: `Transfer to ${item.to_location}. ${item.notes}`,
          to_location: item.to_location,
          reason: 'Transfer to Other Store'
        });
      }

      toast.success('Transfer out completed successfully');
      setTransferItems([]);
      setTransferNumber('');
      setToLocation('');
      setNotes('');
      fetchData(); // Refresh product data
    } catch (error) {
      console.error('Error processing transfer out:', error);
      toast.error('Failed to process transfer out');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <ArrowRightLeft className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Transfer to Other Store</h1>
            <p className="text-white/90 text-base">Send stock to other locations</p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchData} 
            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Transfer Details */}
      <div className="bg-card border-2 rounded-lg overflow-hidden mb-12 shadow-lg">
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 p-4 border-b-2 border-teal-200 dark:border-teal-800">
          <h2 className="text-lg font-bold text-teal-900 dark:text-teal-100">Transfer Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-number">Transfer Number</Label>
              <Input
                id="transfer-number"
                placeholder="TR-2024-001"
                value={transferNumber}
                onChange={(e) => setTransferNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-location">To Location *</Label>
              <Input
                id="to-location"
                placeholder="Store Name or Location"
                value={toLocation}
                onChange={(e) => {
                  setToLocation(e.target.value);
                  setNewItem({...newItem, to_location: e.target.value});
                }}
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
                <TableHead className="text-white font-semibold text-right">Notes</TableHead>
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
                            product_id: '',
                            product_name: '',
                            product_sku: '',
                            category: '',
                            current_stock: 0,
                            quantity: 0,
                            to_location: toLocation,
                            notes: ''
                          });
                        }
                      }}
                      className="border-0 focus:ring-0 text-right placeholder:text-right"
                    />
                    {showDropdown && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto mt-1" style={{scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9'}}>
                        {products
                          .filter(product => 
                            product.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
                            product.name.toLowerCase().includes(searchValue.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((product) => (
                            <div
                              key={product.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleProductSelect(product)}
                            >
                              <div className="text-sm font-medium text-right">{product.sku}</div>
                              <div className="text-xs text-gray-500 text-right">{product.name}</div>
                              <div className="text-xs text-gray-400 text-right">Stock: {product.stock_quantity}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    value={newItem.product_name}
                    readOnly
                    className="border-0 focus:ring-0 text-right bg-gray-50"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    value={newItem.category}
                    readOnly
                    className="border-0 focus:ring-0 text-right bg-gray-50"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    value={newItem.current_stock}
                    readOnly
                    className="border-0 focus:ring-0 text-right bg-gray-50"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    min="1"
                    max={newItem.current_stock}
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                    className="border-0 focus:ring-0 text-right"
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    placeholder="Transfer notes..."
                    value={newItem.notes}
                    onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                    className="border-0 focus:ring-0 text-right"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    onClick={handleAddItem}
                    disabled={!selectedProduct || newItem.quantity <= 0 || !newItem.to_location}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Items List */}
      {transferItems.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden mb-12">
          <div className="bg-gray-800 text-white p-4">
            <h2 className="text-lg font-semibold">Items to Transfer ({transferItems.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Item Code</TableHead>
                  <TableHead className="text-right">Item Name</TableHead>
                  <TableHead className="text-right">Category</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">To Location</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-right">{item.product_sku}</TableCell>
                    <TableCell className="text-right">{item.product_name}</TableCell>
                    <TableCell className="text-right">{item.category}</TableCell>
                    <TableCell className="text-right">{item.current_stock}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.to_location}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {transferItems.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmitTransfer} 
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Process Transfer Out
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransferOutPage;