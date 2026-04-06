import { useState } from "react";
import {
  Search,
  AlertCircle,
  Package,
  DollarSign,
  TrendingDown,
  FileDown,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";

interface LowStockAlert {
  product_id: string;
  product_name: string;
  generic_name?: string;
  brand_name?: string;
  current_stock: number;
  reorder_level: number;
  stock_percentage: number;
  total_value: number;
  alert_level: string;
}

interface LowStockAlertTabProps {
  alerts: LowStockAlert[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function LowStockAlertTab({
  alerts,
  loading,
  searchTerm,
  setSearchTerm,
}: LowStockAlertTabProps) {
  const getAlertColor = (level: string) => {
    switch (level) {
      case "critical":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      default:
        return "default";
    }
  };

  const getAlertText = (level: string) => {
    switch (level) {
      case "critical":
        return "Critical (< 25%)";
      case "warning":
        return "Warning (25-50%)";
      case "info":
        return "Info (50-75%)";
      default:
        return level;
    }
  };

  const filteredAlerts = alerts.filter(
    (a) =>
      a.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.generic_name &&
        a.generic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.brand_name &&
        a.brand_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    critical: alerts.filter((a) => a.alert_level === "critical").length,
    warning: alerts.filter((a) => a.alert_level === "warning").length,
    info: alerts.filter((a) => a.alert_level === "info").length,
    totalValue: alerts.reduce((sum, a) => sum + a.total_value, 0),
  };

  const exportToCSV = () => {
    const headers = [
      "Product Name",
      "Generic Name",
      "Current Stock",
      "Reorder Level",
      "Stock %",
      "Value",
      "Alert Level",
    ];
    const rows = filteredAlerts.map((alert) => [
      alert.product_name,
      alert.generic_name || "",
      alert.current_stock.toString(),
      alert.reorder_level.toString(),
      alert.stock_percentage.toFixed(1) + "%",
      alert.total_value.toFixed(2),
      getAlertText(alert.alert_level),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `low-stock-alerts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Low stock alerts exported successfully");
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="pharmacy-stat-card border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.critical}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warning</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.warning}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Info</p>
                <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-primary">
                  ${stats.totalValue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts List */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-primary" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>
                Products running low on inventory
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
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
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pharmacy-input"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm
                ? "No low stock alerts found matching your search"
                : alerts.length === 0
                ? "🎉 Great! All products are well stocked"
                : "No alerts matching the selected filter"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Details</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead className="text-right">Stock %</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-center">Alert Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow
                      key={alert.product_id}
                      className={
                        alert.alert_level === "critical"
                          ? "bg-red-50"
                          : alert.alert_level === "warning"
                          ? "bg-orange-50"
                          : ""
                      }
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">
                            {alert.product_name}
                          </div>
                          {alert.generic_name && (
                            <div className="text-xs text-muted-foreground">
                              Generic: {alert.generic_name}
                            </div>
                          )}
                          {alert.brand_name && (
                            <div className="text-xs text-muted-foreground">
                              Brand: {alert.brand_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            alert.alert_level === "critical"
                              ? "text-red-600 font-bold"
                              : ""
                          }
                        >
                          {alert.current_stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {alert.reorder_level}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            alert.stock_percentage < 25
                              ? "text-red-600"
                              : alert.stock_percentage < 50
                              ? "text-orange-600"
                              : "text-blue-600"
                          }
                        >
                          {alert.stock_percentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${alert.total_value.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            getAlertColor(alert.alert_level) as
                              | "default"
                              | "destructive"
                              | "secondary"
                          }
                          className="pharmacy-badge"
                        >
                          {getAlertText(alert.alert_level)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredAlerts.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">
                  Total Products: {filteredAlerts.length}
                </span>
                <span className="font-bold text-primary">
                  Total Stock Value: $
                  {filteredAlerts
                    .reduce((sum, a) => sum + a.total_value, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
