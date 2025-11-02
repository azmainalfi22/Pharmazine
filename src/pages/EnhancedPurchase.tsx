import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Package, ShoppingCart, FileText, Printer, Save, X, Archive, RotateCcw, DollarSign, Calendar, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_BASE = "http://localhost:8000/api";

interface PurchaseItem {
  id?: string;
  product_id: string;
  product_name?: string;
  batch_no: string;
  manufacture_date?: string;
  expiry_date: string;
  qty: number;
  box_qty?: number;
  strip_qty?: number;
  unit_per_strip?: number;
  unit_per_box?: number;
  unit_price: number;
  mrp: number;
  discount_percentage?: number;
  gst_percent: number;
  total_price: number;
  rack_location?: string;
  shelf_location?: string;
}

interface Purchase {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  purchase_order_number?: string;
  bill_number?: string;
  invoice_no: string;
  date: string;
  delivery_date?: string;
  total_amount: number;
  discount_amount?: number;
  vat_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  grand_total: number;
  paid_amount?: number;
  balance_amount?: number;
  payment_due_date?: string;
  payment_status: string;
  is_hold: boolean;
  hold_reason?: string;
  print_size?: string;
  notes?: string;
  items: PurchaseItem[];
  created_at: string;
}

export default function EnhancedPurchase() {
  const [activeTab, setActiveTab] = useState("create");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Purchase List
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  // Create/Edit Purchase Form
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [purchaseForm, setPurchaseForm] = useState({
    supplier_id: "",
    purchase_order_number: "",
    bill_number: "",
    invoice_no: "",
    date: format(new Date(), "yyyy-MM-dd"),
    delivery_date: "",
    discount_amount: 0,
    vat_amount: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    paid_amount: 0,
    payment_due_date: "",
    payment_status: "pending",
    print_size: "A4",
    notes: ""
  });

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<PurchaseItem>({
    product_id: "",
    batch_no: "",
    expiry_date: "",
    qty: 1,
    box_qty: 0,
    strip_qty: 0,
    unit_per_strip: 1,
    unit_per_box: 1,
    unit_price: 0,
    mrp: 0,
    discount_percentage: 0,
    gst_percent: 0,
    total_price: 0,
    rack_location: "",
    shelf_location: ""
  });

  // Data for dropdowns
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadSuppliers();
    loadProducts();
    if (activeTab === "list") loadPurchases();
  }, [activeTab]);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const loadSuppliers = async () => {
    try {
      const response = await fetch(`${API_BASE}/suppliers`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/purchases`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      }
    } catch (error) {
      toast.error("Error loading purchases");
    } finally {
      setLoading(false);
    }
  };

  const calculateItemTotal = (item: Partial<PurchaseItem>) => {
    const qty = item.qty || 0;
    const unitPrice = item.unit_price || 0;
    const discountPercent = item.discount_percentage || 0;
    const gstPercent = item.gst_percent || 0;

    const subtotal = qty * unitPrice;
    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = subtotal - discountAmount;
    const gstAmount = (afterDiscount * gstPercent) / 100;
    const total = afterDiscount + gstAmount;

    return {
      subtotal,
      discountAmount,
      gstAmount,
      total
    };
  };

  const handleAddItem = () => {
    if (!itemForm.product_id || !itemForm.batch_no || !itemForm.expiry_date) {
      toast.error("Product, batch number, and expiry date are required");
      return;
    }

    const calculated = calculateItemTotal(itemForm);
    const newItem = {
      ...itemForm,
      total_price: calculated.total,
      product_name: products.find(p => p.id === itemForm.product_id)?.name
    };

    if (editingItemIndex !== null) {
      const updated = [...purchaseItems];
      updated[editingItemIndex] = newItem;
      setPurchaseItems(updated);
      toast.success("Item updated");
    } else {
      setPurchaseItems([...purchaseItems, newItem]);
      toast.success("Item added");
    }

    setItemDialog(false);
    setEditingItemIndex(null);
    resetItemForm();
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    toast.success("Item removed");
  };

  const resetItemForm = () => {
    setItemForm({
      product_id: "",
      batch_no: "",
      expiry_date: "",
      qty: 1,
      box_qty: 0,
      strip_qty: 0,
      unit_per_strip: 1,
      unit_per_box: 1,
      unit_price: 0,
      mrp: 0,
      discount_percentage: 0,
      gst_percent: 0,
      total_price: 0,
      rack_location: "",
      shelf_location: ""
    });
  };

  const calculatePurchaseTotal = () => {
    const itemsTotal = purchaseItems.reduce((sum, item) => sum + item.total_price, 0);
    const discountAmount = purchaseForm.discount_amount || 0;
    const afterDiscount = itemsTotal - discountAmount;
    
    const vatAmount = purchaseForm.vat_amount || 0;
    const cgstAmount = purchaseForm.cgst_amount || 0;
    const sgstAmount = purchaseForm.sgst_amount || 0;
    const igstAmount = purchaseForm.igst_amount || 0;
    
    const totalTax = vatAmount + cgstAmount + sgstAmount + igstAmount;
    const grandTotal = afterDiscount + totalTax;

    return {
      itemsTotal,
      discountAmount,
      afterDiscount,
      totalTax,
      grandTotal
    };
  };

  const handleSavePurchase = async (isHold: boolean = false) => {
    if (!purchaseForm.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }

    if (purchaseItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setLoading(true);
    try {
      const totals = calculatePurchaseTotal();
      
      const payload = {
        supplier_id: purchaseForm.supplier_id,
        invoice_no: purchaseForm.invoice_no || `PO-${Date.now()}`,
        date: purchaseForm.date,
        items: purchaseItems.map(item => ({
          product_id: item.product_id,
          qty: item.qty,
          unit_price: item.unit_price,
          batch_no: item.batch_no,
          expiry_date: item.expiry_date,
          mrp: item.mrp,
          gst_percent: item.gst_percent
        })),
        payment_status: isHold ? "hold" : purchaseForm.payment_status,
        created_by: null
      };

      const url = editingPurchase 
        ? `${API_BASE}/purchases/${editingPurchase.id}`
        : `${API_BASE}/purchases`;
      const method = editingPurchase ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editingPurchase 
          ? "Purchase updated successfully" 
          : (isHold ? "Purchase saved as draft" : "Purchase created successfully"));
        setPurchaseItems([]);
        setEditingPurchase(null);
        setPurchaseForm({
          supplier_id: "",
          purchase_order_number: "",
          bill_number: "",
          invoice_no: "",
          date: format(new Date(), "yyyy-MM-dd"),
          delivery_date: "",
          discount_amount: 0,
          vat_amount: 0,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          paid_amount: 0,
          payment_due_date: "",
          payment_status: "pending",
          print_size: "A4",
          notes: ""
        });
        setActiveTab("list");
        loadPurchases();
      } else {
        const error = await response.json();
        toast.error(error.detail || `Failed to ${editingPurchase ? 'update' : 'create'} purchase`);
      }
    } catch (error) {
      toast.error(`Error ${editingPurchase ? 'updating' : 'creating'} purchase`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!confirm("Are you sure you want to delete this purchase?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/purchases/${purchaseId}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });

      if (response.ok) {
        toast.success("Purchase deleted successfully");
        loadPurchases();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete purchase");
      }
    } catch (error) {
      toast.error("Error deleting purchase");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPurchase = async (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setPurchaseForm({
      supplier_id: purchase.supplier_id,
      purchase_order_number: purchase.purchase_order_number || "",
      bill_number: purchase.bill_number || "",
      invoice_no: purchase.invoice_no,
      date: purchase.date,
      delivery_date: purchase.delivery_date || "",
      discount_amount: purchase.discount_amount || 0,
      vat_amount: purchase.vat_amount || 0,
      cgst_amount: purchase.cgst_amount || 0,
      sgst_amount: purchase.sgst_amount || 0,
      igst_amount: purchase.igst_amount || 0,
      paid_amount: purchase.paid_amount || 0,
      payment_due_date: purchase.payment_due_date || "",
      payment_status: purchase.payment_status,
      print_size: purchase.print_size || "A4",
      notes: purchase.notes || ""
    });
    setPurchaseItems(purchase.items || []);
    setActiveTab("create");
  };

  const filteredPurchases = purchases.filter(p =>
    p.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.supplier_name && p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totals = calculatePurchaseTotal();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Purchase Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage purchase orders with batch tracking and multi-tax support
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="create">
            <Plus className="w-4 h-4 mr-2" />
            Create Purchase
          </TabsTrigger>
          <TabsTrigger value="list">
            <FileText className="w-4 h-4 mr-2" />
            Purchase List
          </TabsTrigger>
        </TabsList>

        {/* CREATE PURCHASE TAB */}
        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Purchase Details */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="pharmacy-card">
                <CardHeader>
                  <CardTitle>Purchase Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Supplier *</Label>
                      <Select
                        value={purchaseForm.supplier_id}
                        onValueChange={(value) => setPurchaseForm({ ...purchaseForm, supplier_id: value })}
                      >
                        <SelectTrigger className="pharmacy-input">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Purchase Order No.</Label>
                      <Input
                        value={purchaseForm.purchase_order_number}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_order_number: e.target.value })}
                        placeholder="Auto-generated"
                        className="pharmacy-input"
                      />
                    </div>
                    <div>
                      <Label>Bill/Invoice No.</Label>
                      <Input
                        value={purchaseForm.bill_number}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, bill_number: e.target.value })}
                        placeholder="Supplier invoice number"
                        className="pharmacy-input"
                      />
                    </div>
                    <div>
                      <Label>Purchase Date *</Label>
                      <Input
                        type="date"
                        value={purchaseForm.date}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                        className="pharmacy-input"
                      />
                    </div>
                    <div>
                      <Label>Delivery Date</Label>
                      <Input
                        type="date"
                        value={purchaseForm.delivery_date}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, delivery_date: e.target.value })}
                        className="pharmacy-input"
                      />
                    </div>
                    <div>
                      <Label>Payment Due Date</Label>
                      <Input
                        type="date"
                        value={purchaseForm.payment_due_date}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, payment_due_date: e.target.value })}
                        className="pharmacy-input"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Items */}
              <Card className="pharmacy-card">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Purchase Items</CardTitle>
                    <Button
                      className="pharmacy-button"
                      size="sm"
                      onClick={() => {
                        setEditingItemIndex(null);
                        resetItemForm();
                        setItemDialog(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {purchaseItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No items added yet. Click "Add Item" to start.
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead>Expiry</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">MRP</TableHead>
                            <TableHead className="text-right">GST%</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {purchaseItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.batch_no}</Badge>
                              </TableCell>
                              <TableCell>{format(new Date(item.expiry_date), "dd MMM yyyy")}</TableCell>
                              <TableCell className="text-right">{item.qty}</TableCell>
                              <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${item.mrp.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.gst_percent}%</TableCell>
                              <TableCell className="text-right font-medium">${item.total_price.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingItemIndex(index);
                                      setItemForm(item);
                                      setItemDialog(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemoveItem(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary & Actions */}
            <div className="space-y-4">
              <Card className="pharmacy-card">
                <CardHeader>
                  <CardTitle>Purchase Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items Total:</span>
                      <span className="font-medium">${totals.itemsTotal.toFixed(2)}</span>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Discount Amount</Label>
                      <Input
                        type="number"
                        value={purchaseForm.discount_amount}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, discount_amount: parseFloat(e.target.value) || 0 })}
                        className="pharmacy-input"
                      />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">After Discount:</span>
                      <span className="font-medium">${totals.afterDiscount.toFixed(2)}</span>
                    </div>

                    <div className="border-t pt-2">
                      <Label className="text-xs">Tax Details</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label className="text-xs">CGST</Label>
                          <Input
                            type="number"
                            value={purchaseForm.cgst_amount}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, cgst_amount: parseFloat(e.target.value) || 0 })}
                            className="pharmacy-input text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">SGST</Label>
                          <Input
                            type="number"
                            value={purchaseForm.sgst_amount}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, sgst_amount: parseFloat(e.target.value) || 0 })}
                            className="pharmacy-input text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">IGST</Label>
                          <Input
                            type="number"
                            value={purchaseForm.igst_amount}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, igst_amount: parseFloat(e.target.value) || 0 })}
                            className="pharmacy-input text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">VAT</Label>
                          <Input
                            type="number"
                            value={purchaseForm.vat_amount}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, vat_amount: parseFloat(e.target.value) || 0 })}
                            className="pharmacy-input text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Grand Total:</span>
                        <span className="text-primary">${totals.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Paid Amount</Label>
                      <Input
                        type="number"
                        value={purchaseForm.paid_amount}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, paid_amount: parseFloat(e.target.value) || 0 })}
                        className="pharmacy-input"
                      />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Balance:</span>
                      <span className="font-medium text-red-600">
                        ${(totals.grandTotal - (purchaseForm.paid_amount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-xs">Print Size</Label>
                    <Select
                      value={purchaseForm.print_size}
                      onValueChange={(value) => setPurchaseForm({ ...purchaseForm, print_size: value })}
                    >
                      <SelectTrigger className="pharmacy-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A5">A5</SelectItem>
                        <SelectItem value="A6">A6</SelectItem>
                        <SelectItem value="POS">POS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Button
                      className="pharmacy-button w-full"
                      onClick={() => handleSavePurchase(false)}
                      disabled={loading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Purchase
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleSavePurchase(true)}
                      disabled={loading}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Save as Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* PURCHASE LIST TAB */}
        <TabsContent value="list" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Purchase Orders</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search purchases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pharmacy-input w-[300px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : filteredPurchases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? "No purchases found" : "No purchases yet. Create your first purchase!"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Purchase No.</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{purchase.invoice_no}</Badge>
                          </TableCell>
                          <TableCell>{purchase.supplier_name || "-"}</TableCell>
                          <TableCell>{format(new Date(purchase.date || purchase.created_at), "dd MMM yyyy")}</TableCell>
                          <TableCell className="text-right">${purchase.total_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${(purchase.paid_amount || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            ${(purchase.balance_amount || (purchase.total_amount - (purchase.paid_amount || 0))).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={purchase.payment_status === "completed" ? "default" : "secondary"}>
                              {purchase.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" title="Print">
                                <Printer className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditPurchase(purchase)}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeletePurchase(purchase.id)}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Item Dialog */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="glass-strong max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingItemIndex !== null ? "Edit Item" : "Add Item"}</DialogTitle>
            <DialogDescription>Enter item details with batch information</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product *</Label>
                  <Select
                    value={itemForm.product_id}
                    onValueChange={(value) => setItemForm({ ...itemForm, product_id: value })}
                  >
                    <SelectTrigger className="pharmacy-input">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Batch Number *</Label>
                  <Input
                    value={itemForm.batch_no}
                    onChange={(e) => setItemForm({ ...itemForm, batch_no: e.target.value })}
                    placeholder="e.g., BATCH001"
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Manufacture Date</Label>
                  <Input
                    type="date"
                    value={itemForm.manufacture_date}
                    onChange={(e) => setItemForm({ ...itemForm, manufacture_date: e.target.value })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Expiry Date *</Label>
                  <Input
                    type="date"
                    value={itemForm.expiry_date}
                    onChange={(e) => setItemForm({ ...itemForm, expiry_date: e.target.value })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={itemForm.qty}
                    onChange={(e) => setItemForm({ ...itemForm, qty: parseInt(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Box Quantity</Label>
                  <Input
                    type="number"
                    value={itemForm.box_qty}
                    onChange={(e) => setItemForm({ ...itemForm, box_qty: parseInt(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Strip Quantity</Label>
                  <Input
                    type="number"
                    value={itemForm.strip_qty}
                    onChange={(e) => setItemForm({ ...itemForm, strip_qty: parseInt(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Unit Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemForm.unit_price}
                    onChange={(e) => setItemForm({ ...itemForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>MRP *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemForm.mrp}
                    onChange={(e) => setItemForm({ ...itemForm, mrp: parseFloat(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemForm.discount_percentage}
                    onChange={(e) => setItemForm({ ...itemForm, discount_percentage: parseFloat(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>GST %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemForm.gst_percent}
                    onChange={(e) => setItemForm({ ...itemForm, gst_percent: parseFloat(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Rack Location</Label>
                  <Input
                    value={itemForm.rack_location}
                    onChange={(e) => setItemForm({ ...itemForm, rack_location: e.target.value })}
                    placeholder="e.g., R1"
                    className="pharmacy-input"
                  />
                </div>
                <div className="col-span-2">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="text-xl font-bold text-primary">
                        ${calculateItemTotal(itemForm).total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(false)}>
              Cancel
            </Button>
            <Button className="pharmacy-button" onClick={handleAddItem}>
              {editingItemIndex !== null ? "Update Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

