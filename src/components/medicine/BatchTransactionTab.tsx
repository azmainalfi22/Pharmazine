import { useState, useEffect } from "react";
import { Search, History, TrendingUp, TrendingDown, Package, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface BatchTransaction {
  id: string;
  batch_id: string;
  batch_number?: string;
  product_id?: string;
  product_name?: string;
  transaction_type: string;
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

interface BatchTransactionTabProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function BatchTransactionTab({ searchTerm, setSearchTerm }: BatchTransactionTabProps) {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<BatchTransaction[]>([]);
  const [transactionType, setTransactionType] = useState("all");

  useEffect(() => {
    loadTransactions();
  }, [transactionType]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      let url = `${API_CONFIG.PHARMACY_BASE}/batch-transactions`;
      if (transactionType !== "all") {
        url += `?transaction_type=${transactionType}`;
      }
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else {
        toast.error("Failed to load batch transactions");
      }
    } catch (error) {
      toast.error("Error loading batch transactions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
      case "stock_in":
      case "adjustment_in":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "sale":
      case "stock_out":
      case "adjustment_out":
      case "waste":
      case "return":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "purchase":
      case "stock_in":
      case "adjustment_in":
        return "bg-green-50 text-green-700 border-green-200";
      case "sale":
      case "stock_out":
      case "adjustment_out":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "waste":
      case "return":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const filteredTransactions = transactions.filter(t => 
    (t.batch_number && t.batch_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.product_name && t.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: transactions.length,
    stockIn: transactions.filter(t => ["purchase", "stock_in", "adjustment_in"].includes(t.transaction_type)).length,
    stockOut: transactions.filter(t => ["sale", "stock_out", "adjustment_out", "waste", "return"].includes(t.transaction_type)).length,
    totalStockIn: transactions
      .filter(t => ["purchase", "stock_in", "adjustment_in"].includes(t.transaction_type))
      .reduce((sum, t) => sum + t.quantity, 0),
    totalStockOut: transactions
      .filter(t => ["sale", "stock_out", "adjustment_out", "waste", "return"].includes(t.transaction_type))
      .reduce((sum, t) => sum + t.quantity, 0)
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="pharmacy-stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <History className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock In</p>
                <p className="text-2xl font-bold text-green-600">{stats.stockIn}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Qty: {stats.totalStockIn}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Out</p>
                <p className="text-2xl font-bold text-red-600">{stats.stockOut}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Qty: {stats.totalStockOut}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Movement</p>
                <p className={`text-2xl font-bold ${stats.totalStockIn >= stats.totalStockOut ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.totalStockIn - stats.totalStockOut > 0 ? '+' : ''}
                  {stats.totalStockIn - stats.totalStockOut}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Transactions List */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Batch Transaction History
              </CardTitle>
              <CardDescription>Track all stock movements at batch level</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pharmacy-input"
              />
            </div>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="w-[200px] pharmacy-input">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="stock_in">Stock In</SelectItem>
                <SelectItem value="stock_out">Stock Out</SelectItem>
                <SelectItem value="adjustment_in">Adjustment In</SelectItem>
                <SelectItem value="adjustment_out">Adjustment Out</SelectItem>
                <SelectItem value="waste">Waste</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm || transactionType !== "all" 
                ? "No transactions found matching your filters" 
                : "No batch transactions recorded yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Transaction Type</TableHead>
                    <TableHead>Product Details</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(transaction.created_at), "dd MMM yyyy")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(transaction.created_at), "HH:mm:ss")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getTransactionColor(transaction.transaction_type)} flex items-center gap-1 w-fit`}>
                          {getTransactionIcon(transaction.transaction_type)}
                          <span className="capitalize">{transaction.transaction_type.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.product_name || transaction.product_id || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="pharmacy-badge">
                          {transaction.batch_number || transaction.batch_id}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${
                          ["purchase", "stock_in", "adjustment_in"].includes(transaction.transaction_type)
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                          {["purchase", "stock_in", "adjustment_in"].includes(transaction.transaction_type) ? '+' : '-'}
                          {transaction.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.reference_type && transaction.reference_id ? (
                          <div className="text-xs">
                            <div className="text-muted-foreground capitalize">{transaction.reference_type}</div>
                            <div className="font-mono">{transaction.reference_id.substring(0, 8)}...</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {transaction.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredTransactions.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Transactions:</span>
                  <span className="ml-2">{filteredTransactions.length}</span>
                </div>
                <div className="text-green-600">
                  <span className="font-medium">Stock In:</span>
                  <span className="ml-2">
                    +{filteredTransactions
                      .filter(t => ["purchase", "stock_in", "adjustment_in"].includes(t.transaction_type))
                      .reduce((sum, t) => sum + t.quantity, 0)}
                  </span>
                </div>
                <div className="text-red-600">
                  <span className="font-medium">Stock Out:</span>
                  <span className="ml-2">
                    -{filteredTransactions
                      .filter(t => ["sale", "stock_out", "adjustment_out", "waste", "return"].includes(t.transaction_type))
                      .reduce((sum, t) => sum + t.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

