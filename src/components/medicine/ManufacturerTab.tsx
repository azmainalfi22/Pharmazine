import { useState } from "react";
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_BASE = "http://localhost:8000/api/pharmacy";

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

interface ManufacturerTabProps {
  manufacturers: Manufacturer[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onRefresh: () => void;
}

export default function ManufacturerTab({
  manufacturers,
  loading,
  searchTerm,
  setSearchTerm,
  onRefresh
}: ManufacturerTabProps) {
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Manufacturer | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    tax_number: "",
    payment_terms: "",
    credit_limit: 0,
    website: "",
    notes: "",
    is_active: true
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Manufacturer name is required");
      return;
    }

    try {
      const url = editing
        ? `${API_BASE}/manufacturers/${editing.id}`
        : `${API_BASE}/manufacturers`;
      
      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        toast.success(editing ? "Manufacturer updated successfully" : "Manufacturer created successfully");
        setDialog(false);
        setEditing(null);
        setForm({
          name: "", code: "", contact_person: "", phone: "", email: "", address: "",
          city: "", state: "", country: "", postal_code: "", tax_number: "",
          payment_terms: "", credit_limit: 0, website: "", notes: "", is_active: true
        });
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save manufacturer");
      }
    } catch (error) {
      toast.error("Error saving manufacturer");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this manufacturer?")) return;
    
    try {
      const response = await fetch(`${API_BASE}/manufacturers/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      if (response.ok) {
        toast.success("Manufacturer deleted successfully");
        onRefresh();
      } else {
        toast.error("Failed to delete manufacturer");
      }
    } catch (error) {
      toast.error("Error deleting manufacturer");
      console.error(error);
    }
  };

  const handleEdit = (manufacturer: Manufacturer) => {
    setEditing(manufacturer);
    setForm({
      name: manufacturer.name,
      code: manufacturer.code,
      contact_person: manufacturer.contact_person,
      phone: manufacturer.phone,
      email: manufacturer.email,
      address: manufacturer.address,
      city: manufacturer.city,
      state: manufacturer.state,
      country: manufacturer.country,
      postal_code: manufacturer.postal_code,
      tax_number: manufacturer.tax_number,
      payment_terms: manufacturer.payment_terms,
      credit_limit: manufacturer.credit_limit || 0,
      website: manufacturer.website,
      notes: manufacturer.notes,
      is_active: manufacturer.is_active
    });
    setDialog(true);
  };

  const handleNew = () => {
    setEditing(null);
    setForm({
      name: "", code: "", contact_person: "", phone: "", email: "", address: "",
      city: "", state: "", country: "", postal_code: "", tax_number: "",
      payment_terms: "", credit_limit: 0, website: "", notes: "", is_active: true
    });
    setDialog(true);
  };

  const filteredManufacturers = manufacturers.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.phone && m.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card className="pharmacy-card">
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Manufacturers
            </CardTitle>
            <CardDescription>Manage medicine manufacturers and suppliers</CardDescription>
          </div>
          <Dialog open={dialog} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button className="pharmacy-button" onClick={handleNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Manufacturer
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Manufacturer" : "Add Manufacturer"}
                </DialogTitle>
                <DialogDescription>
                  {editing ? "Update manufacturer details" : "Create a new manufacturer"}
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="max-h-[500px] pr-4">
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="font-medium text-sm">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g., Pfizer, GSK, Novartis"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Code</Label>
                        <Input
                          value={form.code}
                          onChange={(e) => setForm({ ...form, code: e.target.value })}
                          placeholder="e.g., MFR001"
                          className="pharmacy-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="font-medium text-sm">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Contact Person</Label>
                        <Input
                          value={form.contact_person}
                          onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                          placeholder="Contact person name"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+1 234 567 8900"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="contact@manufacturer.com"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Website</Label>
                        <Input
                          value={form.website}
                          onChange={(e) => setForm({ ...form, website: e.target.value })}
                          placeholder="https://www.manufacturer.com"
                          className="pharmacy-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="font-medium text-sm">Address</h3>
                    <div>
                      <Label>Street Address</Label>
                      <Input
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Street address"
                        className="pharmacy-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>City</Label>
                        <Input
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder="City"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>State/Province</Label>
                        <Input
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          placeholder="State"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Country</Label>
                        <Input
                          value={form.country}
                          onChange={(e) => setForm({ ...form, country: e.target.value })}
                          placeholder="Country"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Postal Code</Label>
                        <Input
                          value={form.postal_code}
                          onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                          placeholder="Postal code"
                          className="pharmacy-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="font-medium text-sm">Financial Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tax Number</Label>
                        <Input
                          value={form.tax_number}
                          onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
                          placeholder="Tax ID / GST Number"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Credit Limit</Label>
                        <Input
                          type="number"
                          value={form.credit_limit}
                          onChange={(e) => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="pharmacy-input"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Payment Terms</Label>
                        <Input
                          value={form.payment_terms}
                          onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                          placeholder="e.g., Net 30, Net 60, Cash on Delivery"
                          className="pharmacy-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Additional Information</h3>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Additional notes..."
                        className="pharmacy-input"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={form.is_active}
                        onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(false)}>
                  Cancel
                </Button>
                <Button className="pharmacy-button" onClick={handleSave}>
                  {editing ? "Update" : "Create"}
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
              placeholder="Search manufacturers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pharmacy-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredManufacturers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? "No manufacturers found matching your search" : "No manufacturers yet. Add your first manufacturer!"}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Credit Limit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManufacturers.map((manufacturer) => (
                  <TableRow key={manufacturer.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{manufacturer.name}</div>
                        {manufacturer.website && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {manufacturer.website}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="pharmacy-badge">
                        {manufacturer.code || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {manufacturer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {manufacturer.phone}
                          </div>
                        )}
                        {manufacturer.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{manufacturer.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[manufacturer.city, manufacturer.state, manufacturer.country]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CreditCard className="w-3 h-3" />
                        ${(manufacturer.credit_limit || 0).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={(manufacturer.current_balance || 0) > 0 ? "text-red-600" : "text-green-600"}>
                        ${(manufacturer.current_balance || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={manufacturer.is_active ? "default" : "secondary"} className="pharmacy-badge">
                        {manufacturer.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(manufacturer)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(manufacturer.id)}
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
  );
}

