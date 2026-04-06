import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Building2, Package, DollarSign } from "lucide-react";

interface ManufacturerData {
  name: string;
  productsSupplied: number;
  totalValue: number;
  activeProducts: number;
}

interface ManufacturerPerformanceChartProps {
  data: ManufacturerData[];
}

export default function ManufacturerPerformanceChart({ data }: ManufacturerPerformanceChartProps) {
  const maxValue = Math.max(...data.map(d => d.totalValue));

  return (
    <Card className="border-cyan-200 bg-cyan-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="w-5 h-5 text-cyan-600" />
          Top Manufacturers by Value
        </CardTitle>
        <CardDescription>Manufacturers ranked by inventory value</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 10).map((manufacturer, idx) => {
            const percentage = maxValue > 0 ? (manufacturer.totalValue / maxValue * 100) : 0;
            
            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium">{manufacturer.name}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {manufacturer.productsSupplied}
                    </div>
                    <div className="flex items-center gap-1 font-bold text-cyan-600">
                      <DollarSign className="w-3 h-3" />
                      ${manufacturer.totalValue.toFixed(2)}
                    </div>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}



