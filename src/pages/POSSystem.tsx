import { useState, useEffect, useRef } from "react";
import { Plus, Minus, Search, ShoppingCart, Trash2, Receipt, User, CreditCard, DollarSign, Barcode, Package, X, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface CartItem {
  product_id: string;
  product_name: string;
  batch_id?: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  unit_price: number;
  mrp: number;
  discount_percentage: number;
  gst_percent: number;
  total_price: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  generic_name?: string;
  brand_name?: string;
  mrp: number;
  selling_price: number;
  stock_quantity: number;
  is_prescription_required: boolean;
  gst_percentage?: number;
}

interface Batch {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity_remaining: number;
  selling_price: number;
  mrp: number;
}

export default function POSSystem() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchDialog, setBatchDialog] = useState(false);
  const [checkoutDialog, setCheckoutDialog] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: "Walk-in Customer",
    phone: "",
    email: "",
    address: ""
  });

  const [paymentInfo, setPaymentInfo] = useState({
    method: "cash",
    discount: 0,
    tax: 0,
    paid_amount: 0,
    notes: ""
  });

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
    // Focus barcode input on mount
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_ROOT}/products`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadBatches = async (productId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.PHARMACY_BASE}/batches?product_id=${productId}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out expired batches and batches with no stock
        const today = new Date();
        const validBatches = data.filter((b: Batch) => {
          const expiryDate = new Date(b.expiry_date);
          return b.quantity_remaining > 0 && expiryDate >= today;
        });
        setBatches(validBatches);
        
        if (validBatches.length === 0 && data.length > 0) {
          toast.info("All batches for this product are either expired or out of stock");
        }
      }
    } catch (error) {
      console.error("Error loading batches:", error);
      toast.error("Error loading batches");
      setBatches([]);
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    const product = products.find(p => 
      p.sku === barcode || 
      p.barcode === barcode ||
      p.id === barcode
    );

    if (product) {
      toast.success(`Product found: ${product.name}`);
      handleProductSelect(product);
      setSearchTerm("");
      if (barcodeInputRef.current) {
        barcodeInputRef.current.value = "";
        barcodeInputRef.current.focus();
      }
    } else {
      toast.error(`Product not found for barcode: ${barcode}`);
      if (barcodeInputRef.current) {
        barcodeInputRef.current.value = "";
        barcodeInputRef.current.focus();
      }
    }
  };

  const handleProductSelect = async (product: Product) => {
    setSelectedProduct(product);
    await loadBatches(product.id);
    setBatchDialog(true);
  };

  const handleAddToCart = (batch: Batch) => {
    if (!selectedProduct) return;

    // Check if batch has available stock
    if (batch.quantity_remaining <= 0) {
      toast.error("This batch is out of stock");
      return;
    }

    // Warn if batch is near expiry
    const expiryDate = new Date(batch.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      toast.error("Cannot sell expired batch");
      return;
    }
    
    if (daysUntilExpiry < 30) {
      toast.warning(`This batch expires in ${daysUntilExpiry} days`);
    }

    const existingIndex = cart.findIndex(
      item => item.product_id === selectedProduct.id && item.batch_number === batch.batch_number
    );

    if (existingIndex >= 0) {
      const updated = [...cart];
      const newQuantity = updated[existingIndex].quantity + 1;
      
      // Check if we have enough stock
      if (newQuantity > batch.quantity_remaining) {
        toast.error(`Only ${batch.quantity_remaining} units available in this batch`);
        return;
      }
      
      updated[existingIndex].quantity = newQuantity;
      updated[existingIndex].total_price = calculateItemTotal(updated[existingIndex]);
      setCart(updated);
    } else {
      const newItem: CartItem = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        batch_id: batch.id,
        batch_number: batch.batch_number,
        expiry_date: batch.expiry_date,
        quantity: 1,
        unit_price: batch.selling_price || selectedProduct.selling_price || 0,
        mrp: batch.mrp || selectedProduct.mrp || 0,
        discount_percentage: 0,
        gst_percent: selectedProduct.gst_percentage || 0,
        total_price: batch.selling_price || selectedProduct.selling_price || 0
      };
      newItem.total_price = calculateItemTotal(newItem);
      setCart([...cart, newItem]);
    }

    setBatchDialog(false);
    setSelectedProduct(null);
    toast.success("Item added to cart");
  };

  const calculateItemTotal = (item: CartItem) => {
    const subtotal = item.quantity * item.unit_price;
    const discountAmount = (subtotal * item.discount_percentage) / 100;
    const afterDiscount = subtotal - discountAmount;
    const gstAmount = (afterDiscount * item.gst_percent) / 100;
    return afterDiscount + gstAmount;
  };

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    const updated = [...cart];
    const item = updated[index];
    
    // If updating quantity, find the batch and check stock
    if (updates.quantity !== undefined) {
      const batch = batches.find(b => b.batch_number === item.batch_number);
      if (batch && updates.quantity > batch.quantity_remaining) {
        toast.error(`Only ${batch.quantity_remaining} units available in this batch`);
        return;
      }
    }
    
    updated[index] = { ...updated[index], ...updates };
    updated[index].total_price = calculateItemTotal(updated[index]);
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
    toast.success("Item removed from cart");
  };

  const clearCart = () => {
    if (confirm("Clear all items from cart?")) {
      setCart([]);
      setCustomerInfo({ name: "Walk-in Customer", phone: "", email: "", address: "" });
      setPaymentInfo({ method: "cash", discount: 0, tax: 0, paid_amount: 0, notes: "" });
      toast.success("Cart cleared");
    }
  };

  const calculateCartTotal = () => {
    const itemsTotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    const discount = paymentInfo.discount || 0;
    const afterDiscount = itemsTotal - discount;
    const tax = paymentInfo.tax || 0;
    const grandTotal = afterDiscount + tax;

    return {
      itemsTotal,
      discount,
      afterDiscount,
      tax,
      grandTotal
    };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const totals = calculateCartTotal();

    if (paymentInfo.paid_amount < totals.grandTotal && paymentInfo.method === "cash") {
      toast.error("Insufficient payment amount");
      return;
    }

    try {
      // Create sale
      const salePayload = {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email,
        total_amount: totals.itemsTotal,
        discount: totals.discount,
        tax: totals.tax,
        net_amount: totals.grandTotal,
        payment_method: paymentInfo.method,
        payment_status: "completed",
        notes: paymentInfo.notes,
        created_by: null
      };

      const saleResponse = await fetch(`${API_CONFIG.API_ROOT}/sales`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(salePayload)
      });

      if (!saleResponse.ok) {
        throw new Error("Failed to create sale");
      }

      const sale = await saleResponse.json();

      // Add sale items
      for (const item of cart) {
        await fetch(`${API_CONFIG.API_ROOT}/sales/items`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            batch_no: item.batch_number,
            expiry_date: item.expiry_date,
            gst_percent: item.gst_percent
          })
        });
      }

      toast.success("Sale completed successfully!");
      
      // Print receipt
      printReceipt(sale, cart, totals);

      // Clear cart
      setCart([]);
      setCustomerInfo({ name: "Walk-in Customer", phone: "", email: "", address: "" });
      setPaymentInfo({ method: "cash", discount: 0, tax: 0, paid_amount: 0, notes: "" });
      setCheckoutDialog(false);
    } catch (error) {
      toast.error("Error processing sale");
      console.error(error);
    }
  };

  const printReceipt = (sale: any, items: CartItem[], totals: any) => {
    const receiptWindow = window.open("", "_blank", "width=300,height=600");
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${sale.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 10px; font-size: 12px; }
          h2 { text-align: center; margin: 5px 0; }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; }
          .right { text-align: right; }
          .total { font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>SHARKAR PHARMACY</h2>
        <div class="center">Your Health, Our Priority</div>
        <div class="divider"></div>
        <div>Date: ${format(new Date(), "dd MMM yyyy HH:mm")}</div>
        <div>Invoice: ${sale.id.substring(0, 8)}</div>
        <div>Customer: ${customerInfo.name}</div>
        ${customerInfo.phone ? `<div>Phone: ${customerInfo.phone}</div>` : ""}
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="right">Qty</th>
              <th class="right">Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td class="right">${item.quantity}</td>
                <td class="right">$${item.unit_price.toFixed(2)}</td>
                <td class="right">$${item.total_price.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="4" style="font-size: 10px; color: #666;">Batch: ${item.batch_number}, Exp: ${format(new Date(item.expiry_date), "MMM yyyy")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="divider"></div>
        <div>Subtotal: <span class="right">$${totals.itemsTotal.toFixed(2)}</span></div>
        ${totals.discount > 0 ? `<div>Discount: <span class="right">-$${totals.discount.toFixed(2)}</span></div>` : ""}
        ${totals.tax > 0 ? `<div>Tax: <span class="right">$${totals.tax.toFixed(2)}</span></div>` : ""}
        <div class="divider"></div>
        <div class="total">TOTAL: <span class="right">$${totals.grandTotal.toFixed(2)}</span></div>
        <div>Paid: <span class="right">$${paymentInfo.paid_amount.toFixed(2)}</span></div>
        <div>Change: <span class="right">$${(paymentInfo.paid_amount - totals.grandTotal).toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="center">Thank you for your purchase!</div>
        <div class="center" style="margin-top: 10px;">Visit us again</div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    setTimeout(() => {
      receiptWindow.print();
    }, 250);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.generic_name && p.generic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.brand_name && p.brand_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totals = calculateCartTotal();

  return (
    <div className="flex flex-col h-screen">
      {/* Prominent Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-teal-600 to-green-700 p-6 border-b-2 border-green-200/20 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <ShoppingCart className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Point of Sale</h1>
              <p className="text-white/90 text-sm mt-0.5">Quick sales and invoice generation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 text-center">
              <div className="text-xs text-white/70 font-medium">PRODUCTS</div>
              <div className="text-xl font-bold text-white">{products.length}</div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 text-center">
              <div className="text-xs text-white/70 font-medium">CART ITEMS</div>
              <div className="text-xl font-bold text-white">{cart.length}</div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadProducts}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-auto">
        {/* Left Section - Product Search & Cart */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Product Search */}
          <Card className="pharmacy-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Product Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Barcode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode or search product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBarcodeScan(searchTerm);
                    }
                  }}
                  className="pl-10 pharmacy-input"
                  autoFocus
                />
              </div>

              {searchTerm && (
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-2 space-y-1">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No products found
                      </div>
                    ) : (
                      filteredProducts.slice(0, 10).map(product => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                          onClick={() => handleProductSelect(product)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.generic_name && (
                                <div className="text-xs text-muted-foreground">
                                  Generic: {product.generic_name}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                SKU: {product.sku} | Stock: {product.stock_quantity}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">${product.selling_price || product.mrp}</div>
                              {product.is_prescription_required && (
                                <Badge variant="destructive" className="text-xs mt-1">Rx</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card className="pharmacy-card flex-1">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  <ShoppingCart className="w-5 h-5 inline mr-2" />
                  Shopping Cart ({cart.length} items)
                </CardTitle>
                {cart.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={clearCart}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Cart is empty</p>
                  <p className="text-sm">Scan or search products to add them</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {cart.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg glass-subtle">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-xs text-muted-foreground">
                              Batch: {item.batch_number} | Exp: {format(new Date(item.expiry_date), "MMM yyyy")}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartItem(index, { quantity: Math.max(1, item.quantity - 1) })}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(index, { quantity: parseInt(e.target.value) || 1 })}
                              className="w-16 text-center pharmacy-input p-1 h-8"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartItem(index, { quantity: item.quantity + 1 })}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="text-sm">
                            × ${item.unit_price.toFixed(2)}
                          </div>

                          <div className="ml-auto font-bold text-primary">
                            ${item.total_price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Section - Summary & Checkout */}
        <div className="flex flex-col gap-4">
          <Card className="pharmacy-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${totals.itemsTotal.toFixed(2)}</span>
                </div>

                <div>
                  <Label className="text-xs">Discount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentInfo.discount}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, discount: parseFloat(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>

                <div>
                  <Label className="text-xs">Additional Tax</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentInfo.tax}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, tax: parseFloat(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">${totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Payment Method</Label>
                <Select
                  value={paymentInfo.method}
                  onValueChange={(value) => setPaymentInfo({ ...paymentInfo, method: value })}
                >
                  <SelectTrigger className="pharmacy-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentInfo.method === "cash" && (
                <div>
                  <Label>Amount Paid</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentInfo.paid_amount}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, paid_amount: parseFloat(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                  {paymentInfo.paid_amount >= totals.grandTotal && (
                    <div className="text-sm mt-1 text-green-600">
                      Change: ${(paymentInfo.paid_amount - totals.grandTotal).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              <Button
                className="pharmacy-button w-full"
                size="lg"
                onClick={() => setCheckoutDialog(true)}
                disabled={cart.length === 0}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Batch Selection Dialog */}
      <Dialog open={batchDialog} onOpenChange={setBatchDialog}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>Select Batch</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name}
              {selectedProduct?.is_prescription_required && (
                <Badge variant="destructive" className="ml-2">Prescription Required</Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {batches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No batches available for this product
            </div>
          ) : (
            <div className="space-y-2">
              {batches.map(batch => (
                <div
                  key={batch.id}
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleAddToCart(batch)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Batch: {batch.batch_number}</div>
                      <div className="text-sm text-muted-foreground">
                        Expiry: {format(new Date(batch.expiry_date), "dd MMM yyyy")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Available: {batch.quantity_remaining} units
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-primary">
                        ${batch.selling_price?.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        MRP: ${batch.mrp?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="glass-strong max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Sale</DialogTitle>
            <DialogDescription>Review order details before completing</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Customer Name</Label>
              <Input
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  placeholder="Optional"
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  placeholder="Optional"
                  className="pharmacy-input"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={paymentInfo.notes}
                onChange={(e) => setPaymentInfo({ ...paymentInfo, notes: e.target.value })}
                placeholder="Optional notes..."
                className="pharmacy-input"
                rows={2}
              />
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${totals.itemsTotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${totals.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span className="text-primary">${totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payment Method:</span>
                <Badge className="pharmacy-badge capitalize">{paymentInfo.method}</Badge>
              </div>
              {paymentInfo.method === "cash" && (
                <>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span>${paymentInfo.paid_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Change:</span>
                    <span>${Math.max(0, paymentInfo.paid_amount - totals.grandTotal).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialog(false)}>
              Cancel
            </Button>
            <Button className="pharmacy-button" onClick={handleCheckout}>
              <Receipt className="w-4 h-4 mr-2" />
              Complete Sale & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

