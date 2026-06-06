import { useState, useEffect } from "react";
import { Search, Package, Plus, RefreshCw, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { useCurrency } from "@/contexts/CurrencyContext";
import { logger } from "@/utils/logger";

interface MedicineBatch {
  id: string;
  product_id: string;
  batch_number: string;
  manufacture_date?: string;
  expiry_date: string;
  quantity_received: number;
  quantity_remaining: number;
  quantity_sold: number;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  rack_number?: string;
  is_active: boolean;
  is_expired: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface BatchTabProps {
  batches: MedicineBatch[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onRefresh?: () => void;
}

const EMPTY_FORM = {
  product_id: "none",
  batch_number: "",
  manufacture_date: "",
  expiry_date: "",
  quantity_received: 0,
  purchase_price: 0,
  mrp: 0,
  selling_price: 0,
  rack_number: "",
  notes: "",
};

export default function BatchTab({ batches, loading, searchTerm, setSearchTerm, onRefresh }: BatchTabProps) {
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Fetch products for the Add Batch dialog
  useEffect(() => {
    fetch(`${API_CONFIG.API_ROOT}/products`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {});
  }, []);

  // Build a product name lookup map
  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  const getExpiryStatus = (expiryDate: string) => {
    const daysToExpiry = differenceInDays(new Date(expiryDate), new Date());
    if (daysToExpiry < 0) return { status: "Expired", color: "destructive" as const, days: daysToExpiry };
    if (daysToExpiry <= 30) return { status: "Critical", color: "destructive" as const, days: daysToExpiry };
    if (daysToExpiry <= 60) return { status: "default" as const, status_label: "Warning", color: "default" as const, days: daysToExpiry };
    if (daysToExpiry <= 90) return { status: "Info", color: "secondary" as const, days: daysToExpiry };
    return { status: "Good", color: "secondary" as const, days: daysToExpiry };
  };

  const filteredBatches = batches.filter((b) => {
    const q = searchTerm.toLowerCase();
    const productName = productMap[b.product_id] || "";
    return (
      b.batch_number.toLowerCase().includes(q) ||
      productName.toLowerCase().includes(q) ||
      (b.rack_number?.toLowerCase().includes(q) ?? false)
    );
  });

  const f = (key: keyof typeof EMPTY_FORM, val: string | number) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.product_id || form.product_id === "none") {
      toast.error("Please select a medicine");
      return;
    }
    if (!form.batch_number.trim()) {
      toast.error("Batch number is required");
      return;
    }
    if (!form.expiry_date) {
      toast.error("Expiry date is required");
      return;
    }
    if (form.quantity_received <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        product_id: form.product_id,
        batch_number: form.batch_number.trim(),
        manufacture_date: form.manufacture_date || null,
        expiry_date: form.expiry_date,
        quantity_received: form.quantity_received,
        purchase_price: form.purchase_price || 0,
        mrp: form.mrp || 0,
        selling_price: form.selling_price || form.mrp || 0,
        rack_number: form.rack_number || null,
        notes: form.notes || null,
      };

      const res = await fetch(`${API_CONFIG.PHARMACY_BASE}/batches`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Also update product stock_quantity
        try {
          await fetch(
            `${API_CONFIG.API_ROOT}/products/${form.product_id}/stock-add`,
            {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify({ quantity: form.quantity_received }),
            }
          );
        } catch {
          // Non-fatal — backend will update via purchase flow
        }

        toast.success("Batch added successfully");
        setDialogOpen(false);
        setForm(EMPTY_FORM);
        onRefresh?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to add batch");
      }
    } catch (err) {
      logger.error("Batch save error:", err);
      toast.error("Error saving batch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Medicine Batches
              </CardTitle>
              <CardDescription>
                Track batches with expiry dates and stock levels — {batches.length} batches total
              </CardDescription>
            </div>
            <Button size="sm" className="pharmacy-button" onClick={() => { setForm(EMPTY_FORM); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" />
              Add Batch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by batch number, medicine name, location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pharmacy-input"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading batches…</div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm
                ? "No batches match your search"
                : "No batches yet. Add a batch above or create a purchase to auto-generate batches."}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Batch No.</TableHead>
                    <TableHead>Mfg. Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Purchase</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiry_date);
                    return (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {productMap[batch.product_id] || batch.product_id.substring(0, 8) + "…"}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="pharmacy-badge font-mono">
                            {batch.batch_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {batch.manufacture_date
                            ? format(new Date(batch.manufacture_date), "dd MMM yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            {format(new Date(batch.expiry_date), "dd MMM yyyy")}
                            {expiryStatus.days <= 90 && expiryStatus.days > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {expiryStatus.days}d
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{batch.quantity_received}</TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={batch.quantity_remaining <= 10 ? "text-orange-600" : ""}>
                            {batch.quantity_remaining}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {batch.quantity_sold}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(batch.purchase_price || 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {formatCurrency(batch.mrp || 0)}
                        </TableCell>
                        <TableCell>
                          {batch.rack_number ? (
                            <Badge variant="outline" className="pharmacy-badge text-xs">
                              {batch.rack_number}
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={expiryStatus.color}
                            className="pharmacy-badge"
                          >
                            {expiryStatus.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Batch Dialog ───────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Stock Batch</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2">
              <Label>Medicine *</Label>
              <Select value={form.product_id} onValueChange={(v) => f("product_id", v)}>
                <SelectTrigger className="pharmacy-input">
                  <SelectValue placeholder="Select medicine…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select medicine —</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Batch Number *</Label>
              <Input
                value={form.batch_number}
                onChange={(e) => f("batch_number", e.target.value)}
                placeholder="e.g. BN-2026-001"
                className="pharmacy-input"
              />
            </div>

            <div>
              <Label>Quantity *</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity_received || ""}
                onChange={(e) => f("quantity_received", parseInt(e.target.value) || 0)}
                className="pharmacy-input"
              />
            </div>

            <div>
              <Label>Manufacture Date</Label>
              <Input
                type="date"
                value={form.manufacture_date}
                onChange={(e) => f("manufacture_date", e.target.value)}
                className="pharmacy-input"
              />
            </div>

            <div>
              <Label>Expiry Date *</Label>
              <Input
                type="date"
                value={form.expiry_date}
                onChange={(e) => f("expiry_date", e.target.value)}
                className="pharmacy-input"
              />
            </div>

            <div>
              <Label>Purchase Price (per unit)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.purchase_price || ""}
                onChange={(e) => f("purchase_price", parseFloat(e.target.value) || 0)}
                className="pharmacy-input"
              />
            </div>

            <div>
              <Label>MRP (per unit)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.mrp || ""}
                onChange={(e) => f("mrp", parseFloat(e.target.value) || 0)}
                className="pharmacy-input"
              />
            </div>

            <div>
              <Label>Selling Price (per unit)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.selling_price || ""}
                onChange={(e) => f("selling_price", parseFloat(e.target.value) || 0)}
                placeholder="Defaults to MRP"
                className="pharmacy-input"
              />
            </div>

            <div>
              <Label>Rack / Location</Label>
              <Input
                value={form.rack_number}
                onChange={(e) => f("rack_number", e.target.value)}
                placeholder="e.g. A1, B2"
                className="pharmacy-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button className="pharmacy-button" onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              {saving ? "Saving…" : "Add Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
