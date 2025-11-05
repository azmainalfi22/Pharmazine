import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Zap, RefreshCw, Database, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/integrations/api/client";

interface PerformanceMetrics {
  slow_queries: Array<{
    function: string;
    duration_ms: number;
    timestamp: string;
  }>;
  slow_api_calls: Array<{
    endpoint: string;
    duration_ms: number;
    timestamp: string;
  }>;
  table_sizes: Array<{
    table: string;
    size: string;
    size_bytes: number;
  }>;
  index_usage: Array<{
    table: string;
    index: string;
    scans: number;
  }>;
  unused_indexes: Array<{
    table: string;
    index: string;
    size: string;
  }>;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSystemPerformance();
      setMetrics(data);
    } catch (error) {
      console.error("Error loading metrics:", error);
      toast.error("Failed to load performance metrics");
    } finally {
      setLoading(false);
    }
  };

  const optimizeDatabase = async () => {
    try {
      setOptimizing(true);
      toast.info("Optimizing database... This may take a moment");
      
      await apiClient.optimizeDatabase();
      toast.success("Database optimized successfully!");
      loadMetrics();
    } catch (error) {
      toast.error("Error optimizing database");
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-yellow-600 via-orange-600 to-yellow-700 p-8 rounded-2xl border-2 border-yellow-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">Performance Monitor</h1>
              <p className="text-white/90 text-base">System performance metrics and optimization</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={optimizeDatabase}
              disabled={optimizing}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <TrendingUp className={`h-4 w-4 mr-2 ${optimizing ? 'animate-spin' : ''}`} />
              Optimize DB
            </Button>
            <Button
              onClick={loadMetrics}
              variant="outline"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {loading || !metrics ? (
        <div className="text-center py-8">Loading metrics...</div>
      ) : (
        <>
          {/* Slow Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Slow Queries</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.slow_queries.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No slow queries detected ✅
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Function</TableHead>
                        <TableHead className="text-right">Duration (ms)</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.slow_queries.map((q, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-sm">{q.function}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={q.duration_ms > 1000 ? 'destructive' : 'secondary'}>
                              {q.duration_ms}ms
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(q.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>Database Table Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.table_sizes.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono">{t.table}</TableCell>
                        <TableCell className="text-right font-medium">{t.size}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Unused Indexes */}
          {metrics.unused_indexes.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-yellow-900">Unused Indexes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800 mb-4">
                  These indexes are never used and can be dropped to save space:
                </p>
                <div className="rounded-md border border-yellow-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>Index Name</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.unused_indexes.map((idx, i) => (
                        <TableRow key={i}>
                          <TableCell>{idx.table}</TableCell>
                          <TableCell className="font-mono text-sm">{idx.index}</TableCell>
                          <TableCell className="text-right">{idx.size}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

