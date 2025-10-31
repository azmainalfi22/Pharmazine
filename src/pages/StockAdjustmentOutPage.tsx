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
import { Plus, Trash2, Package, Settings, RefreshCw } from 'lucide-react';
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

interface AdjustmentItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  category: string;
  current_stock: number;
  new_stock: number;
  adjustment_type: 'increase' | 'decrease';
  reason: string;
  notes: string;
}

const StockAdjustmentOutPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [referenceNumber, setReferenceNumber] = useState('');
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
    new_stock: 0,
    adjustment_type: 'decrease' as 'increase' | 'decrease',
    reason: '',
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
      new_stock: product.stock_quantity,
      adjustment_type: 'decrease',
      reason: '',
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

    if (newItem.new_stock < 0) {
      toast.error('New stock cannot be negative');
      return;
    }

    if (!newItem.reason) {
      toast.error('Please select an adjustment reason');
      return;
    }

    const newAdjustmentItem: AdjustmentItem = {
      id: Date.now().toString(),
      product_id: newItem.product_id,
      product_name: newItem.product_name,
      product_sku: newItem.product_sku,
      category: newItem.category,
      current_stock: newItem.current_stock,
      new_stock: newItem.new_stock,
      adjustment_type: newItem.new_stock > newItem.current_stock ? 'increase' : 'decrease',
      reason: newItem.reason,
      notes: newItem.notes
    };

    setAdjustmentItems([...adjustmentItems, newAdjustmentItem]);
    
    // Reset form
    setSelectedProduct(null);
    setSearchValue('');
    setNewItem({
      product_id: '',
      product_name: '',
      product_sku: '',
      category: '',
      current_stock: 0,
      new_stock: 0,
      adjustment_type: 'decrease',
      reason: '',
      notes: ''
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setAdjustmentItems(adjustmentItems.filter(item => item.id !== itemId));
  };

  const handleSubmitAdjustment = async () => {
    if (adjustmentItems.length === 0) {
      toast.error('Please add at least one item to adjust');
      return;
    }

    try {
      for (const item of adjustmentItems) {
        const quantityChange = item.new_stock - item.current_stock;
        const transactionType = quantityChange > 0 ? 'stock_adjustment_in' : 'stock_adjustment_out';
        
        await apiClient.createStockTransaction({
          product_id: item.product_id,
          transaction_type: transactionType,
          quantity: Math.abs(quantityChange),
          unit_price: 0,
          notes: `${item.reason}: ${item.notes}`,
          reason: item.reason
        });
      }

      toast.success('Stock adjustment completed successfully');
      setAdjustmentItems([]);
      setReferenceNumber('');
      setNotes('');
      fetchData(); // Refresh product data
    } catch (error) {
      console.error('Error processing stock adjustment:', error);
      toast.error('Failed to process stock adjustment');
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
            <Settings className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Stock Adjustment (Decrease)</h1>
            <p className="text-white/90 text-base">Adjust stock levels (decrease)</p>
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

      {/* Adjustment Details */}
      <div className="bg-card border-2 rounded-lg overflow-hidden mb-12 shadow-lg">
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 p-4 border-b-2 border-teal-200 dark:border-teal-800">
          <h2 className="text-lg font-bold text-teal-900 dark:text-teal-100">Adjustment Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                placeholder="ADJ-2024-001"
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
                <TableHead className="text-white font-semibold text-right">New Stock *</TableHead>
                <TableHead className="text-white font-semibold text-right">Adjustment Reason</TableHead>
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
                            new_stock: 0,
                            adjustment_type: 'decrease',
                            reason: '',
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
                    min="0"
                    value={newItem.new_stock || ''}
                    onChange={(e) => setNewItem({...newItem, new_stock: parseInt(e.target.value) || 0})}
                    className="border-0 focus:ring-0 text-right"
                    placeholder="0"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Select value={newItem.reason} onValueChange={(value) => setNewItem({...newItem, reason: value})}>
                    <SelectTrigger className="border-0 focus:ring-0">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damage">Damaged Goods</SelectItem>
                      <SelectItem value="theft">Theft/Loss</SelectItem>
                      <SelectItem value="expired">Expired Products</SelectItem>
                      <SelectItem value="waste">Waste/Scrap</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    onClick={handleAddItem}
                    disabled={!selectedProduct || newItem.new_stock < 0 || !newItem.reason}
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
      {adjustmentItems.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden mb-12">
          <div className="bg-gray-800 text-white p-4">
            <h2 className="text-lg font-semibold">Items to Adjust ({adjustmentItems.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Item Code</TableHead>
                  <TableHead className="text-right">Item Name</TableHead>
                  <TableHead className="text-right">Category</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">New Stock</TableHead>
                  <TableHead className="text-right">Adjustment Reason</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustmentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-right">{item.product_sku}</TableCell>
                    <TableCell className="text-right">{item.product_name}</TableCell>
                    <TableCell className="text-right">{item.category}</TableCell>
                    <TableCell className="text-right">{item.current_stock}</TableCell>
                    <TableCell className="text-right">{item.new_stock}</TableCell>
                    <TableCell className="text-right">{item.reason}</TableCell>
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
      {adjustmentItems.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmitAdjustment} 
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Process Stock Adjustment
          </Button>
        </div>
      )}
    </div>
  );
};

export default StockAdjustmentOutPage;