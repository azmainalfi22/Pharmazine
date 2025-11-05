import { useState, useEffect } from "react";
import { Plus, Search, Trash, AlertTriangle, Calendar, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface WasteProduct {
  id: string;
  product_id: string;
  product_name?: string;
  batch_id: string;
  batch_number?: string;
  quantity: number;
  reason: string;
  value_loss: number;
  reported_by?: string;
  disposal_method?: string;
  notes?: string;
  created_at: string;
}

interface WasteProductTabProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function WasteProductTab({ searchTerm, setSearchTerm }: WasteProductTabProps) {
  const [loading, setLoading] = useState(false);
  const [wasteProducts, setWasteProducts] = useState<WasteProduct[]>([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    batch_id: "",
    quantity: 0,
    reason: "damaged",
    disposal_method: "",
    notes: ""
  });

  useEffect(() => {
    loadWasteProducts();
  }, []);

  const loadWasteProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.PHARMACY_BASE}/waste-products`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setWasteProducts(data);
      } else {
        toast.error("Failed to load waste products");
      }
    } catch (error) {
      toast.error("Error loading waste products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.product_id || !form.batch_id || form.quantity <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.PHARMACY_BASE}/waste-products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(form)
      });

      if (response.ok) {
        toast.success("Waste product recorded successfully");
        setDialog(false);
        setForm({
          product_id: "",
          batch_id: "",
          quantity: 0,
          reason: "damaged",
          disposal_method: "",
          notes: ""
        });
        loadWasteProducts();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to record waste product");
      }
    } catch (error) {
      toast.error("Error recording waste product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getReasonColor = (reason: string) => {
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes("expired")) return "destructive";
    if (lowerReason.includes("damaged")) return "default";
    if (lowerReason.includes("recalled")) return "secondary";
    return "outline";
  };

  const filteredWaste = wasteProducts.filter(w => 
    w.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: wasteProducts.length,
    expired: wasteProducts.filter(w => w.reason.toLowerCase().includes("expired")).length,
    damaged: wasteProducts.filter(w => w.reason.toLowerCase().includes("damaged")).length,
    totalLoss: wasteProducts.reduce((sum, w) => sum + (w.value_loss || 0), 0)
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="pharmacy-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Waste Items</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Trash className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Damaged</p>
                <p className="text-2xl font-bold text-orange-600">{stats.damaged}</p>
              </div>
              <Package className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Loss</p>
                <p className="text-2xl font-bold text-red-600">${stats.totalLoss.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waste Products List */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trash className="w-5 h-5 text-primary" />
                Waste & Damaged Products
              </CardTitle>
              <CardDescription>Track expired, damaged, and recalled medicines</CardDescription>
            </div>
            <Dialog open={dialog} onOpenChange={setDialog}>
              <DialogTrigger asChild>
                <Button className="pharmacy-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Waste
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong">
                <DialogHeader>
                  <DialogTitle>Record Waste Product</DialogTitle>
                  <DialogDescription>
                    Document damaged, expired, or recalled medicines
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Product ID *</Label>
                    <Input
                      value={form.product_id}
                      onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                      placeholder="Enter product ID"
                      className="pharmacy-input"
                    />
                  </div>
                  <div>
                    <Label>Batch ID *</Label>
                    <Input
                      value={form.batch_id}
                      onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
                      placeholder="Enter batch ID"
                      className="pharmacy-input"
                    />
                  </div>
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="pharmacy-input"
                    />
                  </div>
                  <div>
                    <Label>Reason for Waste *</Label>
                    <Select
                      value={form.reason}
                      onValueChange={(value) => setForm({ ...form, reason: value })}
                    >
                      <SelectTrigger className="pharmacy-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="recalled">Recalled</SelectItem>
                        <SelectItem value="contaminated">Contaminated</SelectItem>
                        <SelectItem value="quality_issue">Quality Issue</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Disposal Method</Label>
                    <Input
                      value={form.disposal_method}
                      onChange={(e) => setForm({ ...form, disposal_method: e.target.value })}
                      placeholder="e.g., Return to supplier, Destroy, Donate"
                      className="pharmacy-input"
                    />
                  </div>
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

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="pharmacy-button" onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : "Record Waste"}
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
                placeholder="Search waste products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pharmacy-input"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredWaste.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No waste products found matching your search" : "No waste products recorded yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Details</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Disposal Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Value Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWaste.map((waste) => (
                    <TableRow key={waste.id}>
                      <TableCell className="font-medium">
                        {waste.product_name || waste.product_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="pharmacy-badge">
                          {waste.batch_number || waste.batch_id}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{waste.quantity}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getReasonColor(waste.reason) as "default" | "destructive" | "secondary" | "outline"}
                          className="pharmacy-badge capitalize"
                        >
                          {waste.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{waste.disposal_method || "-"}</TableCell>
                      <TableCell>
                        {format(new Date(waste.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ${(waste.value_loss || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredWaste.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Total Waste Items: {filteredWaste.length}</span>
                <span className="font-bold text-red-600">
                  Total Financial Loss: ${filteredWaste.reduce((sum, w) => sum + (w.value_loss || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

