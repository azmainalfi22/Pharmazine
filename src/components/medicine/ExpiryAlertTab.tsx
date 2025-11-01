import { useState } from "react";
import { Search, AlertTriangle, Calendar, DollarSign, Package, FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";

interface ExpiryAlert {
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  generic_name?: string;
  brand_name?: string;
  expiry_date: string;
  quantity_remaining: number;
  purchase_price: number;
  value_at_risk: number;
  manufacturer?: string;
  store?: string;
  days_to_expiry: number;
  alert_level: string;
}

interface ExpiryAlertTabProps {
  alerts: ExpiryAlert[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  expiryFilter: string;
  setExpiryFilter: (filter: string) => void;
}

export default function ExpiryAlertTab({ 
  alerts, 
  loading, 
  searchTerm, 
  setSearchTerm,
  expiryFilter,
  setExpiryFilter
}: ExpiryAlertTabProps) {
  
  const getAlertColor = (level: string) => {
    switch (level) {
      case "expired": return "destructive";
      case "critical": return "destructive";
      case "warning": return "default";
      case "info": return "secondary";
      default: return "default";
    }
  };

  const getAlertText = (level: string) => {
    switch (level) {
      case "expired": return "Expired";
      case "critical": return "Critical (<30 days)";
      case "warning": return "Warning (30-60 days)";
      case "info": return "Info (60-90 days)";
      default: return level;
    }
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "expired": return "🔴";
      case "critical": return "🟠";
      case "warning": return "🟡";
      case "info": return "🔵";
      default: return "⚪";
    }
  };

  const filteredAlerts = alerts.filter(a => 
    a.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.generic_name && a.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    expired: alerts.filter(a => a.alert_level === "expired").length,
    critical: alerts.filter(a => a.alert_level === "critical").length,
    warning: alerts.filter(a => a.alert_level === "warning").length,
    info: alerts.filter(a => a.alert_level === "info").length,
    totalValue: alerts.reduce((sum, a) => sum + a.value_at_risk, 0)
  };

  const exportToCSV = () => {
    const headers = ["Batch Number", "Product Name", "Generic Name", "Expiry Date", "Days to Expiry", "Quantity", "Value at Risk", "Alert Level"];
    const rows = filteredAlerts.map(alert => [
      alert.batch_number,
      alert.product_name,
      alert.generic_name || "",
      format(new Date(alert.expiry_date), "dd MMM yyyy"),
      alert.days_to_expiry.toString(),
      alert.quantity_remaining.toString(),
      alert.value_at_risk.toFixed(2),
      getAlertText(alert.alert_level)
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expiry-alerts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Expiry alerts exported successfully");
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="pharmacy-stat-card border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-orange-600">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="pharmacy-stat-card border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warning</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600 opacity-20" />
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
                <p className="text-sm text-muted-foreground">Value at Risk</p>
                <p className="text-2xl font-bold text-primary">${stats.totalValue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiry Alerts List */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Expiry Alerts
              </CardTitle>
              <CardDescription>Monitor medicines approaching expiry date</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pharmacy-input"
              />
            </div>
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger className="w-[200px] pharmacy-input">
                <SelectValue placeholder="Filter by days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="30">Expiring in 30 days</SelectItem>
                <SelectItem value="60">Expiring in 60 days</SelectItem>
                <SelectItem value="90">Expiring in 90 days</SelectItem>
                <SelectItem value="expired">Expired Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm 
                ? "No expiry alerts found matching your search" 
                : alerts.length === 0
                  ? "🎉 Great! No medicines expiring soon"
                  : "No alerts matching the selected filter"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Details</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Days Left</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Value at Risk</TableHead>
                    <TableHead className="text-center">Alert Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.batch_id} className={
                      alert.alert_level === "expired" ? "bg-red-50" :
                      alert.alert_level === "critical" ? "bg-orange-50" :
                      alert.alert_level === "warning" ? "bg-yellow-50" :
                      ""
                    }>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{alert.product_name}</div>
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
                      <TableCell>
                        <Badge variant="outline" className="pharmacy-badge">
                          {alert.batch_number}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(alert.expiry_date), "dd MMM yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={
                          alert.days_to_expiry < 0 ? "text-red-600" :
                          alert.days_to_expiry <= 30 ? "text-orange-600" :
                          alert.days_to_expiry <= 60 ? "text-yellow-600" :
                          "text-blue-600"
                        }>
                          {alert.days_to_expiry < 0 
                            ? `${Math.abs(alert.days_to_expiry)} days ago`
                            : `${alert.days_to_expiry} days`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {alert.quantity_remaining}
                      </TableCell>
                      <TableCell className="text-right">
                        ${alert.purchase_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        ${alert.value_at_risk.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={getAlertColor(alert.alert_level) as any}
                          className="pharmacy-badge"
                        >
                          {getAlertIcon(alert.alert_level)} {getAlertText(alert.alert_level)}
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
                <span className="font-medium">Total Alerts: {filteredAlerts.length}</span>
                <span className="font-bold text-red-600">
                  Total Value at Risk: ${filteredAlerts.reduce((sum, a) => sum + a.value_at_risk, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

