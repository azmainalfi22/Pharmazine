import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Database, Download, RefreshCw, Archive, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/integrations/api/client";
import { Badge } from "@/components/ui/badge";

interface Backup {
  filename: string;
  path: string;
  size_mb: number;
  created_at: string;
}

export default function BackupManagementPage() {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBackups();
      setBackups(data.backups || []);
      toast.success(`Found ${data.count} backups`);
    } catch (error) {
      console.error("Error loading backups:", error);
      toast.error("Error loading backups");
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreating(true);
      toast.info("Creating backup... This may take a few minutes");
      
      const data = await apiClient.createBackup();
      toast.success("Backup created successfully!");
      loadBackups();
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("Error creating backup");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 p-8 rounded-2xl border-2 border-purple-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">Backup Management</h1>
              <p className="text-white/90 text-base">Create and manage database backups</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={createBackup}
              disabled={creating}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Archive className={`h-4 w-4 mr-2 ${creating ? 'animate-spin' : ''}`} />
              Create Backup Now
            </Button>
            <Button
              onClick={loadBackups}
              variant="outline"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Automated Backups</h3>
                <p className="text-sm text-green-700 mt-1">
                  Daily backups run automatically at 2:00 AM when scheduler is active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Archive className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Retention Policy</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Backups are kept for 30 days, maximum 50 backups
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-900">Compression</h3>
                <p className="text-sm text-purple-700 mt-1">
                  All backups are compressed with gzip to save space
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>All available database backups</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Backups Found</h3>
              <p className="text-muted-foreground mb-4">Create your first backup to protect your data</p>
              <Button onClick={createBackup} disabled={creating}>
                <Archive className="h-4 w-4 mr-2" />
                Create First Backup
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Size (MB)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup, index) => (
                    <TableRow key={backup.filename}>
                      <TableCell className="font-mono text-sm">{backup.filename}</TableCell>
                      <TableCell>{backup.created_at}</TableCell>
                      <TableCell className="text-right">{backup.size_mb}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Valid
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-900">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-yellow-900">
            <p><strong>1. Install PostgreSQL Tools:</strong></p>
            <pre className="bg-yellow-100 p-2 rounded">sudo apt-get install postgresql-client</pre>
            
            <p><strong>2. Start the Scheduler (for automated backups):</strong></p>
            <pre className="bg-yellow-100 p-2 rounded">cd backend && python scheduler.py</pre>
            
            <p><strong>3. Manual Backup:</strong> Use the "Create Backup Now" button above</p>
            
            <p><strong>4. Restore from Backup:</strong></p>
            <pre className="bg-yellow-100 p-2 rounded">cd backend && python -c "from backup_system import BackupSystem; BackupSystem().restore_backup('path/to/backup.sql.gz')"</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

