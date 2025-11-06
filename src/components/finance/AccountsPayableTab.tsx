import { useState, useEffect } from "react";
import { Search, Building2, DollarSign, Calendar, AlertCircle, FileDown, Printer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface Payable {
  supplier_id: string;
  supplier_name: string;
  total_credit: number;
  total_paid: number;
  balance: number;
  last_payment_date?: string;
  status: string;
}

export default function AccountsPayableTab() {
  const [loading, setLoading] = useState(false);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPayables();
  }, []);

  const loadPayables = async () => {
    setLoading(true);
    try {
      // Load manufacturers with balances
      const response = await fetch(`${API_CONFIG.PHARMACY_BASE}/manufacturers`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const manufacturers = await response.json();
        const payableData = manufacturers
          .filter((m: any) => parseFloat(m.current_balance || 0) > 0)
          .map((mfr: any) => ({
            supplier_id: mfr.id,
            supplier_name: mfr.name,
            total_credit: parseFloat(mfr.credit_limit || 0),
            total_paid: 0,
            balance: parseFloat(mfr.current_balance || 0),
            last_payment_date: null,
            status: parseFloat(mfr.current_balance || 0) > parseFloat(mfr.credit_limit || 0) ? "exceeded" : "normal"
          }));
        
        setPayables(payableData);
      }
    } catch (error) {
      toast.error("Error loading payables");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayables = payables.filter(p => 
    p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: payables.reduce((sum, p) => sum + p.balance, 0),
    suppliers: payables.length,
    exceeded: payables.filter(p => p.status === "exceeded").length,
    totalCredit: payables.reduce((sum, p) => sum + p.total_credit, 0)
  };

  const exportToCSV = () => {
    const headers = ["Supplier", "Credit Limit", "Balance Due", "Last Payment", "Status"];
    const rows = filteredPayables.map(p => [
      p.supplier_name,
      p.total_credit.toFixed(2),
      p.balance.toFixed(2),
      p.last_payment_date ? format(new Date(p.last_payment_date), "dd MMM yyyy") : "Never",
      p.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts-payable-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Payables exported successfully");
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payables</p>
                <p className="text-2xl font-bold text-red-600">${stats.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.suppliers} suppliers</p>
              </div>
              <DollarSign className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credit Limit</p>
                <p className="text-2xl font-bold text-orange-600">${stats.totalCredit.toFixed(2)}</p>
              </div>
              <Building2 className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credit Exceeded</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.exceeded}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credit Utilization</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.totalCredit > 0 ? ((stats.total / stats.totalCredit) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <Calendar className="w-10 h-10 text-indigo-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payables List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Accounts Payable
              </CardTitle>
              <CardDescription>Outstanding payments to suppliers/manufacturers</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
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
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredPayables.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No payables found" : "🎉 Great! No outstanding payables"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier/Manufacturer</TableHead>
                    <TableHead className="text-right">Credit Limit</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="text-right">Available Credit</TableHead>
                    <TableHead className="text-center">Utilization</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayables.map((payable) => {
                    const utilization = payable.total_credit > 0 ? (payable.balance / payable.total_credit * 100) : 0;
                    const availableCredit = payable.total_credit - payable.balance;
                    
                    return (
                      <TableRow 
                        key={payable.supplier_id}
                        className={payable.status === "exceeded" ? "bg-red-50" : ""}
                      >
                        <TableCell className="font-medium">{payable.supplier_name}</TableCell>
                        <TableCell className="text-right">${payable.total_credit.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          ${payable.balance.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={availableCredit < 0 ? "text-red-600 font-bold" : "text-green-600"}>
                            ${availableCredit.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={utilization > 100 ? "destructive" : utilization > 80 ? "default" : "secondary"}
                          >
                            {utilization.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={payable.status === "exceeded" ? "destructive" : "default"}
                            className="capitalize"
                          >
                            {payable.status === "exceeded" ? "Limit Exceeded" : "Normal"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredPayables.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Total Suppliers: {filteredPayables.length}</span>
                <span className="font-bold text-red-600">
                  Total Due: ${filteredPayables.reduce((sum, p) => sum + p.balance, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



