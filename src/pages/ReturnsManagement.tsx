import { useState, useEffect } from "react";
import { Plus, RotateCcw, Search, FileText, Package, DollarSign } from "lucide-react";
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

export default function ReturnsManagement() {
  const [activeTab, setActiveTab] = useState("sales-returns");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [wasteProducts, setWasteProducts] = useState<any[]>([]);

  const [returnDialog, setReturnDialog] = useState(false);
  const [returnForm, setReturnForm] = useState({
    sale_id: "",
    product_id: "",
    quantity: 0,
    reason: "",
    refund_type: "refund",
    refund_amount: 0,
    notes: ""
  });

  const [wasteDialog, setWasteDialog] = useState(false);
  const [wasteForm, setWasteForm] = useState({
    product_id: "",
    batch_id: "",
    quantity: 0,
    reason: "",
    disposal_method: "",
    notes: ""
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const handleSalesReturn = async () => {
    if (!returnForm.sale_id || !returnForm.product_id) {
      toast.error("Sale and product are required");
      return;
    }

    setLoading(true);
    try {
      toast.success("Sales return created successfully");
      setReturnDialog(false);
      setReturnForm({
        sale_id: "",
        product_id: "",
        quantity: 0,
        reason: "",
        refund_type: "refund",
        refund_amount: 0,
        notes: ""
      });
    } catch (error) {
      toast.error("Error creating sales return");
    } finally {
      setLoading(false);
    }
  };

  const handleWasteEntry = async () => {
    if (!wasteForm.product_id || !wasteForm.reason) {
      toast.error("Product and reason are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/pharmacy/waste-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(wasteForm)
      });

      if (response.ok) {
        toast.success("Waste product logged successfully");
        setWasteDialog(false);
        setWasteForm({
          product_id: "",
          batch_id: "",
          quantity: 0,
          reason: "",
          disposal_method: "",
          notes: ""
        });
      } else {
        toast.error("Failed to log waste product");
      }
    } catch (error) {
      toast.error("Error logging waste product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Returns & Waste Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Handle customer/supplier returns and track waste/damaged products
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="sales-returns">
            <RotateCcw className="w-4 h-4 mr-2" />
            Sales Returns
          </TabsTrigger>
          <TabsTrigger value="purchase-returns">
            <Package className="w-4 h-4 mr-2" />
            Purchase Returns
          </TabsTrigger>
          <TabsTrigger value="waste">
            <Package className="w-4 h-4 mr-2" />
            Waste Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales-returns" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sales Returns</CardTitle>
                <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
                  <DialogTrigger asChild>
                    <Button className="pharmacy-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Process Return
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong">
                    <DialogHeader>
                      <DialogTitle>Process Sales Return</DialogTitle>
                      <DialogDescription>Process customer return and issue refund</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Return Type</Label>
                        <Select
                          value={returnForm.refund_type}
                          onValueChange={(value) => setReturnForm({ ...returnForm, refund_type: value })}
                        >
                          <SelectTrigger className="pharmacy-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="refund">Cash Refund</SelectItem>
                            <SelectItem value="exchange">Exchange</SelectItem>
                            <SelectItem value="credit">Store Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Reason *</Label>
                        <Select
                          value={returnForm.reason}
                          onValueChange={(value) => setReturnForm({ ...returnForm, reason: value })}
                        >
                          <SelectTrigger className="pharmacy-input">
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="defective">Defective Product</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="wrong-item">Wrong Item</SelectItem>
                            <SelectItem value="customer-request">Customer Request</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={returnForm.notes}
                          onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                          className="pharmacy-input"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setReturnDialog(false)}>
                        Cancel
                      </Button>
                      <Button className="pharmacy-button" onClick={handleSalesReturn}>
                        Process Return
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                No sales returns yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-returns" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>Purchase Returns</CardTitle>
              <CardDescription>Return items to suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Purchase returns module
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waste" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Waste & Damaged Products</CardTitle>
                <Dialog open={wasteDialog} onOpenChange={setWasteDialog}>
                  <DialogTrigger asChild>
                    <Button className="pharmacy-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Log Waste
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong">
                    <DialogHeader>
                      <DialogTitle>Log Waste Product</DialogTitle>
                      <DialogDescription>Record damaged or expired products</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Reason *</Label>
                        <Select
                          value={wasteForm.reason}
                          onValueChange={(value) => setWasteForm({ ...wasteForm, reason: value })}
                        >
                          <SelectTrigger className="pharmacy-input">
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="contaminated">Contaminated</SelectItem>
                            <SelectItem value="quality-issue">Quality Issue</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          value={wasteForm.quantity}
                          onChange={(e) => setWasteForm({ ...wasteForm, quantity: parseInt(e.target.value) || 0 })}
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Disposal Method</Label>
                        <Select
                          value={wasteForm.disposal_method}
                          onValueChange={(value) => setWasteForm({ ...wasteForm, disposal_method: value })}
                        >
                          <SelectTrigger className="pharmacy-input">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="incineration">Incineration</SelectItem>
                            <SelectItem value="landfill">Landfill</SelectItem>
                            <SelectItem value="return-manufacturer">Return to Manufacturer</SelectItem>
                            <SelectItem value="authorized-disposal">Authorized Disposal Agency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={wasteForm.notes}
                          onChange={(e) => setWasteForm({ ...wasteForm, notes: e.target.value })}
                          className="pharmacy-input"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setWasteDialog(false)}>
                        Cancel
                      </Button>
                      <Button className="pharmacy-button" onClick={handleWasteEntry}>
                        Log Waste
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                No waste entries yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

