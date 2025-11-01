import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, User, Phone, Mail, MapPin, CreditCard, Calendar, TrendingUp, Receipt, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "date-fns";

const API_BASE = "http://localhost:8000/api";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  customer_group?: string;
  credit_limit?: number;
  opening_balance?: number;
  current_balance?: number;
  birthday?: string;
  anniversary?: string;
  tax_number?: string;
  discount_percentage?: number;
  payment_terms?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EnhancedCustomers() {
  const [activeTab, setActiveTab] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    customer_group: "",
    credit_limit: 0,
    opening_balance: 0,
    birthday: "",
    anniversary: "",
    tax_number: "",
    discount_percentage: 0,
    payment_terms: "",
    notes: "",
    is_active: true
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/customers`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      toast.error("Error loading customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setLoading(true);
    try {
      const url = editing
        ? `${API_BASE}/customers/${editing.id}`
        : `${API_BASE}/customers`;
      
      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        toast.success(editing ? "Customer updated successfully" : "Customer created successfully");
        setDialog(false);
        setEditing(null);
        resetForm();
        loadCustomers();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save customer");
      }
    } catch (error) {
      toast.error("Error saving customer");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/customers/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });
      if (response.ok) {
        toast.success("Customer deleted successfully");
        loadCustomers();
      }
    } catch (error) {
      toast.error("Error deleting customer");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      company: customer.company,
      customer_group: customer.customer_group || "",
      credit_limit: customer.credit_limit || 0,
      opening_balance: customer.opening_balance || 0,
      birthday: customer.birthday || "",
      anniversary: customer.anniversary || "",
      tax_number: customer.tax_number || "",
      discount_percentage: customer.discount_percentage || 0,
      payment_terms: customer.payment_terms || "",
      notes: customer.notes || "",
      is_active: customer.is_active
    });
    setDialog(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      company: "",
      customer_group: "",
      credit_limit: 0,
      opening_balance: 0,
      birthday: "",
      anniversary: "",
      tax_number: "",
      discount_percentage: 0,
      payment_terms: "",
      notes: "",
      is_active: true
    });
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.is_active).length,
    totalCredit: customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0),
    totalOutstanding: customers.reduce((sum, c) => sum + (c.current_balance || 0), 0)
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Customer Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage customer profiles, credit limits, and outstanding balances
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="pharmacy-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <User className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credit</p>
                <p className="text-2xl font-bold">${stats.totalCredit.toFixed(2)}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">${stats.totalOutstanding.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>Manage all your customers and their account details</CardDescription>
            </div>
            <Dialog open={dialog} onOpenChange={setDialog}>
              <DialogTrigger asChild>
                <Button className="pharmacy-button" onClick={() => {
                  setEditing(null);
                  resetForm();
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
                  <DialogDescription>
                    {editing ? "Update customer details" : "Create a new customer"}
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[500px] pr-4">
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-4 border-b pb-4">
                      <h3 className="font-medium text-sm">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Name *</Label>
                          <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Customer name"
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
                            placeholder="email@example.com"
                            className="pharmacy-input"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Address</Label>
                          <Textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            placeholder="Street address"
                            className="pharmacy-input"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={form.company}
                            onChange={(e) => setForm({ ...form, company: e.target.value })}
                            placeholder="Company name"
                            className="pharmacy-input"
                          />
                        </div>
                        <div>
                          <Label>Customer Group</Label>
                          <Input
                            value={form.customer_group}
                            onChange={(e) => setForm({ ...form, customer_group: e.target.value })}
                            placeholder="e.g., Retail, Wholesale"
                            className="pharmacy-input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="space-y-4 border-b pb-4">
                      <h3 className="font-medium text-sm">Financial Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Credit Limit</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.credit_limit}
                            onChange={(e) => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })}
                            className="pharmacy-input"
                          />
                        </div>
                        <div>
                          <Label>Opening Balance</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.opening_balance}
                            onChange={(e) => setForm({ ...form, opening_balance: parseFloat(e.target.value) || 0 })}
                            className="pharmacy-input"
                          />
                        </div>
                        <div>
                          <Label>Tax Number</Label>
                          <Input
                            value={form.tax_number}
                            onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
                            placeholder="Tax ID / GST"
                            className="pharmacy-input"
                          />
                        </div>
                        <div>
                          <Label>Payment Terms</Label>
                          <Input
                            value={form.payment_terms}
                            onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                            placeholder="e.g., Net 30"
                            className="pharmacy-input"
                          />
                        </div>
                        <div>
                          <Label>Discount %</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={form.discount_percentage}
                            onChange={(e) => setForm({ ...form, discount_percentage: parseFloat(e.target.value) || 0 })}
                            className="pharmacy-input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Special Dates */}
                    <div className="space-y-4 border-b pb-4">
                      <h3 className="font-medium text-sm">Important Dates</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Birthday</Label>
                          <Input
                            type="date"
                            value={form.birthday}
                            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                            className="pharmacy-input"
                          />
                        </div>
                        <div>
                          <Label>Anniversary</Label>
                          <Input
                            type="date"
                            value={form.anniversary}
                            onChange={(e) => setForm({ ...form, anniversary: e.target.value })}
                            className="pharmacy-input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
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
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="pharmacy-button" onClick={handleSave} disabled={loading}>
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
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pharmacy-input"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No customers found" : "No customers yet. Add your first customer!"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Credit Limit</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{customer.name}</div>
                          {customer.customer_group && (
                            <Badge variant="outline" className="pharmacy-badge text-xs mt-1">
                              {customer.customer_group}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{customer.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{customer.company || "-"}</TableCell>
                      <TableCell className="text-right">
                        ${(customer.credit_limit || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={(customer.current_balance || 0) > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                          ${(customer.current_balance || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={customer.is_active ? "default" : "secondary"} className="pharmacy-badge">
                          {customer.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(customer.id)}
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

