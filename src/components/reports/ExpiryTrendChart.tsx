import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExpiryTrendData {
  month: string;
  expired: number;
  expiringSoon: number;
  totalValue: number;
}

interface ExpiryTrendChartProps {
  data: ExpiryTrendData[];
}

export default function ExpiryTrendChart({ data }: ExpiryTrendChartProps) {
  const maxValue = Math.max(...data.map(d => d.expired + d.expiringSoon));

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-orange-600" />
          Expiry Trend Analysis
        </CardTitle>
        <CardDescription>Monthly expiry and near-expiry tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((month, idx) => {
            const total = month.expired + month.expiringSoon;
            const percentage = maxValue > 0 ? (total / maxValue * 100) : 0;
            
            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{month.month}</span>
                  <div className="flex gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {month.expired} Expired
                    </Badge>
                    <Badge variant="default" className="text-xs">
                      {month.expiringSoon} Near Expiry
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-xs font-bold text-red-600 min-w-[80px] text-right">
                    ${month.totalValue.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}



