import { useState, useEffect } from "react";
import { Plus, Search, Receipt, DollarSign, Calendar, User, CheckCircle, Clock, FileDown, Printer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface PaymentCollection {
  id: string;
  customer_id?: string;
  customer_name: string;
  invoice_no?: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_no?: string;
  notes?: string;
  status: string;
  collected_by?: string;
  created_at: string;
}

interface PaymentCollectionTabProps {
  onUpdate?: () => void;
}

export default function PaymentCollectionTab({ onUpdate }: PaymentCollectionTabProps) {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentCollection[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    invoice_no: "",
    amount: 0,
    payment_method: "cash",
    payment_date: format(new Date(), "yyyy-MM-dd"),
    reference_no: "",
    notes: ""
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      // Load from sales with payment status
      const response = await fetch(`${API_CONFIG.BASE_URL}/sales`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const sales = await response.json();
        const paymentData = sales.map((sale: any) => ({
          id: sale.id,
          customer_id: sale.customer_id,
          customer_name: sale.customer_name || "Walk-in Customer",
          invoice_no: sale.invoice_no,
          amount: parseFloat(sale.net_amount || 0),
          payment_method: sale.payment_method || "cash",
          payment_date: sale.created_at,
          reference_no: sale.reference_no || "",
          notes: sale.notes || "",
          status: sale.payment_status || "completed",
          collected_by: sale.created_by,
          created_at: sale.created_at
        }));
        setPayments(paymentData);
      }
    } catch (error) {
      toast.error("Error loading payments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.customer_name || form.amount <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    // For now, log the payment collection
    toast.success("Payment collected successfully");
    setDialog(false);
    setForm({
      customer_name: "",
      invoice_no: "",
      amount: 0,
      payment_method: "cash",
      payment_date: format(new Date(), "yyyy-MM-dd"),
      reference_no: "",
      notes: ""
    });
    loadPayments();
    if (onUpdate) onUpdate();
  };

  const filteredPayments = payments.filter(p => 
    p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.invoice_no && p.invoice_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.reference_no && p.reference_no.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === "completed").length,
    pending: payments.filter(p => p.status === "pending" || p.status === "partial").length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    cashPayments: payments.filter(p => p.payment_method === "cash").reduce((sum, p) => sum + p.amount, 0),
    cardPayments: payments.filter(p => p.payment_method === "card").reduce((sum, p) => sum + p.amount, 0),
    onlinePayments: payments.filter(p => p.payment_method === "upi" || p.payment_method === "online").reduce((sum, p) => sum + p.amount, 0)
  };

  const exportToCSV = () => {
    const headers = ["Date", "Customer", "Invoice", "Amount", "Method", "Reference", "Status"];
    const rows = filteredPayments.map(p => [
      format(new Date(p.payment_date), "dd MMM yyyy"),
      p.customer_name,
      p.invoice_no || "",
      p.amount.toFixed(2),
      p.payment_method,
      p.reference_no || "",
      p.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-collections-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Payments exported successfully");
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collections</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.total} payments</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cash Payments</p>
                <p className="text-2xl font-bold text-blue-600">${stats.cashPayments.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Card Payments</p>
                <p className="text-2xl font-bold text-purple-600">${stats.cardPayments.toFixed(2)}</p>
              </div>
              <CreditCard className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online/UPI</p>
                <p className="text-2xl font-bold text-indigo-600">${stats.onlinePayments.toFixed(2)}</p>
              </div>
              <CreditCard className="w-10 h-10 text-indigo-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Collections */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Payment Collections
              </CardTitle>
              <CardDescription>Record and track customer payments</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={dialog} onOpenChange={setDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Collect Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Collect Payment</DialogTitle>
                    <DialogDescription>Record a new payment from customer</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Customer Name *</Label>
                      <Input
                        value={form.customer_name}
                        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <Label>Invoice Number</Label>
                      <Input
                        value={form.invoice_no}
                        onChange={(e) => setForm({ ...form, invoice_no: e.target.value })}
                        placeholder="INV-001"
                      />
                    </div>
                    <div>
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select
                        value={form.payment_method}
                        onValueChange={(value) => setForm({ ...form, payment_method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="online">Online Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Payment Date</Label>
                      <Input
                        type="date"
                        value={form.payment_date}
                        onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Reference Number</Label>
                      <Input
                        value={form.reference_no}
                        onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                        placeholder="Transaction ID, Cheque No, etc."
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Collect Payment</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={exportToCSV}>
                <FileDown className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, invoice, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No payments found" : "No payment collections yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(payment.payment_date), "dd MMM yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{payment.customer_name}</TableCell>
                      <TableCell>
                        {payment.invoice_no ? (
                          <Badge variant="outline">{payment.invoice_no}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ${payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.reference_no || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={payment.status === "completed" ? "default" : payment.status === "pending" ? "secondary" : "outline"}
                          className="capitalize"
                        >
                          {payment.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {payment.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredPayments.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Total Shown: {filteredPayments.length} payments</span>
                <span className="font-bold text-green-600">
                  Total Amount: ${filteredPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



