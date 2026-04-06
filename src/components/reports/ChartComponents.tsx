import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string }[];
  title: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function SimpleBarChart({ data, title, valuePrefix = "", valueSuffix = "" }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="font-bold">{valuePrefix}{item.value}{valueSuffix}</span>
              </div>
              <Progress 
                value={(item.value / maxValue) * 100} 
                className="h-2"
                style={{ 
                  backgroundColor: 'hsl(var(--muted))',
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface PieChartDataProps {
  data: { label: string; value: number; color: string }[];
  title: string;
}

export function SimplePieChart({ data, title }: PieChartDataProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, idx) => {
            const percentage = total > 0 ? (item.value / total * 100) : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="font-bold">{percentage.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={percentage} 
                    className="h-2 flex-1"
                  />
                  <span className="text-xs text-muted-foreground">${item.value.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface TrendChartProps {
  data: { date: string; value: number }[];
  title: string;
  color?: string;
}

export function SimpleTrendChart({ data, title, color = "hsl(var(--primary))" }: TrendChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, idx) => {
            const normalizedValue = range > 0 ? ((item.value - minValue) / range) * 100 : 50;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.date}</span>
                  <span className="font-bold">${item.value.toFixed(2)}</span>
                </div>
                <Progress value={normalizedValue} className="h-1" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

export function MetricCard({ title, value, change, icon, color = "primary" }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {change !== undefined && (
              <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs last period
              </p>
            )}
          </div>
          <div className="opacity-20">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



