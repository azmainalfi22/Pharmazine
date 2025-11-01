import { useState, useEffect } from "react";
import { Plus, Search, ArrowUpDown, Package, ArrowRightLeft, Edit, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

const API_BASE = "http://localhost:8000/api";

interface StockAdjustment {
  id: string;
  product_id: string;
  product_name?: string;
  adjustment_type: string;
  quantity: number;
  reason: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

interface StockTransfer {
  id: string;
  product_id: string;
  from_location: string;
  to_location: string;
  quantity: number;
  status: string;
  notes?: string;
  created_at: string;
}

export default function StockManagement() {
  const [activeTab, setActiveTab] = useState("adjustments");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [adjustmentDialog, setAdjustmentDialog] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    product_id: "",
    transaction_type: "adjust",
    quantity: 0,
    reason: "",
    notes: ""
  });

  const [transferDialog, setTransferDialog] = useState(false);
  const [transferForm, setTransferForm] = useState({
    product_id: "",
    from_location: "",
    to_location: "",
    quantity: 0,
    notes: ""
  });

  useEffect(() => {
    loadProducts();
    if (activeTab === "adjustments") loadAdjustments();
    if (activeTab === "transfers") loadTransfers();
  }, [activeTab]);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadAdjustments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/stock-transactions`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter((t: any) => t.transaction_type === "adjust");
        setAdjustments(filtered.map((adj: any) => ({
          ...adj,
          product_name: products.find(p => p.id === adj.product_id)?.name || "Unknown"
        })));
      }
    } catch (error) {
      toast.error("Error loading adjustments");
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/stock-transactions`, {
        headers: getAuthHeader()
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter((t: any) => 
          t.transaction_type === "transfer_in" || t.transaction_type === "transfer_out"
        );
        setTransfers(filtered);
      }
    } catch (error) {
      toast.error("Error loading transfers");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdjustment = async () => {
    if (!adjustmentForm.product_id || !adjustmentForm.reason) {
      toast.error("Product and reason are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/stock-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(adjustmentForm)
      });

      if (response.ok) {
        toast.success("Stock adjustment created successfully");
        setAdjustmentDialog(false);
        setAdjustmentForm({
          product_id: "",
          transaction_type: "adjust",
          quantity: 0,
          reason: "",
          notes: ""
        });
        loadAdjustments();
      } else {
        toast.error("Failed to create adjustment");
      }
    } catch (error) {
      toast.error("Error creating adjustment");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransfer = async () => {
    if (!transferForm.product_id || !transferForm.from_location || !transferForm.to_location) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/stock-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          product_id: transferForm.product_id,
          transaction_type: "transfer_out",
          quantity: transferForm.quantity,
          from_location: transferForm.from_location,
          to_location: transferForm.to_location,
          notes: transferForm.notes
        })
      });

      if (response.ok) {
        toast.success("Stock transfer created successfully");
        setTransferDialog(false);
        setTransferForm({
          product_id: "",
          from_location: "",
          to_location: "",
          quantity: 0,
          notes: ""
        });
        loadTransfers();
      } else {
        toast.error("Failed to create transfer");
      }
    } catch (error) {
      toast.error("Error creating transfer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Stock Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage stock adjustments and transfers
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="adjustments">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Stock Adjustments
          </TabsTrigger>
          <TabsTrigger value="transfers">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Stock Transfers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adjustments" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Stock Adjustments</CardTitle>
                <Dialog open={adjustmentDialog} onOpenChange={setAdjustmentDialog}>
                  <DialogTrigger asChild>
                    <Button className="pharmacy-button">
                      <Plus className="w-4 h-4 mr-2" />
                      New Adjustment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong">
                    <DialogHeader>
                      <DialogTitle>Create Stock Adjustment</DialogTitle>
                      <DialogDescription>Adjust stock levels with reason</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Product *</Label>
                        <Select
                          value={adjustmentForm.product_id}
                          onValueChange={(value) => setAdjustmentForm({ ...adjustmentForm, product_id: value })}
                        >
                          <SelectTrigger className="pharmacy-input">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} (Stock: {product.stock_quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity (use negative for reduction) *</Label>
                        <Input
                          type="number"
                          value={adjustmentForm.quantity}
                          onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: parseInt(e.target.value) || 0 })}
                          placeholder="e.g., 10 or -10"
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Reason *</Label>
                        <Select
                          value={adjustmentForm.reason}
                          onValueChange={(value) => setAdjustmentForm({ ...adjustmentForm, reason: value })}
                        >
                          <SelectTrigger className="pharmacy-input">
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="damage">Damage</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="missing">Missing/Lost</SelectItem>
                            <SelectItem value="found">Found</SelectItem>
                            <SelectItem value="correction">Stock Correction</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={adjustmentForm.notes}
                          onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                          placeholder="Additional details..."
                          className="pharmacy-input"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAdjustmentDialog(false)}>
                        Cancel
                      </Button>
                      <Button className="pharmacy-button" onClick={handleSaveAdjustment}>
                        Create Adjustment
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : adjustments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No adjustments yet
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adjustments.map((adj) => (
                        <TableRow key={adj.id}>
                          <TableCell>{format(new Date(adj.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                          <TableCell className="font-medium">{adj.product_name}</TableCell>
                          <TableCell className="text-right">
                            <span className={adj.quantity > 0 ? "text-green-600" : "text-red-600"}>
                              {adj.quantity > 0 ? "+" : ""}{adj.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className="pharmacy-badge capitalize">{adj.reason}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{adj.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Stock Transfers</CardTitle>
                <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
                  <DialogTrigger asChild>
                    <Button className="pharmacy-button">
                      <Plus className="w-4 h-4 mr-2" />
                      New Transfer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong">
                    <DialogHeader>
                      <DialogTitle>Create Stock Transfer</DialogTitle>
                      <DialogDescription>Transfer stock between locations</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Product *</Label>
                        <Select
                          value={transferForm.product_id}
                          onValueChange={(value) => setTransferForm({ ...transferForm, product_id: value })}
                        >
                          <SelectTrigger className="pharmacy-input">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>From Location *</Label>
                          <Input
                            value={transferForm.from_location}
                            onChange={(e) => setTransferForm({ ...transferForm, from_location: e.target.value })}
                            placeholder="e.g., Warehouse A"
                            className="pharmacy-input"
                          />
                        </div>
                        <div>
                          <Label>To Location *</Label>
                          <Input
                            value={transferForm.to_location}
                            onChange={(e) => setTransferForm({ ...transferForm, to_location: e.target.value })}
                            placeholder="e.g., Store B"
                            className="pharmacy-input"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          value={transferForm.quantity}
                          onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value) || 0 })}
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={transferForm.notes}
                          onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                          placeholder="Additional details..."
                          className="pharmacy-input"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTransferDialog(false)}>
                        Cancel
                      </Button>
                      <Button className="pharmacy-button" onClick={handleSaveTransfer}>
                        Create Transfer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No transfers yet
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfers.map((transfer) => (
                        <TableRow key={transfer.id}>
                          <TableCell>{format(new Date(transfer.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                          <TableCell className="font-medium">{transfer.product_id}</TableCell>
                          <TableCell>{transfer.from_location}</TableCell>
                          <TableCell>{transfer.to_location}</TableCell>
                          <TableCell className="text-right">{transfer.quantity}</TableCell>
                          <TableCell>
                            <Badge className="pharmacy-badge">{transfer.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive">
                                <X className="w-4 h-4" />
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
      </Tabs>
    </div>
  );
}

