import { useState, useEffect } from "react";
import { Plus, FileText, DollarSign, Receipt, CreditCard, ArrowUpDown } from "lucide-react";
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
import { API_CONFIG, getAuthHeaders } from "@/config/api";

export default function AccountsVouchers() {
  const [activeTab, setActiveTab] = useState("journal");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  
  const [voucherDialog, setVoucherDialog] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    type: "receipt",
    date: format(new Date(), "yyyy-MM-dd"),
    amount: 0,
    description: "",
    reference_id: "",
    party_name: "",
    payment_mode: "cash"
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsRes, expensesRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/transactions`, { headers: getAuthHeaders() }),
        fetch(`${API_CONFIG.BASE_URL}/expenses`, { headers: getAuthHeaders() })
      ]);

      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVoucher = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/transactions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: voucherForm.type,
          amount: voucherForm.amount,
          description: voucherForm.description,
          reference_id: voucherForm.reference_id,
          date: voucherForm.date
        })
      });

      if (response.ok) {
        toast.success("Voucher created successfully");
        setVoucherDialog(false);
        setVoucherForm({
          type: "receipt",
          date: format(new Date(), "yyyy-MM-dd"),
          amount: 0,
          description: "",
          reference_id: "",
          party_name: "",
          payment_mode: "cash"
        });
        loadData();
      } else {
        toast.error("Failed to create voucher");
      }
    } catch (error) {
      toast.error("Error creating voucher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Prominent Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-600 via-gray-600 to-slate-700 p-8 rounded-2xl border-2 border-slate-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">
                Accounts & Vouchers
              </h1>
              <p className="text-white/90 text-base">
                Manage vouchers, receipts, and payments
              </p>
            </div>
          </div>
          
          <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 text-center">
            <div className="text-xs text-white/70 font-medium">VOUCHERS</div>
            <div className="text-2xl font-bold text-white">{vouchers.length}</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="journal"><FileText className="w-4 h-4 mr-2" />Journal Entry</TabsTrigger>
          <TabsTrigger value="receipt"><Receipt className="w-4 h-4 mr-2" />Receipt Voucher</TabsTrigger>
          <TabsTrigger value="payment"><DollarSign className="w-4 h-4 mr-2" />Payment Voucher</TabsTrigger>
          <TabsTrigger value="contra"><ArrowUpDown className="w-4 h-4 mr-2" />Contra</TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="space-y-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Journal Vouchers</CardTitle>
                <Dialog open={voucherDialog} onOpenChange={setVoucherDialog}>
                  <DialogTrigger asChild>
                    <Button className="pharmacy-button">
                      <Plus className="w-4 h-4 mr-2" />
                      New Voucher
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong">
                    <DialogHeader>
                      <DialogTitle>Create Voucher</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={voucherForm.date}
                          onChange={(e) => setVoucherForm({ ...voucherForm, date: e.target.value })}
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={voucherForm.amount}
                          onChange={(e) => setVoucherForm({ ...voucherForm, amount: parseFloat(e.target.value) || 0 })}
                          className="pharmacy-input"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={voucherForm.description}
                          onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                          className="pharmacy-input"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setVoucherDialog(false)}>Cancel</Button>
                      <Button className="pharmacy-button" onClick={handleSaveVoucher}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No journal entries yet
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{format(new Date(transaction.date), "dd MMM yyyy")}</TableCell>
                          <TableCell><Badge variant="outline">{transaction.type}</Badge></TableCell>
                          <TableCell>{transaction.description || "-"}</TableCell>
                          <TableCell className="text-right font-medium">৳{transaction.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Receipt Vouchers</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.filter((t: any) => t.type === "cash_in").map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.date), "dd MMM yyyy")}</TableCell>
                        <TableCell>{transaction.reference_id || "-"}</TableCell>
                        <TableCell>{transaction.description || "-"}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">৳{transaction.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payment">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Payment Vouchers</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.filter((t: any) => t.type === "cash_out" || t.type === "expense").map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(new Date(transaction.date), "dd MMM yyyy")}</TableCell>
                        <TableCell>{transaction.reference_id || "-"}</TableCell>
                        <TableCell>{transaction.description || "-"}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">৳{transaction.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contra">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Contra Entries</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Bank transfers and cash movements
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

