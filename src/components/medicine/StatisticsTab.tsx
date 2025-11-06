import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Package, DollarSign, Calendar, Activity, Pill, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { toast } from "sonner";

interface MedicineStatistics {
  total_products: number;
  total_batches: number;
  total_stock_value: number;
  expiring_soon: number;
  low_stock_items: number;
  out_of_stock: number;
  total_manufacturers: number;
  average_stock_level: number;
}

interface ManufacturerStatistics {
  total_manufacturers: number;
  active_manufacturers: number;
  total_products_supplied: number;
  total_credit_limit: number;
  total_outstanding_balance: number;
}

export default function StatisticsTab() {
  const [loading, setLoading] = useState(false);
  const [medicineStats, setMedicineStats] = useState<MedicineStatistics>({
    total_products: 0,
    total_batches: 0,
    total_stock_value: 0,
    expiring_soon: 0,
    low_stock_items: 0,
    out_of_stock: 0,
    total_manufacturers: 0,
    average_stock_level: 0
  });
  const [manufacturerStats, setManufacturerStats] = useState<ManufacturerStatistics>({
    total_manufacturers: 0,
    active_manufacturers: 0,
    total_products_supplied: 0,
    total_credit_limit: 0,
    total_outstanding_balance: 0
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [medicineRes, manufacturerRes] = await Promise.all([
        fetch(`${API_CONFIG.PHARMACY_BASE}/statistics/medicines`, {
          headers: getAuthHeaders()
        }),
        fetch(`${API_CONFIG.PHARMACY_BASE}/statistics/manufacturers`, {
          headers: getAuthHeaders()
        })
      ]);

      if (medicineRes.ok) {
        const data = await medicineRes.json();
        setMedicineStats(data);
      }

      if (manufacturerRes.ok) {
        const data = await manufacturerRes.json();
        setManufacturerStats(data);
      }
    } catch (error) {
      toast.error("Error loading statistics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const healthScore = () => {
    const maxScore = 100;
    let score = maxScore;
    
    // Deduct points for issues
    if (medicineStats.expiring_soon > 0) score -= (medicineStats.expiring_soon * 2);
    if (medicineStats.low_stock_items > 0) score -= (medicineStats.low_stock_items * 3);
    if (medicineStats.out_of_stock > 0) score -= (medicineStats.out_of_stock * 5);
    
    return Math.max(0, Math.min(maxScore, score));
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const score = healthScore();

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading statistics...</div>
      ) : (
        <>
          {/* Inventory Health Score */}
          <Card className="pharmacy-card border-2 border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Inventory Health Score
              </CardTitle>
              <CardDescription>Overall inventory performance and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold">
                    <span className={getHealthColor(score)}>{score}</span>
                    <span className="text-muted-foreground text-2xl">/100</span>
                  </span>
                  <Badge className={`text-lg px-4 py-2 ${getHealthColor(score)}`}>
                    {getHealthStatus(score)}
                  </Badge>
                </div>
                <Progress value={score} className="h-3" />
                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground pt-4 border-t">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span>Expiring Soon</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 mt-1">
                      {medicineStats.expiring_soon}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-yellow-600" />
                      <span>Low Stock</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600 mt-1">
                      {medicineStats.low_stock_items}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-red-600" />
                      <span>Out of Stock</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600 mt-1">
                      {medicineStats.out_of_stock}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medicine Statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Medicine Inventory Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="pharmacy-stat-card border-blue-200 bg-blue-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Products</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {medicineStats.total_products}
                      </p>
                    </div>
                    <Package className="w-12 h-12 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="pharmacy-stat-card border-purple-200 bg-purple-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Batches</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">
                        {medicineStats.total_batches}
                      </p>
                    </div>
                    <BarChart3 className="w-12 h-12 text-purple-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="pharmacy-stat-card border-green-200 bg-green-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Stock Value</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        ${medicineStats.total_stock_value.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="pharmacy-stat-card border-indigo-200 bg-indigo-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Avg Stock Level</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-2">
                        {medicineStats.average_stock_level.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-indigo-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Manufacturer Statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Manufacturer Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="pharmacy-stat-card border-cyan-200 bg-cyan-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Manufacturers</p>
                      <p className="text-3xl font-bold text-cyan-600 mt-2">
                        {manufacturerStats.total_manufacturers}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {manufacturerStats.active_manufacturers} active
                      </p>
                    </div>
                    <Building2 className="w-12 h-12 text-cyan-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="pharmacy-stat-card border-pink-200 bg-pink-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Products Supplied</p>
                      <p className="text-3xl font-bold text-pink-600 mt-2">
                        {manufacturerStats.total_products_supplied}
                      </p>
                    </div>
                    <Package className="w-12 h-12 text-pink-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="pharmacy-stat-card border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Credit Limit</p>
                      <p className="text-3xl font-bold text-emerald-600 mt-2">
                        ${manufacturerStats.total_credit_limit.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-emerald-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="pharmacy-stat-card border-amber-200 bg-amber-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Outstanding Balance</p>
                      <p className="text-3xl font-bold text-amber-600 mt-2">
                        ${manufacturerStats.total_outstanding_balance.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-amber-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


