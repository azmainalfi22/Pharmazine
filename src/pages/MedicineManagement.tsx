import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, BarChart3, QrCode, Printer, FileDown, Calendar, TrendingUp, DollarSign } from "lucide-react";
import ManufacturerTab from "@/components/medicine/ManufacturerTab";
import BatchTab from "@/components/medicine/BatchTab";
import ExpiryAlertTab from "@/components/medicine/ExpiryAlertTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

const API_BASE = "http://localhost:8000/api/pharmacy";

// Interfaces
interface MedicineCategory {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UnitType {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MedicineType {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Manufacturer {
  id: string;
  name: string;
  code: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  tax_number: string;
  payment_terms: string;
  credit_limit: number;
  current_balance: number;
  website: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MedicineBatch {
  id: string;
  product_id: string;
  batch_number: string;
  manufacture_date: string;
  expiry_date: string;
  manufacturer_id: string;
  quantity_received: number;
  quantity_remaining: number;
  quantity_sold: number;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  rack_number: string;
  is_active: boolean;
  is_expired: boolean;
  created_at: string;
}

interface ExpiryAlert {
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  expiry_date: string;
  quantity_remaining: number;
  purchase_price: number;
  value_at_risk: number;
  days_to_expiry: number;
  alert_level: string;
}

export default function MedicineManagement() {
  const [activeTab, setActiveTab] = useState("categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Categories State
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MedicineCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", display_order: 0, is_active: true });

  // Unit Types State
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [unitDialog, setUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitType | null>(null);
  const [unitForm, setUnitForm] = useState({ name: "", abbreviation: "", category: "", display_order: 0, is_active: true });

  // Medicine Types State
  const [medicineTypes, setMedicineTypes] = useState<MedicineType[]>([]);
  const [typeDialog, setTypeDialog] = useState(false);
  const [editingType, setEditingType] = useState<MedicineType | null>(null);
  const [typeForm, setTypeForm] = useState({ name: "", description: "", display_order: 0, is_active: true });

  // Manufacturers State
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [manufacturerDialog, setManufacturerDialog] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [manufacturerForm, setManufacturerForm] = useState({
    name: "", code: "", contact_person: "", phone: "", email: "", address: "",
    city: "", state: "", country: "", postal_code: "", tax_number: "",
    payment_terms: "", credit_limit: 0, website: "", notes: "", is_active: true
  });

  // Batches State
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  
  // Expiry Alerts State
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [expiryFilter, setExpiryFilter] = useState("all");

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "categories") loadCategories();
    if (activeTab === "units") loadUnitTypes();
    if (activeTab === "types") loadMedicineTypes();
    if (activeTab === "manufacturers") loadManufacturers();
    if (activeTab === "batches") loadBatches();
    if (activeTab === "expiry") loadExpiryAlerts();
  }, [activeTab]);

  // Reload expiry alerts when filter changes
  useEffect(() => {
    if (activeTab === "expiry") loadExpiryAlerts();
  }, [expiryFilter]);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  // ===== CATEGORY FUNCTIONS =====
  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/medicine-categories`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        toast.error("Failed to load categories");
      }
    } catch (error) {
      toast.error("Error loading categories");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setLoading(true);
    try {
      const url = editingCategory
        ? `${API_BASE}/medicine-categories/${editingCategory.id}`
        : `${API_BASE}/medicine-categories`;
      
      const response = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(categoryForm)
      });

      if (response.ok) {
        toast.success(editingCategory ? "Category updated successfully" : "Category created successfully");
        setCategoryDialog(false);
        setEditingCategory(null);
        setCategoryForm({ name: "", description: "", display_order: 0, is_active: true });
        loadCategories();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save category");
      }
    } catch (error) {
      toast.error("Error saving category");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/medicine-categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      if (response.ok) {
        toast.success("Category deleted successfully");
        loadCategories();
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      toast.error("Error deleting category");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ===== UNIT TYPE FUNCTIONS =====
  const loadUnitTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/unit-types`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setUnitTypes(data);
      } else {
        toast.error("Failed to load unit types");
      }
    } catch (error) {
      toast.error("Error loading unit types");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveUnitType = async () => {
    if (!unitForm.name.trim() || !unitForm.abbreviation.trim()) {
      toast.error("Name and abbreviation are required");
      return;
    }

    setLoading(true);
    try {
      const url = editingUnit
        ? `${API_BASE}/unit-types/${editingUnit.id}`
        : `${API_BASE}/unit-types`;
      
      const response = await fetch(url, {
        method: editingUnit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(unitForm)
      });

      if (response.ok) {
        toast.success(editingUnit ? "Unit type updated successfully" : "Unit type created successfully");
        setUnitDialog(false);
        setEditingUnit(null);
        setUnitForm({ name: "", abbreviation: "", category: "", display_order: 0, is_active: true });
        loadUnitTypes();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save unit type");
      }
    } catch (error) {
      toast.error("Error saving unit type");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUnitType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this unit type?")) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/unit-types/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      if (response.ok) {
        toast.success("Unit type deleted successfully");
        loadUnitTypes();
      } else {
        toast.error("Failed to delete unit type");
      }
    } catch (error) {
      toast.error("Error deleting unit type");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ===== MEDICINE TYPE FUNCTIONS =====
  const loadMedicineTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/medicine-types`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setMedicineTypes(data);
      } else {
        toast.error("Failed to load medicine types");
      }
    } catch (error) {
      toast.error("Error loading medicine types");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveMedicineType = async () => {
    if (!typeForm.name.trim()) {
      toast.error("Medicine type name is required");
      return;
    }

    setLoading(true);
    try {
      const url = editingType
        ? `${API_BASE}/medicine-types/${editingType.id}`
        : `${API_BASE}/medicine-types`;
      
      const response = await fetch(url, {
        method: editingType ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(typeForm)
      });

      if (response.ok) {
        toast.success(editingType ? "Medicine type updated successfully" : "Medicine type created successfully");
        setTypeDialog(false);
        setEditingType(null);
        setTypeForm({ name: "", description: "", display_order: 0, is_active: true });
        loadMedicineTypes();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save medicine type");
      }
    } catch (error) {
      toast.error("Error saving medicine type");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMedicineType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine type?")) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/medicine-types/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      if (response.ok) {
        toast.success("Medicine type deleted successfully");
        loadMedicineTypes();
      } else {
        toast.error("Failed to delete medicine type");
      }
    } catch (error) {
      toast.error("Error deleting medicine type");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ===== MANUFACTURER FUNCTIONS =====
  const loadManufacturers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/manufacturers`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setManufacturers(data);
      } else {
        toast.error("Failed to load manufacturers");
      }
    } catch (error) {
      toast.error("Error loading manufacturers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveManufacturer = async () => {
    if (!manufacturerForm.name.trim()) {
      toast.error("Manufacturer name is required");
      return;
    }

    setLoading(true);
    try {
      const url = editingManufacturer
        ? `${API_BASE}/manufacturers/${editingManufacturer.id}`
        : `${API_BASE}/manufacturers`;
      
      const response = await fetch(url, {
        method: editingManufacturer ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(manufacturerForm)
      });

      if (response.ok) {
        toast.success(editingManufacturer ? "Manufacturer updated successfully" : "Manufacturer created successfully");
        setManufacturerDialog(false);
        setEditingManufacturer(null);
        setManufacturerForm({
          name: "", code: "", contact_person: "", phone: "", email: "", address: "",
          city: "", state: "", country: "", postal_code: "", tax_number: "",
          payment_terms: "", credit_limit: 0, website: "", notes: "", is_active: true
        });
        loadManufacturers();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save manufacturer");
      }
    } catch (error) {
      toast.error("Error saving manufacturer");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteManufacturer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this manufacturer?")) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/manufacturers/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      if (response.ok) {
        toast.success("Manufacturer deleted successfully");
        loadManufacturers();
      } else {
        toast.error("Failed to delete manufacturer");
      }
    } catch (error) {
      toast.error("Error deleting manufacturer");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ===== BATCH FUNCTIONS =====
  const loadBatches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/batches`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      } else {
        toast.error("Failed to load batches");
      }
    } catch (error) {
      toast.error("Error loading batches");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ===== EXPIRY ALERT FUNCTIONS =====
  const loadExpiryAlerts = async () => {
    setLoading(true);
    try {
      const url = expiryFilter === "all" 
        ? `${API_BASE}/expiry-alerts`
        : `${API_BASE}/expiry-alerts?days=${expiryFilter}`;
      
      const response = await fetch(url, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setExpiryAlerts(data);
      } else {
        toast.error("Failed to load expiry alerts");
      }
    } catch (error) {
      toast.error("Error loading expiry alerts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case "expired": return "destructive";
      case "critical": return "destructive";
      case "warning": return "default";
      case "info": return "secondary";
      default: return "default";
    }
  };

  const getAlertText = (level: string) => {
    switch (level) {
      case "expired": return "Expired";
      case "critical": return "Critical (<30 days)";
      case "warning": return "Warning (30-60 days)";
      case "info": return "Info (60-90 days)";
      default: return level;
    }
  };

  // Filter functions
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUnits = unitTypes.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTypes = medicineTypes.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredManufacturers = manufacturers.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBatches = batches.filter(b => 
    b.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAlerts = expiryAlerts.filter(a => 
    a.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Medicine Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage medicine categories, types, manufacturers, batches, and expiry tracking
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setSearchTerm(""); }} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="categories">
            <Package className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="units">
            <BarChart3 className="w-4 h-4 mr-2" />
            Units
          </TabsTrigger>
          <TabsTrigger value="types">
            <QrCode className="w-4 h-4 mr-2" />
            Types
          </TabsTrigger>
          <TabsTrigger value="manufacturers">
            <Package className="w-4 h-4 mr-2" />
            Manufacturers
          </TabsTrigger>
          <TabsTrigger value="batches">
            <Calendar className="w-4 h-4 mr-2" />
            Batches
          </TabsTrigger>
          <TabsTrigger value="expiry">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Expiry Alerts
            {expiryAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{expiryAlerts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <CardTitle>Medicine Categories</CardTitle>
                  <CardDescription>Dosage forms: Tablet, Syrup, Injection, Capsule, etc.</CardDescription>
                </div>
                <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button className="pharmacy-button" onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: "", description: "", display_order: 0, is_active: true });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? "Edit Category" : "Add Category"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingCategory ? "Update" : "Create a new"} medicine category
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          placeholder="e.g., Tablet, Syrup, Injection"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          placeholder="Optional description"
                          className="pharmacy-input"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Display Order</Label>
                        <Input
                          type="number"
                          value={categoryForm.display_order}
                          onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })}
                          className="pharmacy-input"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={categoryForm.is_active}
                          onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCategoryDialog(false)}>
                        Cancel
                      </Button>
                      <Button className="pharmacy-button" onClick={saveCategory} disabled={loading}>
                        {loading ? "Saving..." : (editingCategory ? "Update" : "Create")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pharmacy-input"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? "No categories found matching your search" : "No categories yet. Add your first category!"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Order</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-md">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell className="text-center">{category.display_order}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={category.is_active ? "default" : "secondary"} className="pharmacy-badge">
                              {category.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setCategoryForm({
                                    name: category.name,
                                    description: category.description,
                                    display_order: category.display_order,
                                    is_active: category.is_active
                                  });
                                  setCategoryDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteCategory(category.id)}
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

        {/* UNIT TYPES TAB */}
        <TabsContent value="units" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <CardTitle>Unit Types</CardTitle>
                  <CardDescription>Measurement units: mg, ml, pieces, strips, etc.</CardDescription>
                </div>
                <Dialog open={unitDialog} onOpenChange={setUnitDialog}>
                  <DialogTrigger asChild>
                    <Button className="pharmacy-button" onClick={() => {
                      setEditingUnit(null);
                      setUnitForm({ name: "", abbreviation: "", category: "", display_order: 0, is_active: true });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Unit Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong">
                    <DialogHeader>
                      <DialogTitle>
                        {editingUnit ? "Edit Unit Type" : "Add Unit Type"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingUnit ? "Update" : "Create a new"} measurement unit
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={unitForm.name}
                          onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                          placeholder="e.g., Milligram, Milliliter, Piece"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Abbreviation *</Label>
                        <Input
                          value={unitForm.abbreviation}
                          onChange={(e) => setUnitForm({ ...unitForm, abbreviation: e.target.value })}
                          placeholder="e.g., mg, ml, pc"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={unitForm.category}
                          onValueChange={(value) => setUnitForm({ ...unitForm, category: value })}
                        >
                          <SelectTrigger className="pharmacy-input">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weight">Weight</SelectItem>
                            <SelectItem value="volume">Volume</SelectItem>
                            <SelectItem value="quantity">Quantity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Display Order</Label>
                        <Input
                          type="number"
                          value={unitForm.display_order}
                          onChange={(e) => setUnitForm({ ...unitForm, display_order: parseInt(e.target.value) || 0 })}
                          className="pharmacy-input"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={unitForm.is_active}
                          onCheckedChange={(checked) => setUnitForm({ ...unitForm, is_active: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUnitDialog(false)}>
                        Cancel
                      </Button>
                      <Button className="pharmacy-button" onClick={saveUnitType} disabled={loading}>
                        {loading ? "Saving..." : (editingUnit ? "Update" : "Create")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search unit types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pharmacy-input"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : filteredUnits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? "No unit types found matching your search" : "No unit types yet. Add your first unit type!"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Abbreviation</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Order</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUnits.map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell>
                            <Badge className="pharmacy-badge">{unit.abbreviation}</Badge>
                          </TableCell>
                          <TableCell className="capitalize">{unit.category || "-"}</TableCell>
                          <TableCell className="text-center">{unit.display_order}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={unit.is_active ? "default" : "secondary"} className="pharmacy-badge">
                              {unit.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingUnit(unit);
                                  setUnitForm({
                                    name: unit.name,
                                    abbreviation: unit.abbreviation,
                                    category: unit.category,
                                    display_order: unit.display_order,
                                    is_active: unit.is_active
                                  });
                                  setUnitDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUnitType(unit.id)}
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

        {/* MEDICINE TYPES TAB - Continuing with this for the complete implementation */}
        <TabsContent value="types" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <CardTitle>Medicine Types</CardTitle>
                  <CardDescription>Therapeutic categories: Painkiller, Antibiotic, Antipyretic, etc.</CardDescription>
                </div>
                <Dialog open={typeDialog} onOpenChange={setTypeDialog}>
                  <DialogTrigger asChild>
                    <Button className="pharmacy-button" onClick={() => {
                      setEditingType(null);
                      setTypeForm({ name: "", description: "", display_order: 0, is_active: true });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Medicine Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong">
                    <DialogHeader>
                      <DialogTitle>
                        {editingType ? "Edit Medicine Type" : "Add Medicine Type"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingType ? "Update" : "Create a new"} therapeutic category
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={typeForm.name}
                          onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                          placeholder="e.g., Painkiller, Antibiotic, Antipyretic"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={typeForm.description}
                          onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                          placeholder="Optional description"
                          className="pharmacy-input"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Display Order</Label>
                        <Input
                          type="number"
                          value={typeForm.display_order}
                          onChange={(e) => setTypeForm({ ...typeForm, display_order: parseInt(e.target.value) || 0 })}
                          className="pharmacy-input"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={typeForm.is_active}
                          onCheckedChange={(checked) => setTypeForm({ ...typeForm, is_active: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTypeDialog(false)}>
                        Cancel
                      </Button>
                      <Button className="pharmacy-button" onClick={saveMedicineType} disabled={loading}>
                        {loading ? "Saving..." : (editingType ? "Update" : "Create")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search medicine types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pharmacy-input"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : filteredTypes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? "No medicine types found matching your search" : "No medicine types yet. Add your first type!"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Order</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-md">
                            {type.description || "-"}
                          </TableCell>
                          <TableCell className="text-center">{type.display_order}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={type.is_active ? "default" : "secondary"} className="pharmacy-badge">
                              {type.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingType(type);
                                  setTypeForm({
                                    name: type.name,
                                    description: type.description,
                                    display_order: type.display_order,
                                    is_active: type.is_active
                                  });
                                  setTypeDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteMedicineType(type.id)}
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

        {/* MANUFACTURERS TAB */}
        <TabsContent value="manufacturers" className="space-y-4">
          <ManufacturerTab
            manufacturers={manufacturers}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onRefresh={loadManufacturers}
          />
        </TabsContent>

        {/* BATCHES TAB */}
        <TabsContent value="batches" className="space-y-4">
          <BatchTab
            batches={batches}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </TabsContent>

        {/* EXPIRY ALERTS TAB */}
        <TabsContent value="expiry" className="space-y-4">
          <ExpiryAlertTab
            alerts={expiryAlerts}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            expiryFilter={expiryFilter}
            setExpiryFilter={setExpiryFilter}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
