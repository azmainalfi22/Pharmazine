import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Pill, 
  Plus, 
  Search, 
  AlertTriangle, 
  Package, 
  TrendingDown,
  Barcode,
  Factory,
  ClipboardList,
  Settings,
  FileWarning
} from "lucide-react";
import { toast } from "sonner";

interface MedicineCategory {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

interface UnitType {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
  is_active: boolean;
}

interface MedicineType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface Manufacturer {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  city: string;
  is_active: boolean;
}

interface ExpiryAlert {
  batch_id: string;
  batch_number: string;
  product_name: string;
  expiry_date: string;
  quantity_remaining: number;
  value_at_risk: number;
  days_to_expiry: number;
  alert_level: string;
}

export default function MedicineManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [medicineTypes, setMedicineTypes] = useState<MedicineType[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  const API_BASE = "http://localhost:9000/api/pharmacy";

  useEffect(() => {
    loadStatistics();
    loadExpiryAlerts();
    loadLowStockAlerts();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/statistics/medicines`);
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const loadExpiryAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/expiry-alerts?days=90`);
      const data = await response.json();
      setExpiryAlerts(data);
    } catch (error) {
      console.error("Error loading expiry alerts:", error);
    }
  };

  const loadLowStockAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/low-stock-alerts`);
      const data = await response.json();
      setLowStockAlerts(data);
    } catch (error) {
      console.error("Error loading low stock alerts:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/medicine-categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load medicine categories");
    }
  };

  const loadUnitTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/unit-types`);
      const data = await response.json();
      setUnitTypes(data);
    } catch (error) {
      toast.error("Failed to load unit types");
    }
  };

  const loadMedicineTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/medicine-types`);
      const data = await response.json();
      setMedicineTypes(data);
    } catch (error) {
      toast.error("Failed to load medicine types");
    }
  };

  const loadManufacturers = async () => {
    try {
      const response = await fetch(`${API_BASE}/manufacturers`);
      const data = await response.json();
      setManufacturers(data);
    } catch (error) {
      toast.error("Failed to load manufacturers");
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case "expired": return "destructive";
      case "critical": return "destructive";
      case "warning": return "warning";
      case "info": return "secondary";
      default: return "default";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Professional Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-50/50 to-primary/5 dark:from-primary/20 dark:via-emerald-950/30 dark:to-primary/10 p-8 border-2 border-primary/20 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg">
                <Pill className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">Medicine Management</h1>
                <p className="text-sm text-primary font-semibold">Sharkar Pharmacy System</p>
              </div>
            </div>
            <p className="text-muted-foreground ml-15">
              Comprehensive pharmacy inventory and batch tracking system
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
                <DialogDescription>
                  Enter medicine details including batch information
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Form coming soon...</p>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Professional Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-primary">Total Medicines</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pill className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{statistics.total_medicines}</div>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {statistics.total_batches} active batches
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-card to-orange-50/50 dark:to-orange-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-400">Expiring Soon</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {statistics.expiring_soon_count}
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Within 90 days
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-card to-red-50/50 dark:to-red-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400">Low Stock</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {statistics.low_stock_count}
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Below reorder level
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-card to-emerald-50/50 dark:to-emerald-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Inventory Value</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                ₹{(statistics.total_inventory_value || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Total stock value
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Professional Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 p-1 bg-muted/50 border-2 border-primary/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">Overview</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">Categories</TabsTrigger>
          <TabsTrigger value="units" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">Units</TabsTrigger>
          <TabsTrigger value="types" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">Types</TabsTrigger>
          <TabsTrigger value="manufacturers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">Manufacturers</TabsTrigger>
          <TabsTrigger value="batches" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">Batches</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Expiry Alerts */}
            <Card className="pharmacy-card">
              <CardHeader className="pharmacy-header">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <AlertTriangle className="h-5 w-5" />
                  Expiry Alerts
                </CardTitle>
                <CardDescription>
                  Medicines expiring soon or already expired
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {expiryAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.batch_id} className="flex items-center justify-between p-3 border-2 border-primary/10 rounded-lg hover:border-primary/30 transition-all">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{alert.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Batch: {alert.batch_number} | Qty: {alert.quantity_remaining}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={getAlertColor(alert.alert_level) as any}>
                          {alert.days_to_expiry > 0 
                            ? `${alert.days_to_expiry} days`
                            : "Expired"
                          }
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {expiryAlerts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No expiring medicines
                    </p>
                  )}
                </div>
                {expiryAlerts.length > 5 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 pharmacy-button-outline"
                    onClick={() => setActiveTab("alerts")}
                  >
                    View All ({expiryAlerts.length})
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card className="pharmacy-card">
              <CardHeader className="pharmacy-header">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingDown className="h-5 w-5" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>
                  Products below reorder level
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {lowStockAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.product_id} className="flex items-center justify-between p-3 border-2 border-primary/10 rounded-lg hover:border-primary/30 transition-all">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{alert.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.brand_name || alert.generic_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          -{alert.shortage}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Stock: {alert.current_stock}/{alert.reorder_level}
                        </p>
                      </div>
                    </div>
                  ))}
                  {lowStockAlerts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No low stock items
                    </p>
                  )}
                </div>
                {lowStockAlerts.length > 5 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 pharmacy-button-outline"
                    onClick={() => setActiveTab("alerts")}
                  >
                    View All ({lowStockAlerts.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Professional Quick Actions */}
          <Card className="pharmacy-card">
            <CardHeader className="pharmacy-header">
              <CardTitle className="text-primary">Quick Actions</CardTitle>
              <CardDescription>Common medicine management tasks</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-28 flex-col gap-3 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all shadow-md hover:shadow-lg group" 
                  onClick={loadCategories}
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-all">
                    <ClipboardList className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-semibold">Manage Categories</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-28 flex-col gap-3 border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all shadow-md hover:shadow-lg group" 
                  onClick={loadManufacturers}
                >
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 group-hover:bg-emerald-200 flex items-center justify-center transition-all">
                    <Factory className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-semibold">Manufacturers</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-28 flex-col gap-3 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all shadow-md hover:shadow-lg group"
                >
                  <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-950/50 group-hover:bg-purple-200 flex items-center justify-center transition-all">
                    <Barcode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-semibold">Print Barcodes</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-28 flex-col gap-3 border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all shadow-md hover:shadow-lg group"
                >
                  <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-950/50 group-hover:bg-orange-200 flex items-center justify-center transition-all">
                    <FileWarning className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-semibold">Waste Log</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card className="pharmacy-card">
            <CardHeader className="pharmacy-header">
              <CardTitle className="text-primary flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Medicine Categories
              </CardTitle>
              <CardDescription>
                Dosage forms like tablet, syrup, injection, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <Button onClick={loadCategories} className="pharmacy-button">
                  <Search className="mr-2 h-4 w-4" />
                  Load Categories
                </Button>
                <Button variant="outline" className="pharmacy-button-outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
              
              {categories.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description}</TableCell>
                        <TableCell>{category.display_order}</TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? "default" : "secondary"} className={category.is_active ? "pharmacy-badge" : ""}>
                            {category.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Click "Load Categories" to view medicine categories
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unit Types Tab */}
        <TabsContent value="units">
          <Card className="pharmacy-card">
            <CardHeader className="pharmacy-header">
              <CardTitle className="text-primary flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Unit Types
              </CardTitle>
              <CardDescription>
                Measurement units like mg, ml, piece, strip, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <Button onClick={loadUnitTypes} className="pharmacy-button">
                  <Search className="mr-2 h-4 w-4" />
                  Load Unit Types
                </Button>
                <Button variant="outline" className="pharmacy-button-outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Unit Type
                </Button>
              </div>

              {unitTypes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Abbreviation</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unitTypes.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{unit.abbreviation}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{unit.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={unit.is_active ? "default" : "secondary"} className={unit.is_active ? "pharmacy-badge" : ""}>
                            {unit.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Click "Load Unit Types" to view measurement units
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medicine Types Tab */}
        <TabsContent value="types">
          <Card className="pharmacy-card">
            <CardHeader className="pharmacy-header">
              <CardTitle className="text-primary flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medicine Types
              </CardTitle>
              <CardDescription>
                Therapeutic categories like painkiller, antibiotic, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <Button onClick={loadMedicineTypes} className="pharmacy-button">
                  <Search className="mr-2 h-4 w-4" />
                  Load Medicine Types
                </Button>
                <Button variant="outline" className="pharmacy-button-outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medicine Type
                </Button>
              </div>

              {medicineTypes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {medicineTypes.map((type) => (
                    <Card key={type.id} className="pharmacy-card">
                      <CardHeader>
                        <CardTitle className="text-base text-primary">{type.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {type.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Badge variant={type.is_active ? "default" : "secondary"} className={type.is_active ? "pharmacy-badge" : ""}>
                          {type.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Click "Load Medicine Types" to view therapeutic categories
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manufacturers Tab */}
        <TabsContent value="manufacturers">
          <Card className="pharmacy-card">
            <CardHeader className="pharmacy-header">
              <CardTitle className="text-primary flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Manufacturers
              </CardTitle>
              <CardDescription>
                Medicine manufacturers and suppliers
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <Input placeholder="Search manufacturers..." className="pharmacy-input" />
                </div>
                <Button onClick={loadManufacturers} className="pharmacy-button">
                  <Search className="mr-2 h-4 w-4" />
                  Load
                </Button>
                <Button variant="outline" className="pharmacy-button-outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manufacturer
                </Button>
              </div>

              {manufacturers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manufacturers.map((manufacturer) => (
                      <TableRow key={manufacturer.id}>
                        <TableCell>
                          <Badge variant="outline">{manufacturer.code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{manufacturer.name}</TableCell>
                        <TableCell>{manufacturer.city}</TableCell>
                        <TableCell>{manufacturer.phone}</TableCell>
                        <TableCell>{manufacturer.email}</TableCell>
                        <TableCell>
                          <Badge variant={manufacturer.is_active ? "default" : "secondary"} className={manufacturer.is_active ? "pharmacy-badge" : ""}>
                            {manufacturer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Click "Load" to view manufacturers
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batches Tab */}
        <TabsContent value="batches">
          <Card className="pharmacy-card">
            <CardHeader className="pharmacy-header">
              <CardTitle className="text-primary">Medicine Batches</CardTitle>
              <CardDescription>
                Track individual batches with expiry dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Batch management interface coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Expiry Alerts */}
          <Card className="pharmacy-card">
            <CardHeader className="pharmacy-header">
              <CardTitle className="text-primary">Expiry Alerts</CardTitle>
              <CardDescription>
                All medicines expiring within 90 days
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {expiryAlerts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Value at Risk</TableHead>
                      <TableHead>Alert</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiryAlerts.map((alert) => (
                      <TableRow key={alert.batch_id}>
                        <TableCell className="font-medium">{alert.product_name}</TableCell>
                        <TableCell>{alert.batch_number}</TableCell>
                        <TableCell>
                          {new Date(alert.expiry_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {alert.days_to_expiry > 0 ? alert.days_to_expiry : "Expired"}
                        </TableCell>
                        <TableCell>{alert.quantity_remaining}</TableCell>
                        <TableCell>₹{alert.value_at_risk.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getAlertColor(alert.alert_level) as any}>
                            {alert.alert_level}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No expiry alerts
                </p>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="pharmacy-card">
            <CardHeader className="pharmacy-header">
              <CardTitle className="text-primary">Low Stock Alerts</CardTitle>
              <CardDescription>
                Products below reorder level
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {lowStockAlerts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Shortage</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockAlerts.map((alert) => (
                      <TableRow key={alert.product_id}>
                        <TableCell>
                          <Badge variant="outline">{alert.sku}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{alert.name}</TableCell>
                        <TableCell className="text-red-500">{alert.current_stock}</TableCell>
                        <TableCell>{alert.reorder_level}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">-{alert.shortage}</Badge>
                        </TableCell>
                        <TableCell>{alert.manufacturer}</TableCell>
                        <TableCell>{alert.manufacturer_phone}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No low stock items
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
