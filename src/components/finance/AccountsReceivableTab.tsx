import { useState, useEffect } from "react";
import { Search, Users, DollarSign, Calendar, AlertCircle, CheckCircle, FileDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface Receivable {
  customer_id: string;
  customer_name: string;
  invoice_no: string;
  invoice_date: string;
  amount: number;
  paid_amount: number;
  balance: number;
  due_date?: string;
  days_overdue: number;
  status: string;
}

export default function AccountsReceivableTab() {
  const [loading, setLoading] = useState(false);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadReceivables();
  }, []);

  const loadReceivables = async () => {
    setLoading(true);
    try {
      // Load sales with pending payments
      const response = await fetch(`${API_CONFIG.BASE_URL}/sales`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const sales = await response.json();
        const pendingSales = sales
          .filter((s: any) => s.payment_status !== "completed")
          .map((sale: any) => {
            const invoiceDate = new Date(sale.created_at);
            const dueDate = new Date(invoiceDate);
            dueDate.setDate(dueDate.getDate() + 30); // 30 day credit period
            
            const daysOverdue = differenceInDays(new Date(), dueDate);
            
            return {
              customer_id: sale.customer_id || sale.id,
              customer_name: sale.customer_name || "Walk-in Customer",
              invoice_no: sale.invoice_no,
              invoice_date: sale.created_at,
              amount: parseFloat(sale.net_amount || 0),
              paid_amount: 0,
              balance: parseFloat(sale.net_amount || 0),
              due_date: dueDate.toISOString(),
              days_overdue: daysOverdue > 0 ? daysOverdue : 0,
              status: daysOverdue > 0 ? "overdue" : "pending"
            };
          });
        
        setReceivables(pendingSales);
      }
    } catch (error) {
      toast.error("Error loading receivables");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceivables = receivables.filter(r => 
    r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.invoice_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: receivables.reduce((sum, r) => sum + r.balance, 0),
    current: receivables.filter(r => r.days_overdue === 0).reduce((sum, r) => sum + r.balance, 0),
    overdue: receivables.filter(r => r.days_overdue > 0).reduce((sum, r) => sum + r.balance, 0),
    critical: receivables.filter(r => r.days_overdue > 30).reduce((sum, r) => sum + r.balance, 0),
    count: receivables.length
  };

  const exportToCSV = () => {
    const headers = ["Customer", "Invoice", "Invoice Date", "Due Date", "Amount", "Balance", "Days Overdue", "Status"];
    const rows = filteredReceivables.map(r => [
      r.customer_name,
      r.invoice_no,
      format(new Date(r.invoice_date), "dd MMM yyyy"),
      r.due_date ? format(new Date(r.due_date), "dd MMM yyyy") : "",
      r.amount.toFixed(2),
      r.balance.toFixed(2),
      r.days_overdue.toString(),
      r.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts-receivable-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Receivables exported successfully");
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receivables</p>
                <p className="text-2xl font-bold text-blue-600">${stats.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.count} invoices</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current (Not Due)</p>
                <p className="text-2xl font-bold text-green-600">${stats.current.toFixed(2)}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-orange-600">${stats.overdue.toFixed(2)}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical (&gt;30 days)</p>
                <p className="text-2xl font-bold text-red-600">${stats.critical.toFixed(2)}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receivables List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Accounts Receivable
              </CardTitle>
              <CardDescription>Outstanding customer payments</CardDescription>
            </div>
            <Button variant="outline" onClick={exportToCSV}>
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers or invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredReceivables.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No receivables found" : "🎉 Great! No outstanding receivables"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Days Overdue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivables.map((receivable, idx) => (
                    <TableRow 
                      key={idx}
                      className={receivable.days_overdue > 30 ? "bg-red-50" : receivable.days_overdue > 0 ? "bg-orange-50" : ""}
                    >
                      <TableCell className="font-medium">{receivable.customer_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{receivable.invoice_no}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(receivable.invoice_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        {receivable.due_date ? format(new Date(receivable.due_date), "dd MMM yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right">${receivable.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-orange-600">
                        ${receivable.balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {receivable.days_overdue > 0 ? (
                          <Badge variant="destructive">{receivable.days_overdue} days</Badge>
                        ) : (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={receivable.status === "overdue" ? "destructive" : "default"}
                          className="capitalize"
                        >
                          {receivable.status}
                        </Badge>
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

