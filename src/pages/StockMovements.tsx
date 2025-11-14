import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Search, Filter, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StockMovement {
  id: string;
  product_id: string;
  product_name?: string;
  transaction_type: string;
  quantity: number;
  unit_price?: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadMovements();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [searchTerm, typeFilter, movements]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      console.log("Loading stock movements from:", `${API_CONFIG.API_ROOT}/stock-transactions`);
      const response = await fetch(`${API_CONFIG.API_ROOT}/stock-transactions`, {
        headers: getAuthHeaders(),
      });
      console.log("Stock movements response:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Stock movements data:", data);
        
        // Fetch products to map names
        const productsResponse = await fetch(`${API_CONFIG.API_ROOT}/products`, {
          headers: getAuthHeaders(),
        });
        if (productsResponse.ok) {
          const products = await productsResponse.json();
          const productMap = new Map(products.map((p: any) => [p.id, p.name]));
          
          // Enrich movements with product names
          const enrichedData = data.map((m: StockMovement) => ({
            ...m,
            product_name: productMap.get(m.product_id) || m.product_id,
          }));
          
          setMovements(enrichedData);
          toast.success(`Loaded ${enrichedData.length} stock movements`);
        } else {
          setMovements(data);
          toast.success(`Loaded ${data.length} stock movements`);
        }
      } else {
        toast.error("Failed to load stock movements");
      }
    } catch (error) {
      console.error("Error loading stock movements:", error);
      toast.error("Error loading stock movements");
    } finally {
      setLoading(false);
    }
  };

  const filterMovements = () => {
    let filtered = movements;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      if (typeFilter === "in") {
        filtered = filtered.filter((m) =>
          ["purchase", "sales_return", "opening_stock", "stock_adjustment_in"].includes(
            m.transaction_type
          )
        );
      } else if (typeFilter === "out") {
        filtered = filtered.filter((m) =>
          ["sales", "supplier_return", "stock_adjustment_out"].includes(
            m.transaction_type
          )
        );
      }
    }

    setFilteredMovements(filtered);
  };

  const getTransactionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      purchase: "Purchase from Supplier",
      sales: "Sale to Customer",
      sales_return: "Customer Return",
      supplier_return: "Return to Supplier",
      opening_stock: "Opening Stock",
      stock_adjustment_in: "Physical Count (+)",
      stock_adjustment_out: "Physical Count (-)",
    };
    return labels[type] || type;
  };

  const getTransactionBadge = (type: string) => {
    const isStockIn = [
      "purchase",
      "sales_return",
      "opening_stock",
      "stock_adjustment_in",
    ].includes(type);

    return (
      <Badge variant={isStockIn ? "default" : "secondary"} className={isStockIn ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {isStockIn ? "STOCK IN +" : "STOCK OUT -"}
      </Badge>
    );
  };

  const exportToCSV = () => {
    if (filteredMovements.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Product", "Type", "Direction", "Quantity", "Reference", "Notes"].join(",");
    const rows = filteredMovements.map((m) =>
      [
        format(parseISO(m.created_at), "yyyy-MM-dd HH:mm"),
        m.product_name || m.product_id,
        getTransactionLabel(m.transaction_type),
        ["purchase", "sales_return", "opening_stock", "stock_adjustment_in"].includes(
          m.transaction_type
        )
          ? "IN"
          : "OUT",
        m.quantity,
        m.reference_id || "",
        m.notes || "",
      ].join(",")
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-movements-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Report exported successfully");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Prominent Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 rounded-2xl border-2 border-indigo-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <ArrowRightLeft className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">Stock Movements</h1>
              <p className="text-white/90 text-base">Complete audit trail of all inventory transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMovements}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>All Stock Transactions</CardTitle>
              <CardDescription>Track every stock movement in your inventory</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-[250px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Movements</SelectItem>
                  <SelectItem value="in">Stock IN</SelectItem>
                  <SelectItem value="out">Stock OUT</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading movements...</div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stock movements found. Start by creating purchases or sales.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Transaction Type</TableHead>
                    <TableHead className="text-center">Direction</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-mono text-sm">
                        {format(parseISO(movement.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">{movement.product_name || movement.product_id}</TableCell>
                      <TableCell>{getTransactionLabel(movement.transaction_type)}</TableCell>
                      <TableCell className="text-center">{getTransactionBadge(movement.transaction_type)}</TableCell>
                      <TableCell className="text-center font-bold">{movement.quantity}</TableCell>
                      <TableCell className="font-mono text-sm">{movement.reference_id || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{movement.notes || "-"}</TableCell>
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

