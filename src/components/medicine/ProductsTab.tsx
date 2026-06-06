import { useState, useEffect } from "react";
import {
  Plus, Search, Edit, Trash2, Package, Pill, AlertTriangle,
  CheckCircle, XCircle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { useCurrency } from "@/contexts/CurrencyContext";
import { logger } from "@/utils/logger";

interface Product {
  id: string;
  name: string;
  sku: string;
  generic_name?: string;
  brand_name?: string;
  strength?: string;
  category_id?: string;
  category?: string;
  supplier_id?: string;
  unit_price: number;
  cost_price: number;
  mrp_unit?: number;
  stock_quantity: number;
  reorder_level?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  pack_size?: number;
  strip_size?: number;
  is_prescription_required?: boolean;
  is_narcotic?: boolean;
  rack_number?: string;
  shelf_number?: string;
  storage_condition?: string;
  description?: string;
  is_active?: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  name: "",
  sku: "",
  generic_name: "",
  brand_name: "",
  strength: "",
  category_id: "",
  supplier_id: "",
  unit_price: 0,
  cost_price: 0,
  mrp_unit: 0,
  reorder_level: 10,
  min_stock_level: 5,
  max_stock_level: 500,
  pack_size: 1,
  strip_size: 10,
  is_prescription_required: false,
  is_narcotic: false,
  rack_number: "",
  shelf_number: "",
  storage_condition: "",
  description: "",
};

export default function ProductsTab() {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSuppliers();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.API_ROOT}/products`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setProducts(await res.json());
      } else {
        toast.error("Failed to load products");
      }
    } catch (e) {
      toast.error("Error loading products");
      logger.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_CONFIG.API_ROOT}/categories`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      logger.error("Categories load failed", e);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await fetch(`${API_CONFIG.API_ROOT}/suppliers`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) setSuppliers(await res.json());
    } catch (e) {
      logger.error("Suppliers load failed", e);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setDialog(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name ?? "",
      sku: p.sku ?? "",
      generic_name: p.generic_name ?? "",
      brand_name: p.brand_name ?? "",
      strength: p.strength ?? "",
      category_id: p.category_id ?? "",
      supplier_id: p.supplier_id ?? "",
      unit_price: p.unit_price ?? 0,
      cost_price: p.cost_price ?? 0,
      mrp_unit: p.mrp_unit ?? 0,
      reorder_level: p.reorder_level ?? 10,
      min_stock_level: p.min_stock_level ?? 5,
      max_stock_level: p.max_stock_level ?? 500,
      pack_size: p.pack_size ?? 1,
      strip_size: p.strip_size ?? 10,
      is_prescription_required: p.is_prescription_required ?? false,
      is_narcotic: p.is_narcotic ?? false,
      rack_number: p.rack_number ?? "",
      shelf_number: p.shelf_number ?? "",
      storage_condition: p.storage_condition ?? "",
      description: p.description ?? "",
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Medicine name is required"); return; }
    if (!form.sku.trim()) { toast.error("SKU is required"); return; }
    if (form.unit_price < 0) { toast.error("Selling price cannot be negative"); return; }
    if (form.cost_price < 0) { toast.error("Purchase price cannot be negative"); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id && form.category_id !== "none" ? form.category_id : null,
        supplier_id: form.supplier_id && form.supplier_id !== "none" ? form.supplier_id : null,
      };
      const url = editing
        ? `${API_CONFIG.API_ROOT}/products/${editing.id}`
        : `${API_CONFIG.API_ROOT}/products`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editing ? "Medicine updated successfully" : "Medicine added successfully");
        setDialog(false);
        loadProducts();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to save medicine");
      }
    } catch (e) {
      toast.error("Error saving medicine");
      logger.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_CONFIG.API_ROOT}/products/${p.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast.success("Medicine deleted");
        loadProducts();
      } else {
        toast.error("Failed to delete medicine");
      }
    } catch (e) {
      toast.error("Error deleting medicine");
      logger.error(e);
    }
  };

  const f = (field: keyof typeof EMPTY_FORM, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.generic_name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.brand_name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stockBadge = (p: Product) => {
    if (p.stock_quantity <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (p.stock_quantity <= (p.reorder_level ?? 10)) return <Badge variant="default" className="bg-orange-500">Low</Badge>;
    return <Badge variant="secondary" className="bg-green-100 text-green-700">In Stock</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Medicine / Product List
              </CardTitle>
              <CardDescription>
                Add, edit, and manage all medicines in your pharmacy. Adding a medicine here registers it in the system — then use <strong>Purchase</strong> to add stock batches.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadProducts} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button className="pharmacy-button" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add Medicine
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, generic name, or brand…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pharmacy-input"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading medicines…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-3">
              <Package className="w-12 h-12 mx-auto opacity-30" />
              <p className="font-medium">
                {searchTerm ? "No medicines match your search" : "No medicines added yet"}
              </p>
              {!searchTerm && (
                <p className="text-sm">
                  Click <strong>"Add Medicine"</strong> above to register your first medicine.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Generic / Strength</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Cost Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Rx</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <div>{p.name}</div>
                        {p.brand_name && (
                          <div className="text-xs text-muted-foreground">{p.brand_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.sku}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{p.generic_name || "—"}</div>
                        {p.strength && (
                          <div className="text-xs text-muted-foreground">{p.strength}</div>
                        )}
                      </TableCell>
                      <TableCell>{p.category || "—"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.cost_price)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.unit_price)}</TableCell>
                      <TableCell className="text-right">
                        <span className={p.stock_quantity <= 0 ? "text-red-600 font-bold" : p.stock_quantity <= (p.reorder_level ?? 10) ? "text-orange-600 font-bold" : ""}>
                          {p.stock_quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{stockBadge(p)}</TableCell>
                      <TableCell className="text-center">
                        {p.is_prescription_required
                          ? <Badge variant="default" className="bg-blue-600 text-xs">Rx</Badge>
                          : <span className="text-muted-foreground text-xs">OTC</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit"
                            onClick={() => openEdit(p)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            title="Delete"
                            onClick={() => handleDelete(p)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-2 text-xs text-muted-foreground text-right">
            {filtered.length} of {products.length} medicines
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              {editing ? "Edit Medicine" : "Add New Medicine"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the medicine details below."
                : "Fill in the medicine details. Fields marked * are required. Stock is added separately through Purchase orders."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Section: Basic Info */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Basic Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Medicine Name *</Label>
                  <Input
                    placeholder="e.g. Paracetamol 500mg Tablet"
                    value={form.name}
                    onChange={e => f("name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Generic Name</Label>
                  <Input
                    placeholder="e.g. Paracetamol"
                    value={form.generic_name}
                    onChange={e => f("generic_name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Brand Name</Label>
                  <Input
                    placeholder="e.g. Napa, Ace"
                    value={form.brand_name}
                    onChange={e => f("brand_name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Strength / Dosage</Label>
                  <Input
                    placeholder="e.g. 500mg, 250mg/5ml"
                    value={form.strength}
                    onChange={e => f("strength", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>SKU / Item Code *</Label>
                  <Input
                    placeholder="e.g. PARA-500-TAB"
                    value={form.sku}
                    onChange={e => f("sku", e.target.value.toUpperCase())}
                  />
                  <p className="text-xs text-muted-foreground">Unique code — no two medicines can share the same SKU</p>
                </div>
              </div>
            </div>

            {/* Section: Classification */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Classification</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category_id || "none"} onValueChange={v => f("category_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Default Supplier</Label>
                  <Select value={form.supplier_id || "none"} onValueChange={v => f("supplier_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section: Pricing */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Pricing</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Purchase / Cost Price (৳) *</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={form.cost_price}
                    onChange={e => f("cost_price", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Selling Price (৳) *</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={form.unit_price}
                    onChange={e => f("unit_price", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>MRP (৳)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={form.mrp_unit}
                    onChange={e => f("mrp_unit", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Section: Pack Details */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Pack Details</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Pack Size (units/pack)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.pack_size}
                    onChange={e => f("pack_size", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Strip Size (units/strip)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.strip_size}
                    onChange={e => f("strip_size", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Storage Condition</Label>
                  <Input
                    placeholder="e.g. Store below 30°C"
                    value={form.storage_condition}
                    onChange={e => f("storage_condition", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section: Stock Levels */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Stock Level Thresholds</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.reorder_level}
                    onChange={e => f("reorder_level", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">Alert triggers below this</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Min Stock</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.min_stock_level}
                    onChange={e => f("min_stock_level", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Stock</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.max_stock_level}
                    onChange={e => f("max_stock_level", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Section: Location */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Storage Location</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Rack Number</Label>
                  <Input
                    placeholder="e.g. A1, B3"
                    value={form.rack_number}
                    onChange={e => f("rack_number", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Shelf Number</Label>
                  <Input
                    placeholder="e.g. S1, S2"
                    value={form.shelf_number}
                    onChange={e => f("shelf_number", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section: Flags */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Flags</p>
              <div className="flex gap-8">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.is_prescription_required}
                    onCheckedChange={v => f("is_prescription_required", v)}
                  />
                  <Label>Prescription Required (Rx)</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.is_narcotic}
                    onCheckedChange={v => f("is_narcotic", v)}
                  />
                  <Label>Narcotic / Controlled Drug</Label>
                </div>
              </div>
            </div>

            {/* Section: Notes */}
            <div className="space-y-1.5">
              <Label>Notes / Description</Label>
              <Textarea
                placeholder="Any additional notes about this medicine…"
                value={form.description}
                onChange={e => f("description", e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button
              className="pharmacy-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : editing ? "Update Medicine" : "Add Medicine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
