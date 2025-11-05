import { useState, useEffect } from "react";
import { Pill, TrendingUp, AlertTriangle, Calendar, DollarSign, Package, FileDown, Printer, BarChart3, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { toast } from "sonner";
import { format } from "date-fns";
import ExpiryTrendChart from "@/components/reports/ExpiryTrendChart";
import ManufacturerPerformanceChart from "@/components/reports/ManufacturerPerformanceChart";

interface MedicineReportData {
  totalProducts: number;
  totalBatches: number;
  totalStockValue: number;
  expiringSoon: number;
  lowStockItems: number;
  outOfStock: number;
  totalManufacturers: number;
  averageStockLevel: number;
  totalWasteValue: number;
  expiredValue: number;
}

interface TopSellingMedicine {
  product_id: string;
  product_name: string;
  generic_name: string;
  total_quantity_sold: number;
  total_revenue: number;
  profit_margin: number;
}

interface ExpiryReport {
  alert_level: string;
  count: number;
  total_quantity: number;
  value_at_risk: number;
}

interface MedicineReportsTabProps {
  dateRange: { from: string; to: string };
}

export default function MedicineReportsTab({ dateRange }: MedicineReportsTabProps) {
  const [loading, setLoading] = useState(false);
  const [medicineStats, setMedicineStats] = useState<MedicineReportData>({
    totalProducts: 0,
    totalBatches: 0,
    totalStockValue: 0,
    expiringSoon: 0,
    lowStockItems: 0,
    outOfStock: 0,
    totalManufacturers: 0,
    averageStockLevel: 0,
    totalWasteValue: 0,
    expiredValue: 0
  });
  const [topSelling, setTopSelling] = useState<TopSellingMedicine[]>([]);
  const [expiryBreakdown, setExpiryBreakdown] = useState<ExpiryReport[]>([]);
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [manufacturerData, setManufacturerData] = useState<any[]>([]);
  const [expiryTrend, setExpiryTrend] = useState<any[]>([]);

  useEffect(() => {
    loadMedicineReports();
  }, [dateRange]);

  const loadMedicineReports = async () => {
    setLoading(true);
    try {
      // Load medicine statistics
      const statsRes = await fetch(`${API_CONFIG.PHARMACY_BASE}/statistics/medicines`, {
        headers: getAuthHeaders()
      });
      
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setMedicineStats(stats);
      }

      // Load expiry alerts for breakdown
      const expiryRes = await fetch(`${API_CONFIG.PHARMACY_BASE}/expiry-alerts?days=90`, {
        headers: getAuthHeaders()
      });
      
      if (expiryRes.ok) {
        const alerts = await expiryRes.json();
        
        // Group by alert level
        const breakdown = [
          { alert_level: 'expired', count: 0, total_quantity: 0, value_at_risk: 0 },
          { alert_level: 'critical', count: 0, total_quantity: 0, value_at_risk: 0 },
          { alert_level: 'warning', count: 0, total_quantity: 0, value_at_risk: 0 },
          { alert_level: 'info', count: 0, total_quantity: 0, value_at_risk: 0 }
        ];

        alerts.forEach((alert: any) => {
          const item = breakdown.find(b => b.alert_level === alert.alert_level);
          if (item) {
            item.count++;
            item.total_quantity += alert.quantity_remaining || 0;
            item.value_at_risk += alert.value_at_risk || 0;
          }
        });

        setExpiryBreakdown(breakdown);
      }

      // Load waste products
      const wasteRes = await fetch(`${API_CONFIG.PHARMACY_BASE}/waste-products`, {
        headers: getAuthHeaders()
      });
      
      if (wasteRes.ok) {
        const waste = await wasteRes.json();
        setWasteData(waste);
        
        const totalWaste = waste.reduce((sum: number, w: any) => sum + (w.value_loss || 0), 0);
        setMedicineStats(prev => ({ ...prev, totalWasteValue: totalWaste }));
      }

      // Load manufacturers for performance chart
      const mfrRes = await fetch(`${API_CONFIG.PHARMACY_BASE}/manufacturers`, {
        headers: getAuthHeaders()
      });
      
      if (mfrRes.ok) {
        const manufacturers = await mfrRes.json();
        
        // Load batches to calculate manufacturer performance
        const batchesRes = await fetch(`${API_CONFIG.PHARMACY_BASE}/batches`, {
          headers: getAuthHeaders()
        });
        
        if (batchesRes.ok) {
          const batches = await batchesRes.json();
          
          const mfrPerformance = manufacturers.map((mfr: any) => {
            const mfrBatches = batches.filter((b: any) => b.manufacturer_id === mfr.id);
            return {
              name: mfr.name,
              productsSupplied: new Set(mfrBatches.map((b: any) => b.product_id)).size,
              totalValue: mfrBatches.reduce((sum: number, b: any) => 
                sum + (parseFloat(b.quantity_remaining || 0) * parseFloat(b.purchase_price || 0)), 0),
              activeProducts: mfrBatches.filter((b: any) => b.is_active && !b.is_expired).length
            };
          }).filter((m: any) => m.totalValue > 0)
            .sort((a: any, b: any) => b.totalValue - a.totalValue);
          
          setManufacturerData(mfrPerformance);
        }
      }

    } catch (error) {
      toast.error("Error loading medicine reports");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      generatedAt: format(new Date(), "dd MMM yyyy HH:mm"),
      period: `${format(new Date(dateRange.from), "dd MMM yyyy")} - ${format(new Date(dateRange.to), "dd MMM yyyy")}`,
      statistics: medicineStats,
      expiryBreakdown,
      topSelling,
      wasteCount: wasteData.length,
      totalWaste: medicineStats.totalWasteValue
    };

    const csvContent = [
      ["Medicine Inventory Report"],
      ["Generated:", format(new Date(), "dd MMM yyyy HH:mm")],
      ["Period:", `${format(new Date(dateRange.from), "dd MMM yyyy")} - ${format(new Date(dateRange.to), "dd MMM yyyy")}`],
      [],
      ["INVENTORY SUMMARY"],
      ["Total Products", medicineStats.totalProducts],
      ["Total Batches", medicineStats.totalBatches],
      ["Stock Value", `$${medicineStats.totalStockValue.toFixed(2)}`],
      ["Expiring Soon", medicineStats.expiringSoon],
      ["Low Stock Items", medicineStats.lowStockItems],
      ["Out of Stock", medicineStats.outOfStock],
      [],
      ["EXPIRY BREAKDOWN"],
      ["Alert Level", "Count", "Quantity", "Value at Risk"],
      ...expiryBreakdown.map(e => [e.alert_level, e.count, e.total_quantity, `$${e.value_at_risk.toFixed(2)}`]),
      [],
      ["WASTE SUMMARY"],
      ["Total Waste Items", wasteData.length],
      ["Total Financial Loss", `$${medicineStats.totalWasteValue.toFixed(2)}`]
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medicine-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Medicine report exported successfully");
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading medicine reports...</div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Products</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{medicineStats.totalProducts}</p>
                  </div>
                  <Pill className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Batches</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{medicineStats.totalBatches}</p>
                  </div>
                  <Package className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Stock Value</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">${medicineStats.totalStockValue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Expiring Soon</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{medicineStats.expiringSoon}</p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-orange-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Low Stock Items</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{medicineStats.lowStockItems}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-yellow-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Out of Stock</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{medicineStats.outOfStock}</p>
                  </div>
                  <Package className="w-12 h-12 text-red-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-rose-200 bg-rose-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Waste Loss</p>
                    <p className="text-3xl font-bold text-rose-600 mt-2">${medicineStats.totalWasteValue.toFixed(2)}</p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-rose-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Avg Stock Level</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{medicineStats.averageStockLevel.toFixed(1)}%</p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-indigo-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expiry Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Expiry Analysis Breakdown
                  </CardTitle>
                  <CardDescription>Medicines expiring in next 90 days grouped by alert level</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert Level</TableHead>
                      <TableHead className="text-right">Item Count</TableHead>
                      <TableHead className="text-right">Total Quantity</TableHead>
                      <TableHead className="text-right">Value at Risk</TableHead>
                      <TableHead className="text-right">% of Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiryBreakdown.map((item) => {
                      const totalValue = expiryBreakdown.reduce((sum, i) => sum + i.value_at_risk, 0);
                      const percentage = totalValue > 0 ? (item.value_at_risk / totalValue * 100) : 0;
                      
                      return (
                        <TableRow key={item.alert_level}>
                          <TableCell>
                            <Badge
                              variant={
                                item.alert_level === 'expired' ? 'destructive' :
                                item.alert_level === 'critical' ? 'destructive' :
                                item.alert_level === 'warning' ? 'default' : 'secondary'
                              }
                              className="capitalize"
                            >
                              {item.alert_level}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.count}</TableCell>
                          <TableCell className="text-right">{item.total_quantity}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            ${item.value_at_risk.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={percentage > 30 ? 'text-red-600 font-bold' : ''}>
                              {percentage.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted font-bold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {expiryBreakdown.reduce((sum, i) => sum + i.count, 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {expiryBreakdown.reduce((sum, i) => sum + i.total_quantity, 0)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ${expiryBreakdown.reduce((sum, i) => sum + i.value_at_risk, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Waste Analysis */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Waste & Loss Analysis
                  </CardTitle>
                  <CardDescription>Recent waste incidents and financial impact</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {wasteData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No waste records in selected period
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card className="border-red-200 bg-red-50/50">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Waste Items</p>
                        <p className="text-2xl font-bold text-red-600">{wasteData.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-orange-200 bg-orange-50/50">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Quantity</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {wasteData.reduce((sum, w) => sum + (w.quantity || 0), 0)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-rose-200 bg-rose-50/50">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Financial Loss</p>
                        <p className="text-2xl font-bold text-rose-600">
                          ${medicineStats.totalWasteValue.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Value Loss</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {wasteData.slice(0, 10).map((waste) => (
                          <TableRow key={waste.id}>
                            <TableCell>{format(new Date(waste.created_at), "dd MMM yyyy")}</TableCell>
                            <TableCell className="font-medium">{waste.product_name || waste.product_id}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{waste.batch_number || waste.batch_id}</Badge>
                            </TableCell>
                            <TableCell className="capitalize">{waste.reason}</TableCell>
                            <TableCell className="text-right">{waste.quantity}</TableCell>
                            <TableCell className="text-right font-medium text-red-600">
                              ${(waste.value_loss || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Manufacturer Performance Chart */}
          {manufacturerData.length > 0 && (
            <ManufacturerPerformanceChart data={manufacturerData} />
          )}

          {/* Export Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={exportReport}>
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

