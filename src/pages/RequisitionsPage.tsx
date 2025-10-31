import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle, ShoppingCart, Trash2, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/integrations/api/client';
import { exportRequisitionReport } from '@/utils/excelExporter';

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock?: number;
  unit_type?: string;
}

interface RequisitionItem {
  product_id: string;
  product_name?: string;
  qty: number;
  unit: string;
  notes?: string;
}

interface Requisition {
  id: string;
  requested_by: string;
  requested_at: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  items?: RequisitionItem[];
}

const RequisitionsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.some(role => role.role === 'admin');

  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New requisition form
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [requisitionNotes, setRequisitionNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequisitions();
    fetchProducts();
  }, []);

  const fetchRequisitions = async () => {
    try {
      const data = await apiClient.listRequisitions();
      setRequisitions(data as Requisition[]);
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      toast.error('Failed to load requisitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }
    if (itemQty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const newItem: RequisitionItem = {
      product_id: selectedProduct,
      product_name: product.name,
      qty: itemQty,
      unit: product.unit_type || 'piece',
      notes: itemNotes,
    };

    setRequisitionItems([...requisitionItems, newItem]);
    setSelectedProduct('');
    setItemQty(1);
    setItemNotes('');
    setSearchTerm('');
    toast.success('Item added to requisition');
  };

  const handleRemoveItem = (index: number) => {
    const updated = requisitionItems.filter((_, i) => i !== index);
    setRequisitionItems(updated);
    toast.success('Item removed');
  };

  const handleCreateRequisition = async () => {
    if (requisitionItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const requisitionData = {
        requested_by: user.id,
        notes: requisitionNotes,
        items: requisitionItems.map(item => ({
          product_id: item.product_id,
          qty: item.qty,
          unit: item.unit,
          notes: item.notes,
        })),
      };

      await apiClient.createRequisition(requisitionData);
      toast.success('Requisition created successfully!');
      setRequisitionItems([]);
      setRequisitionNotes('');
      setIsCreateDialogOpen(false);
      fetchRequisitions();
    } catch (error) {
      console.error('Error creating requisition:', error);
      toast.error('Failed to create requisition');
    }
  };

  const handleApprove = async (requisitionId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await apiClient.approveRequisition(requisitionId);
      toast.success('Requisition approved!');
      fetchRequisitions();
    } catch (error) {
      console.error('Error approving requisition:', error);
      toast.error('Failed to approve requisition');
    }
  };

  const handlePurchase = async (requisitionId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await apiClient.purchaseRequisition(requisitionId);
      toast.success('Requisition marked as purchased!');
      fetchRequisitions();
    } catch (error) {
      console.error('Error marking as purchased:', error);
      toast.error('Failed to mark as purchased');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'purchased':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Purchased</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading requisitions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Stock Requisitions</h1>
            <p className="text-white/90 text-base">Request and manage stock requisitions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              onClick={() => {
                exportRequisitionReport(requisitions);
                toast.success('Requisition report exported to Excel');
              }}
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all border-0">
                <Plus className="h-4 w-4" />
                New Requisition
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Stock Requisition</DialogTitle>
              <DialogDescription>
                Request products to be ordered from suppliers
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Add Item Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Search Product</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {searchTerm && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              setSelectedProduct(product.id);
                              setSearchTerm('');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-muted transition-colors border-b last:border-0"
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {product.sku} | Stock: {product.current_stock || 0}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          No products found
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        Selected: {products.find(p => p.id === selectedProduct)?.name}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={itemQty}
                        onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input
                        value={selectedProduct ? products.find(p => p.id === selectedProduct)?.unit_type || 'piece' : 'piece'}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Item Notes (Optional)</Label>
                    <Input
                      placeholder="Any specific requirements..."
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleAddItem} className="w-full" disabled={!selectedProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>

              {/* Items List */}
              {requisitionItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Requisition Items ({requisitionItems.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requisitionItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell>{item.qty}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.notes || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Overall Notes */}
              <div className="space-y-2">
                <Label>Requisition Notes (Optional)</Label>
                <Textarea
                  placeholder="Any additional information about this requisition..."
                  value={requisitionNotes}
                  onChange={(e) => setRequisitionNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateRequisition}
                  className="flex-1"
                  disabled={requisitionItems.length === 0}
                >
                  Create Requisition
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setRequisitionItems([]);
                    setRequisitionNotes('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

      {/* Requisitions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Requisitions</CardTitle>
        </CardHeader>
        <CardContent>
          {requisitions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No requisitions found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitions.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-xs">
                      {req.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{req.requested_by}</TableCell>
                    <TableCell>
                      {new Date(req.requested_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      {req.items?.length || 0} item(s)
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {req.notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {isAdmin && req.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(req.id)}
                            className="gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {isAdmin && req.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePurchase(req.id)}
                            className="gap-1"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Mark Purchased
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RequisitionsPage;

