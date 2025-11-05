import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Percent, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface DiscountConfig {
  id: string;
  name: string;
  discount_type: string;
  discount_percentage: number;
  discount_amount: number;
  applicable_to?: string;
  product_id?: string;
  medicine_category_id?: string;
  min_quantity?: number;
  max_quantity?: number;
  valid_from?: string;
  valid_to?: string;
  is_active: boolean;
  created_at: string;
}

interface DiscountTabProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function DiscountTab({ searchTerm, setSearchTerm }: DiscountTabProps) {
  const [loading, setLoading] = useState(false);
  const [discounts, setDiscounts] = useState<DiscountConfig[]>([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<DiscountConfig | null>(null);
  const [form, setForm] = useState({
    name: "",
    discount_type: "percentage",
    discount_value: 0,
    applicable_to: "all",
    product_id: "",
    category_id: "",
    min_quantity: 0,
    max_quantity: 0,
    start_date: "",
    end_date: "",
    is_active: true
  });

  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.PHARMACY_BASE}/discount-configs`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data);
      } else {
        toast.error("Failed to load discounts");
      }
    } catch (error) {
      toast.error("Error loading discounts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || form.discount_value <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const url = editing
        ? `${API_CONFIG.PHARMACY_BASE}/discount-configs/${editing.id}`
        : `${API_CONFIG.PHARMACY_BASE}/discount-configs`;
      
      // Prepare payload based on discount type
      const payload = {
        name: form.name,
        discount_type: form.discount_type,
        applicable_to: form.applicable_to,
        is_active: form.is_active,
        ...(form.discount_type === 'percentage' ? { discount_percentage: form.discount_value } : { discount_amount: form.discount_value }),
        ...(form.product_id && { product_id: form.product_id }),
        ...(form.category_id && { medicine_category_id: form.category_id }),
        ...(form.min_quantity > 0 && { min_quantity: form.min_quantity }),
        ...(form.max_quantity > 0 && { max_quantity: form.max_quantity }),
        ...(form.start_date && { valid_from: form.start_date }),
        ...(form.end_date && { valid_to: form.end_date })
      };
      
      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editing ? "Discount updated successfully" : "Discount created successfully");
        setDialog(false);
        setEditing(null);
        resetForm();
        loadDiscounts();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save discount");
      }
    } catch (error) {
      toast.error("Error saving discount");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.PHARMACY_BASE}/discount-configs/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        toast.success("Discount deleted successfully");
        loadDiscounts();
      } else {
        toast.error("Failed to delete discount");
      }
    } catch (error) {
      toast.error("Error deleting discount");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (discount: DiscountConfig) => {
    setEditing(discount);
    setForm({
      name: discount.name,
      discount_type: discount.discount_type,
      discount_value: discount.discount_type === 'percentage' ? discount.discount_percentage : discount.discount_amount,
      applicable_to: discount.applicable_to || "all",
      product_id: discount.product_id || "",
      category_id: discount.medicine_category_id || "",
      min_quantity: discount.min_quantity || 0,
      max_quantity: discount.max_quantity || 0,
      start_date: discount.valid_from || "",
      end_date: discount.valid_to || "",
      is_active: discount.is_active
    });
    setDialog(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      discount_type: "percentage",
      discount_value: 0,
      applicable_to: "all",
      product_id: "",
      category_id: "",
      min_quantity: 0,
      max_quantity: 0,
      start_date: "",
      end_date: "",
      is_active: true
    });
  };

  const filteredDiscounts = discounts.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: discounts.length,
    active: discounts.filter(d => d.is_active).length,
    percentage: discounts.filter(d => d.discount_type === "percentage").length,
    fixed: discounts.filter(d => d.discount_type === "fixed").length
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="pharmacy-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Discounts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Percent className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="text-2xl font-bold text-blue-600">{stats.percentage}</p>
              </div>
              <Percent className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fixed Amount</p>
                <p className="text-2xl font-bold text-purple-600">{stats.fixed}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discounts List */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                Discount Configurations
              </CardTitle>
              <CardDescription>Manage pricing discounts and promotional offers</CardDescription>
            </div>
            <Dialog open={dialog} onOpenChange={setDialog}>
              <DialogTrigger asChild>
                <Button className="pharmacy-button" onClick={() => { setEditing(null); resetForm(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Discount
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editing ? "Edit Discount" : "Add Discount"}
                  </DialogTitle>
                  <DialogDescription>
                    {editing ? "Update discount configuration" : "Create a new discount rule"}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  <div>
                    <Label>Discount Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Summer Sale, Bulk Purchase Discount"
                      className="pharmacy-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Discount Type *</Label>
                      <Select
                        value={form.discount_type}
                        onValueChange={(value) => setForm({ ...form, discount_type: value })}
                      >
                        <SelectTrigger className="pharmacy-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Discount Value *</Label>
                      <Input
                        type="number"
                        value={form.discount_value}
                        onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="pharmacy-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Applicable To</Label>
                    <Select
                      value={form.applicable_to}
                      onValueChange={(value) => setForm({ ...form, applicable_to: value })}
                    >
                      <SelectTrigger className="pharmacy-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="product">Specific Product</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.applicable_to === "product" && (
                    <div>
                      <Label>Product ID</Label>
                      <Input
                        value={form.product_id}
                        onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                        placeholder="Enter product ID"
                        className="pharmacy-input"
                      />
                    </div>
                  )}

                  {form.applicable_to === "category" && (
                    <div>
                      <Label>Category ID</Label>
                      <Input
                        value={form.category_id}
                        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                        placeholder="Enter category ID"
                        className="pharmacy-input"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Quantity</Label>
                      <Input
                        type="number"
                        value={form.min_quantity}
                        onChange={(e) => setForm({ ...form, min_quantity: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className="pharmacy-input"
                      />
                    </div>

                    <div>
                      <Label>Max Quantity</Label>
                      <Input
                        type="number"
                        value={form.max_quantity}
                        onChange={(e) => setForm({ ...form, max_quantity: parseInt(e.target.value) || 0 })}
                        placeholder="0 (unlimited)"
                        className="pharmacy-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        className="pharmacy-input"
                      />
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        className="pharmacy-input"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="pharmacy-button" onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : (editing ? "Update" : "Create")}
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
                placeholder="Search discounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pharmacy-input"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No discounts found matching your search" : "No discounts configured yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Applicable To</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell className="font-medium">{discount.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="pharmacy-badge capitalize">
                          {discount.discount_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {discount.discount_type === 'percentage' 
                          ? `${discount.discount_percentage}%`
                          : `$${discount.discount_amount.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="capitalize">{discount.applicable_to || 'all'}</TableCell>
                      <TableCell className="text-sm">
                        {discount.valid_from && discount.valid_to ? (
                          <>
                            {format(new Date(discount.valid_from), "dd MMM yyyy")} - 
                            {format(new Date(discount.valid_to), "dd MMM yyyy")}
                          </>
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={discount.is_active ? "default" : "secondary"} className="pharmacy-badge">
                          {discount.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(discount)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(discount.id)}
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
  );
}

