import { useState, useEffect } from "react";
import { Plus, Search, FileText, Download, Printer, Calendar, DollarSign, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";

interface Voucher {
  id: string;
  voucher_number: string;
  voucher_type: string;
  voucher_date: string;
  party_name: string;
  amount: number;
  payment_mode: string;
  narration: string;
  status: string;
  created_at: string;
}

export default function VouchersTab() {
  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialog, setDialog] = useState(false);
  const [voucherType, setVoucherType] = useState<"payment" | "receipt">("payment");
  const [form, setForm] = useState({
    party_name: "",
    amount: 0,
    payment_mode: "cash",
    voucher_date: format(new Date(), "yyyy-MM-dd"),
    narration: "",
    reference_no: ""
  });

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      // Placeholder - will be connected to backend
      setVouchers([]);
    } catch (error) {
      toast.error("Error loading vouchers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.party_name || form.amount <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.success(`${voucherType === "payment" ? "Payment" : "Receipt"} voucher created successfully`);
    setDialog(false);
    setForm({
      party_name: "",
      amount: 0,
      payment_mode: "cash",
      voucher_date: format(new Date(), "yyyy-MM-dd"),
      narration: "",
      reference_no: ""
    });
    loadVouchers();
  };

  const filteredVouchers = vouchers.filter(v => 
    v.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.narration.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: vouchers.length,
    payments: vouchers.filter(v => v.voucher_type === "payment").length,
    receipts: vouchers.filter(v => v.voucher_type === "receipt").length,
    totalPayments: vouchers.filter(v => v.voucher_type === "payment").reduce((sum, v) => sum + v.amount, 0),
    totalReceipts: vouchers.filter(v => v.voucher_type === "receipt").reduce((sum, v) => sum + v.amount, 0)
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vouchers</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payment Vouchers</p>
                <p className="text-2xl font-bold text-red-600">{stats.payments}</p>
                <p className="text-xs text-muted-foreground mt-1">${stats.totalPayments.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receipt Vouchers</p>
                <p className="text-2xl font-bold text-green-600">{stats.receipts}</p>
                <p className="text-xs text-muted-foreground mt-1">${stats.totalReceipts.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${stats.totalReceipts - stats.totalPayments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(stats.totalReceipts - stats.totalPayments).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vouchers List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Vouchers
              </CardTitle>
              <CardDescription>Manage payment and receipt vouchers</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={dialog} onOpenChange={setDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Voucher
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Voucher</DialogTitle>
                    <DialogDescription>Create a new payment or receipt voucher</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Voucher Type</Label>
                      <Select value={voucherType} onValueChange={(val) => setVoucherType(val as "payment" | "receipt")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment">Payment Voucher</SelectItem>
                          <SelectItem value="receipt">Receipt Voucher</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Party Name *</Label>
                      <Input
                        value={form.party_name}
                        onChange={(e) => setForm({ ...form, party_name: e.target.value })}
                        placeholder="Customer/Supplier name"
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
                      <Label>Payment Mode</Label>
                      <Select
                        value={form.payment_mode}
                        onValueChange={(value) => setForm({ ...form, payment_mode: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="online">Online Transfer</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Voucher Date</Label>
                      <Input
                        type="date"
                        value={form.voucher_date}
                        onChange={(e) => setForm({ ...form, voucher_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Reference Number</Label>
                      <Input
                        value={form.reference_no}
                        onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                        placeholder="Cheque no, Transaction ID, etc."
                      />
                    </div>
                    <div>
                      <Label>Narration *</Label>
                      <Textarea
                        value={form.narration}
                        onChange={(e) => setForm({ ...form, narration: e.target.value })}
                        placeholder="Purpose of payment/receipt..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Create Voucher</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vouchers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {vouchers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No vouchers created yet. Start by creating your first voucher!
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Vouchers</TabsTrigger>
                <TabsTrigger value="payment">Payments</TabsTrigger>
                <TabsTrigger value="receipt">Receipts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Voucher No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Party Name</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVouchers.map((voucher) => (
                        <TableRow key={voucher.id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{voucher.voucher_number}</Badge>
                          </TableCell>
                          <TableCell>{format(new Date(voucher.voucher_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant={voucher.voucher_type === "payment" ? "destructive" : "default"} className="capitalize">
                              {voucher.voucher_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{voucher.party_name}</TableCell>
                          <TableCell className="text-right font-bold">
                            ${voucher.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="capitalize">{voucher.payment_mode}</TableCell>
                          <TableCell>
                            <Badge variant={voucher.status === "approved" ? "default" : "secondary"} className="capitalize">
                              {voucher.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



