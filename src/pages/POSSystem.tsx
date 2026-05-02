import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Minus, Search, ShoppingCart, Trash2, Receipt, User,
  CreditCard, DollarSign, Barcode, Package, X, Calendar,
  RefreshCw, Wifi, WifiOff, Zap, Star, Split, AlertCircle,
  ChevronDown, RotateCcw,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

// ─── Interfaces ──────────────────────────────────────────────────────────────

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
  is_prescription_required?: boolean;
  generic_name?: string;
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
  prescription_required?: boolean;
  gst_percentage?: number;
  barcode?: string;
}

interface Batch {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity_remaining: number;
  selling_price: number;
  mrp: number;
}

// C3: Split payment
interface PaymentSplit {
  method: string;
  amount: number;
}

// C4: Loyalty customer
interface LoyaltyCustomer {
  id: string;
  name: string;
  phone: string;
  loyalty_points: number;
}

// C6: Offline queue item
interface OfflineQueueItem {
  id: string;
  salePayload: Record<string, unknown>;
  items: CartItem[];
  splits: PaymentSplit[];
  createdAt: string;
}

// ─── IndexedDB helpers (C6) ─────────────────────────────────────────────────

const IDB_NAME = "pharmazine_pos_v1";
const IDB_STORE = "offline_queue";

function openPosDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbAdd(item: OfflineQueueItem): Promise<void> {
  const db = await openPosDB();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(item);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function idbGetAll(): Promise<OfflineQueueItem[]> {
  const db = await openPosDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).getAll();
    req.onsuccess = () => res(req.result as OfflineQueueItem[]);
    req.onerror = () => rej(req.error);
  });
}

async function idbDelete(id: string): Promise<void> {
  const db = await openPosDB();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function POSSystem() {
  // Core state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchDialog, setBatchDialog] = useState(false);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [returnDialog, setReturnDialog] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: "Walk-in Customer",
    phone: "",
    email: "",
    address: "",
  });

  const [paymentInfo, setPaymentInfo] = useState({
    discount: 0,
    tax: 0,
    notes: "",
  });

  // C3: Split payment
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([
    { method: "cash", amount: 0 },
  ]);

  // C4: Loyalty
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<LoyaltyCustomer | null>(null);
  const [loyaltyRedeem, setLoyaltyRedeem] = useState(0);
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);

  // C6: Offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // C1: USB HID barcode buffer
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef("");
  const barcodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    loadProducts();
    refreshOfflineCount();
    barcodeInputRef.current?.focus();
  }, []);

  // C6: online/offline detection
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      toast.success("Back online — syncing offline queue…");
      syncOfflineQueue();
    };
    const goOffline = () => {
      setIsOnline(false);
      toast.warning("You are offline. Sales will be queued locally.");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // C4: auto-lookup customer when phone is entered (debounced)
  useEffect(() => {
    if (customerInfo.phone.length >= 8) {
      const t = setTimeout(() => lookupCustomerByPhone(customerInfo.phone), 400);
      return () => clearTimeout(t);
    } else {
      setLoyaltyCustomer(null);
      setLoyaltyRedeem(0);
    }
  }, [customerInfo.phone]);

  // ── Products ─────────────────────────────────────────────────────────────

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_CONFIG.API_ROOT}/products`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      logger.error("Error loading products:", err);
    }
  };

  const loadBatches = async (productId: string) => {
    try {
      const res = await fetch(
        `${API_CONFIG.PHARMACY_BASE}/batches?product_id=${productId}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data: Batch[] = await res.json();
        const today = new Date();
        const valid = data.filter(
          (b) => b.quantity_remaining > 0 && new Date(b.expiry_date) >= today
        );
        setBatches(valid);
        if (valid.length === 0 && data.length > 0)
          toast.info("All batches for this product are expired or out of stock");
      }
    } catch (err) {
      logger.error("Error loading batches:", err);
      setBatches([]);
    }
  };

  // ── C1: USB HID barcode buffer ────────────────────────────────────────────
  // USB HID scanners emit characters very fast then send Enter.
  // We accumulate into a buffer and flush when Enter is pressed OR after a
  // 100ms silence (in case the scanner doesn't send Enter).

  const flushBarcode = useCallback((value: string) => {
    const code = value.trim();
    if (!code) return;
    barcodeBuffer.current = "";
    handleBarcodeScan(code);
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    barcodeBuffer.current = val;
    if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
    barcodeTimer.current = setTimeout(() => {
      // Only auto-trigger if input is long enough to be a barcode (>=6 chars)
      // and was typed very quickly (USB HID scanner)
      if (barcodeBuffer.current.length >= 6) {
        flushBarcode(barcodeBuffer.current);
      }
    }, 100);
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
      flushBarcode(searchTerm);
      e.preventDefault();
    }
  };

  // ── Barcode / Product ─────────────────────────────────────────────────────

  const handleBarcodeScan = (barcode: string) => {
    if (!barcode.trim()) return;
    const product = products.find(
      (p) => p.sku === barcode || p.barcode === barcode || p.id === barcode
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
      toast.error(`No product found for barcode: ${barcode}`);
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
    const rx = selectedProduct.is_prescription_required || selectedProduct.prescription_required;
    if (rx && !customerInfo.phone) {
      toast.error("Prescription medicines require a customer phone number.");
      setBatchDialog(false);
      return;
    }
    if (batch.quantity_remaining <= 0) {
      toast.error("This batch is out of stock");
      return;
    }
    const expiryDate = new Date(batch.expiry_date);
    const daysLeft = Math.floor((expiryDate.getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) { toast.error("Cannot sell expired batch"); return; }
    if (daysLeft < 30) toast.warning(`Batch expires in ${daysLeft} days`);
    else if (daysLeft < 90) toast.info(`Batch expires in ${daysLeft} days`);

    const existing = cart.findIndex(
      (i) => i.product_id === selectedProduct.id && i.batch_number === batch.batch_number
    );
    if (existing >= 0) {
      const updated = [...cart];
      const newQty = updated[existing].quantity + 1;
      if (newQty > batch.quantity_remaining) {
        toast.error(`Only ${batch.quantity_remaining} units available`);
        return;
      }
      updated[existing].quantity = newQty;
      updated[existing].total_price = calculateItemTotal(updated[existing]);
      setCart(updated);
    } else {
      const item: CartItem = {
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
        total_price: 0,
        is_prescription_required: rx,
        generic_name: selectedProduct.generic_name,
      };
      item.total_price = calculateItemTotal(item);
      setCart([...cart, item]);
    }
    setBatchDialog(false);
    setSelectedProduct(null);
    toast.success("Item added to cart");
  };

  // ── Cart helpers ──────────────────────────────────────────────────────────

  const calculateItemTotal = (item: CartItem) => {
    const sub = item.quantity * item.unit_price;
    const disc = (sub * item.discount_percentage) / 100;
    const after = sub - disc;
    return after + (after * item.gst_percent) / 100;
  };

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    const updated = [...cart];
    const item = updated[index];
    if (updates.quantity !== undefined) {
      const batch = batches.find((b) => b.batch_number === item.batch_number);
      if (batch && updates.quantity > batch.quantity_remaining) {
        toast.error(`Only ${batch.quantity_remaining} units available`);
        return;
      }
    }
    updated[index] = { ...item, ...updates };
    updated[index].total_price = calculateItemTotal(updated[index]);
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
    toast.success("Item removed");
  };

  const clearCart = () => {
    if (!confirm("Clear all items from cart?")) return;
    setCart([]);
    setCustomerInfo({ name: "Walk-in Customer", phone: "", email: "", address: "" });
    setPaymentInfo({ discount: 0, tax: 0, notes: "" });
    setPaymentSplits([{ method: "cash", amount: 0 }]);
    setLoyaltyCustomer(null);
    setLoyaltyRedeem(0);
    toast.success("Cart cleared");
  };

  const calculateCartTotal = () => {
    const itemsTotal = cart.reduce((s, i) => s + i.total_price, 0);
    const discount = (paymentInfo.discount || 0) + loyaltyRedeem;
    const afterDiscount = Math.max(0, itemsTotal - discount);
    const tax = paymentInfo.tax || 0;
    const grandTotal = afterDiscount + tax;
    return { itemsTotal, discount, afterDiscount, tax, grandTotal };
  };

  // ── C3: Split payment helpers ────────────────────────────────────────────

  const addSplit = () => {
    setPaymentSplits([...paymentSplits, { method: "card", amount: 0 }]);
  };

  const removeSplit = (i: number) => {
    setPaymentSplits(paymentSplits.filter((_, idx) => idx !== i));
  };

  const updateSplit = (i: number, updates: Partial<PaymentSplit>) => {
    const updated = [...paymentSplits];
    updated[i] = { ...updated[i], ...updates };
    setPaymentSplits(updated);
  };

  const totalPaid = paymentSplits.reduce((s, p) => s + (p.amount || 0), 0);

  const autoFillRemaining = (index: number) => {
    const { grandTotal } = calculateCartTotal();
    const others = paymentSplits.reduce((s, p, i) => i === index ? s : s + (p.amount || 0), 0);
    updateSplit(index, { amount: Math.max(0, grandTotal - others) });
  };

  // ── C4: Loyalty ──────────────────────────────────────────────────────────

  const lookupCustomerByPhone = async (phone: string) => {
    setLookingUpCustomer(true);
    try {
      const res = await fetch(
        `${API_CONFIG.API_ROOT}/customers/by-phone/${encodeURIComponent(phone)}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data: LoyaltyCustomer = await res.json();
        setLoyaltyCustomer(data);
        // auto-fill name if still default
        if (customerInfo.name === "Walk-in Customer" && data.name) {
          setCustomerInfo((c) => ({ ...c, name: data.name }));
        }
        toast.success(`Customer found: ${data.name} — ${data.loyalty_points} pts`);
      } else {
        setLoyaltyCustomer(null);
      }
    } catch (err) {
      logger.error("Customer lookup failed", err);
      setLoyaltyCustomer(null);
    } finally {
      setLookingUpCustomer(false);
    }
  };

  const maxRedeemable = loyaltyCustomer
    ? Math.min(loyaltyCustomer.loyalty_points, Math.floor(calculateCartTotal().grandTotal))
    : 0;

  // ── C6: Offline queue ────────────────────────────────────────────────────

  const refreshOfflineCount = async () => {
    const items = await idbGetAll();
    setOfflineQueueCount(items.length);
  };

  const syncOfflineQueue = async () => {
    setSyncing(true);
    try {
      const queue = await idbGetAll();
      if (queue.length === 0) { setSyncing(false); return; }
      let synced = 0;
      for (const item of queue) {
        try {
          await submitSaleToServer(item.salePayload, item.items, item.splits);
          await idbDelete(item.id);
          synced++;
        } catch {
          // leave failed items in queue
        }
      }
      if (synced > 0) toast.success(`Synced ${synced} offline sale(s)`);
      await refreshOfflineCount();
    } finally {
      setSyncing(false);
    }
  };

  // ── Checkout ──────────────────────────────────────────────────────────────

  const submitSaleToServer = async (
    salePayload: Record<string, unknown>,
    items: CartItem[],
    splits: PaymentSplit[]
  ) => {
    const saleRes = await fetch(`${API_CONFIG.API_ROOT}/sales`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(salePayload),
    });
    if (!saleRes.ok) throw new Error("Failed to create sale");
    const sale = await saleRes.json();

    for (const item of items) {
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
          gst_percent: item.gst_percent,
        }),
      });
    }

    // Record split payments
    for (const split of splits) {
      if (split.amount > 0) {
        await fetch(`${API_CONFIG.API_ROOT}/sale-payments`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ sale_id: sale.id, payment_method: split.method, amount: split.amount }),
        }).catch(() => {}); // non-blocking
      }
    }

    return sale;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    const { grandTotal } = calculateCartTotal();
    const totals = calculateCartTotal();

    // Validate splits
    const mainMethod = paymentSplits[0]?.method || "cash";
    if (mainMethod === "cash" && totalPaid < grandTotal) {
      toast.error(`Insufficient payment: paid ৳${totalPaid.toFixed(2)}, need ৳${grandTotal.toFixed(2)}`);
      return;
    }

    const salePayload: Record<string, unknown> = {
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      customer_email: customerInfo.email,
      total_amount: totals.itemsTotal,
      discount: totals.discount,
      tax: totals.tax,
      net_amount: grandTotal,
      payment_method: mainMethod,
      payment_status: "completed",
      notes: paymentInfo.notes,
      created_by: null,
    };

    try {
      if (!isOnline) {
        // C6: Queue offline
        const queueItem: OfflineQueueItem = {
          id: crypto.randomUUID(),
          salePayload,
          items: cart,
          splits: paymentSplits,
          createdAt: new Date().toISOString(),
        };
        await idbAdd(queueItem);
        await refreshOfflineCount();
        toast.warning("Sale saved offline — will sync when reconnected");
        // Still print receipt with a temp ID
        printReceipt({ id: queueItem.id }, cart, totals);
      } else {
        const sale = await submitSaleToServer(salePayload, cart, paymentSplits);

        // C4: Loyalty earn/redeem
        if (loyaltyCustomer) {
          const earned = Math.floor(grandTotal / 10);
          await fetch(`${API_CONFIG.API_ROOT}/customers/${loyaltyCustomer.id}/loyalty`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              earn: earned,
              redeem: loyaltyRedeem,
              sale_id: sale.id,
            }),
          }).catch(() => {});
          toast.success(`Loyalty: earned ${earned} pts, redeemed ${loyaltyRedeem} pts`);
        }

        toast.success("Sale completed!");
        printReceipt(sale, cart, totals);
      }

      // Clear state
      setCart([]);
      setCustomerInfo({ name: "Walk-in Customer", phone: "", email: "", address: "" });
      setPaymentInfo({ discount: 0, tax: 0, notes: "" });
      setPaymentSplits([{ method: "cash", amount: 0 }]);
      setLoyaltyCustomer(null);
      setLoyaltyRedeem(0);
      setCheckoutDialog(false);
    } catch (err) {
      toast.error("Error processing sale");
      logger.error(err);
    }
  };

  const printReceipt = (sale: { id: string }, items: CartItem[], totals: ReturnType<typeof calculateCartTotal>) => {
    const win = window.open("", "_blank", "width=320,height=600");
    if (!win) return;
    const splitLines = paymentSplits
      .filter((s) => s.amount > 0)
      .map((s) => `<div>${s.method.charAt(0).toUpperCase() + s.method.slice(1)}: <span class="right">৳${s.amount.toFixed(2)}</span></div>`)
      .join("");
    const loyaltyLine = loyaltyRedeem > 0
      ? `<div>Loyalty Redeem: <span class="right">-৳${loyaltyRedeem.toFixed(2)}</span></div>` : "";
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Receipt</title>
      <style>
        body{font-family:'Courier New',monospace;padding:10px;font-size:12px}
        h2{text-align:center;margin:5px 0}
        .center{text-align:center}
        .divider{border-top:1px dashed #000;margin:8px 0}
        table{width:100%}
        .right{float:right}
        .total{font-size:14px;font-weight:bold}
        tr td:last-child{text-align:right}
      </style></head><body>
      <h2>PHARMAZINE</h2>
      <div class="center">Your Health, Our Priority</div>
      <div class="divider"></div>
      <div>Date: ${format(new Date(), "dd MMM yyyy HH:mm")}</div>
      <div>Invoice: ${sale.id.substring(0, 8)}</div>
      <div>Customer: ${customerInfo.name}</div>
      ${customerInfo.phone ? `<div>Phone: ${customerInfo.phone}</div>` : ""}
      <div class="divider"></div>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
      ${items.map((item) => `
        <tr><td>${item.product_name}</td><td>${item.quantity}</td>
        <td>৳${item.unit_price.toFixed(2)}</td><td>৳${item.total_price.toFixed(2)}</td></tr>
        <tr><td colspan="4" style="font-size:10px;color:#666">Batch: ${item.batch_number}, Exp: ${format(new Date(item.expiry_date), "MMM yyyy")}</td></tr>
      `).join("")}
      </tbody></table>
      <div class="divider"></div>
      <div>Subtotal: <span class="right">৳${totals.itemsTotal.toFixed(2)}</span></div>
      ${totals.discount > 0 ? `<div>Discount: <span class="right">-৳${totals.discount.toFixed(2)}</span></div>` : ""}
      ${loyaltyLine}
      ${totals.tax > 0 ? `<div>Tax: <span class="right">৳${totals.tax.toFixed(2)}</span></div>` : ""}
      <div class="divider"></div>
      <div class="total">TOTAL: <span class="right">৳${totals.grandTotal.toFixed(2)}</span></div>
      ${splitLines}
      <div class="divider"></div>
      <div class="center">Thank you for your purchase!</div>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 250);
  };

  // ── Filtered products ─────────────────────────────────────────────────────

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.generic_name && p.generic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totals = calculateCartTotal();

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen">
      {/* Gradient Header */}
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
            {/* C6: Online/Offline indicator */}
            <div className={`bg-white/15 backdrop-blur-md rounded-xl px-3 py-2 border flex items-center gap-2 ${isOnline ? "border-green-300/40" : "border-red-300/40"}`}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-200" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-200" />
              )}
              <span className="text-xs text-white/80 font-medium">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>

            {offlineQueueCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={syncOfflineQueue}
                disabled={syncing || !isOnline}
                className="gap-2 bg-orange-400/30 hover:bg-orange-400/40 text-white border-orange-300/40"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                Sync ({offlineQueueCount})
              </Button>
            )}

            <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 text-center">
              <div className="text-xs text-white/70 font-medium">PRODUCTS</div>
              <div className="text-xl font-bold text-white">{products.length}</div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 text-center">
              <div className="text-xs text-white/70 font-medium">CART</div>
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
        {/* Left: Product Search & Cart */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Barcode / Search */}
          <Card className="pharmacy-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Barcode className="w-5 h-5 text-primary" />
                Barcode Scanner / Product Search
                <Badge variant="outline" className="text-xs ml-auto font-normal">
                  C1: USB HID buffered
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Barcode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode or type product name…"
                  value={searchTerm}
                  onChange={handleBarcodeChange}
                  onKeyDown={handleBarcodeKeyDown}
                  className="pl-10 pharmacy-input"
                  autoFocus
                />
              </div>

              {searchTerm && (
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-2 space-y-1">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">No products found</div>
                    ) : (
                      filteredProducts.slice(0, 10).map((product) => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                          onClick={() => handleProductSelect(product)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.generic_name && (
                                <div className="text-xs text-muted-foreground">Generic: {product.generic_name}</div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                SKU: {product.sku} | Stock: {product.stock_quantity}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">
                                ৳{(product.selling_price || product.mrp).toFixed(2)}
                              </div>
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
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cart.length} items)
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReturnDialog(true)}
                    className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Returns
                  </Button>
                  {cart.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={clearCart}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
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
                          <Button size="sm" variant="ghost" onClick={() => removeFromCart(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateCartItem(index, { quantity: Math.max(1, item.quantity - 1) })}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(index, { quantity: parseInt(e.target.value) || 1 })}
                              className="w-16 text-center pharmacy-input p-1 h-8"
                            />
                            <Button size="sm" variant="outline" onClick={() => updateCartItem(index, { quantity: item.quantity + 1 })}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">× ৳{item.unit_price.toFixed(2)}</div>
                          <div className="ml-auto font-bold text-primary">৳{item.total_price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary & Checkout */}
        <div className="flex flex-col gap-4">
          <Card className="pharmacy-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">৳{totals.itemsTotal.toFixed(2)}</span>
                </div>

                <div>
                  <Label className="text-xs">Discount (৳)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentInfo.discount}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, discount: parseFloat(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>

                <div>
                  <Label className="text-xs">Additional Tax (৳)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentInfo.tax}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, tax: parseFloat(e.target.value) || 0 })}
                    className="pharmacy-input"
                  />
                </div>

                {loyaltyRedeem > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Loyalty Redeem:</span>
                    <span>-৳{loyaltyRedeem.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">৳{totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* C3: Quick payment method */}
              <div className="space-y-2 pt-2 border-t">
                <Label className="flex items-center gap-1">
                  <Split className="w-4 h-4" /> Payment
                </Label>
                {paymentSplits.map((split, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select
                      value={split.method}
                      onValueChange={(v) => updateSplit(i, { method: v })}
                    >
                      <SelectTrigger className="pharmacy-input w-28 flex-shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={split.amount || ""}
                        placeholder="Amount"
                        onChange={(e) => updateSplit(i, { amount: parseFloat(e.target.value) || 0 })}
                        className="pharmacy-input"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-500 text-xs px-1"
                      title="Auto-fill remaining"
                      onClick={() => autoFillRemaining(i)}
                    >
                      Auto
                    </Button>
                    {paymentSplits.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeSplit(i)}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSplit}
                  className="w-full text-xs gap-1"
                  disabled={paymentSplits.length >= 3}
                >
                  <Plus className="w-3 h-3" />
                  Add Payment Method
                </Button>
                {totalPaid > 0 && (
                  <div className={`text-sm font-medium flex justify-between ${totalPaid >= totals.grandTotal ? "text-green-600" : "text-red-500"}`}>
                    <span>Paid:</span>
                    <span>৳{totalPaid.toFixed(2)}</span>
                  </div>
                )}
                {totalPaid > totals.grandTotal && totals.grandTotal > 0 && (
                  <div className="text-sm text-green-600 flex justify-between">
                    <span>Change:</span>
                    <span>৳{(totalPaid - totals.grandTotal).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Button
                className="pharmacy-button w-full"
                size="lg"
                onClick={() => {
                  const { grandTotal } = calculateCartTotal();
                  // Auto-fill first split if empty
                  if (paymentSplits[0].amount === 0) {
                    setPaymentSplits([{ ...paymentSplits[0], amount: grandTotal }, ...paymentSplits.slice(1)]);
                  }
                  setCheckoutDialog(true);
                }}
                disabled={cart.length === 0}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Batch Selection Dialog ─────────────────────────────────────────── */}
      <Dialog open={batchDialog} onOpenChange={setBatchDialog}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>Select Batch</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name}
              {selectedProduct?.is_prescription_required && (
                <Badge variant="destructive" className="ml-2">Rx Required</Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          {batches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No batches available</div>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => (
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
                        ৳{(batch.selling_price || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        MRP: ৳{(batch.mrp || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Checkout Confirmation Dialog ──────────────────────────────────── */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="glass-strong max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Sale</DialogTitle>
            <DialogDescription>Review order details before completing</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Customer Info */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="pharmacy-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone {lookingUpCustomer && <span className="text-xs text-muted-foreground ml-1">looking up…</span>}</Label>
                  <Input
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="For loyalty & Rx"
                    className="pharmacy-input"
                  />
                  {/* C4: Loyalty info */}
                  {loyaltyCustomer && (
                    <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-700">
                          {loyaltyCustomer.loyalty_points} loyalty pts
                        </span>
                      </div>
                      {maxRedeemable > 0 && (
                        <div className="mt-1">
                          <Label className="text-xs">Redeem points (max {maxRedeemable})</Label>
                          <Input
                            type="number"
                            min={0}
                            max={maxRedeemable}
                            value={loyaltyRedeem}
                            onChange={(e) => setLoyaltyRedeem(Math.min(maxRedeemable, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="pharmacy-input h-8 text-sm mt-1"
                          />
                        </div>
                      )}
                    </div>
                  )}
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
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={paymentInfo.notes}
                onChange={(e) => setPaymentInfo({ ...paymentInfo, notes: e.target.value })}
                placeholder="Optional notes…"
                className="pharmacy-input"
                rows={2}
              />
            </div>

            {/* Order Summary */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>৳{totals.itemsTotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount{loyaltyRedeem > 0 ? ` (incl. ${loyaltyRedeem} pts)` : ""}:</span>
                  <span>-৳{totals.discount.toFixed(2)}</span>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>৳{totals.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span className="text-primary">৳{totals.grandTotal.toFixed(2)}</span>
              </div>

              {/* C3: Payment splits summary */}
              <Separator />
              <div className="text-sm font-medium">Payment Methods:</div>
              {paymentSplits.filter((s) => s.amount > 0).map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="capitalize">{s.method}:</span>
                  <Badge variant="outline" className="capitalize">৳{s.amount.toFixed(2)}</Badge>
                </div>
              ))}
              {totalPaid > totals.grandTotal && (
                <div className="flex justify-between text-green-600 text-sm font-medium">
                  <span>Change:</span>
                  <span>৳{(totalPaid - totals.grandTotal).toFixed(2)}</span>
                </div>
              )}
              {!isOnline && (
                <div className="flex items-center gap-2 text-orange-600 text-sm mt-2">
                  <WifiOff className="w-4 h-4" />
                  Sale will be saved offline and synced later
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialog(false)}>Cancel</Button>
            <Button className="pharmacy-button" onClick={handleCheckout}>
              <Receipt className="w-4 h-4 mr-2" />
              {isOnline ? "Complete Sale & Print" : "Save Offline & Print"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sales Return Dialog ────────────────────────────────────────────── */}
      <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-500" />
              Process Return
            </DialogTitle>
            <DialogDescription>
              Search for a recent sale to process a return
            </DialogDescription>
          </DialogHeader>
          <SalesReturnPanel onClose={() => setReturnDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sales Return Panel (C5) ─────────────────────────────────────────────────

function SalesReturnPanel({ onClose }: { onClose: () => void }) {
  const [invoiceId, setInvoiceId] = useState("");
  const [sale, setSale] = useState<{ id: string; net_amount: number; customer_name: string; items?: unknown[] } | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const searchSale = async () => {
    if (!invoiceId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_CONFIG.API_ROOT}/sales/${invoiceId.trim()}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        setSale(await res.json());
      } else {
        toast.error("Sale not found");
        setSale(null);
      }
    } catch {
      toast.error("Error searching sale");
    } finally {
      setLoading(false);
    }
  };

  const processReturn = async () => {
    if (!sale) return;
    setProcessing(true);
    try {
      const res = await fetch(`${API_CONFIG.API_ROOT}/sale-returns`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          original_sale_id: sale.id,
          return_reason: reason,
          total_refund: sale.net_amount,
          refund_method: "cash",
          status: "completed",
        }),
      });
      if (res.ok) {
        toast.success("Return processed successfully");
        onClose();
      } else {
        toast.error("Failed to process return");
      }
    } catch {
      toast.error("Error processing return");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter Invoice ID (first 8 chars)…"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          className="pharmacy-input"
          onKeyDown={(e) => e.key === "Enter" && searchSale()}
        />
        <Button onClick={searchSale} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {sale && (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-medium">{sale.customer_name}</p>
            <p className="text-sm text-gray-600">Net Amount: ৳{sale.net_amount?.toFixed(2)}</p>
            <p className="text-xs text-gray-400">ID: {sale.id}</p>
          </div>
          <div>
            <Label>Return Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this being returned?"
              className="pharmacy-input"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={processReturn}
              disabled={processing || !reason.trim()}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {processing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Process Return
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
