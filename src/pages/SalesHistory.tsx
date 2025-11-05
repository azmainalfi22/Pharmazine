import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Receipt, DollarSign, Calendar, RefreshCw, Download, Eye } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface Sale {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  discount: number;
  tax: number;
  net_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    to: format(endOfMonth(new Date()), "yyyy-MM-dd")
  });

  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    cashSales: 0,
    cardSales: 0
  });

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [searchTerm, dateRange, sales]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/sales`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSales(data);
        calculateStats(data);
      } else {
        toast.error("Failed to load sales");
      }
    } catch (error) {
      toast.error("Error loading sales data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = sales;

    // Date filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= new Date(dateRange.from) && saleDate <= new Date(dateRange.to + "T23:59:59");
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_phone.includes(searchTerm) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSales(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (salesData: Sale[]) => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.net_amount, 0);
    const cashSales = salesData.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + s.net_amount, 0);
    const cardSales = salesData.filter(s => s.payment_method === 'card').reduce((sum, s) => sum + s.net_amount, 0);

    setStats({
      totalSales: salesData.length,
      totalRevenue,
      cashSales,
      cardSales
    });
  };

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Invoice ID", "Customer", "Phone", "Total", "Discount", "Tax", "Net Amount", "Payment Method", "Status"];
    const rows = filteredSales.map(sale => [
      format(new Date(sale.created_at), "yyyy-MM-dd HH:mm"),
      sale.id.substring(0, 8),
      sale.customer_name,
      sale.customer_phone || "-",
      sale.total_amount.toFixed(2),
      sale.discount.toFixed(2),
      sale.tax.toFixed(2),
      sale.net_amount.toFixed(2),
      sale.payment_method,
      sale.payment_status
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Sales history exported successfully");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Prominent Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 p-8 rounded-2xl border-2 border-green-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Receipt className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">
                  Sales History
                </h1>
                <p className="text-white/90 text-base">
                  View and analyze all sales transactions
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={loadSales}
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Receipt className="h-5 w-5 text-white/80" />
                <span className="text-xs text-white/70 font-medium">TOTAL</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalSales}</div>
              <div className="text-xs text-white/70">Sales Count</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-white/80" />
                <span className="text-xs text-white/70 font-medium">REVENUE</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">${stats.totalRevenue.toFixed(0)}</div>
              <div className="text-xs text-white/70">Total Amount</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-white/80" />
                <span className="text-xs text-white/70 font-medium">CASH</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">${stats.cashSales.toFixed(0)}</div>
              <div className="text-xs text-white/70">Cash Sales</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-white/80" />
                <span className="text-xs text-white/70 font-medium">CARD</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">${stats.cardSales.toFixed(0)}</div>
              <div className="text-xs text-white/70">Card Sales</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="pharmacy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-primary" />
            Filter Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, phone, invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[160px]">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="min-w-[160px]">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card className="pharmacy-card">
        <CardHeader>
          <CardTitle>Sales Transactions ({filteredSales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading sales...
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No sales found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {format(new Date(sale.created_at), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {sale.id.substring(0, 8)}
                        </code>
                      </TableCell>
                      <TableCell>{sale.customer_name}</TableCell>
                      <TableCell>{sale.customer_phone || "-"}</TableCell>
                      <TableCell className="text-right">${sale.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {sale.discount > 0 ? `$${sale.discount.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {sale.tax > 0 ? `$${sale.tax.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        ${sale.net_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {sale.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={sale.payment_status === "completed" ? "default" : "secondary"}
                          className={sale.payment_status === "completed" ? "bg-green-600" : ""}
                        >
                          {sale.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
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

