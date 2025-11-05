import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Mail, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/integrations/api/client";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);

  const sendLowStockAlert = async () => {
    setLoading(true);
    try {
      await apiClient.triggerLowStockAlert();
      toast.success("Low stock alerts sent successfully");
    } catch (error) {
      toast.error("Error sending alerts");
    } finally {
      setLoading(false);
    }
  };

  const sendExpiryAlert = async () => {
    setLoading(true);
    try {
      await apiClient.triggerExpiryAlert();
      toast.success("Expiry alerts sent successfully");
    } catch (error) {
      toast.error("Error sending alerts");
    } finally {
      setLoading(false);
    }
  };

  const sendDailySummary = async () => {
    setLoading(true);
    try {
      await apiClient.triggerDailySummary();
      toast.success("Daily summary sent successfully");
    } catch (error) {
      toast.error("Error sending summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 p-8 rounded-2xl border-2 border-green-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Bell className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">Notification Center</h1>
            <p className="text-white/90 text-base">Manage automated email alerts and notifications</p>
          </div>
        </div>
      </div>

      {/* Email Configuration Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Email Configuration Required</h3>
              <p className="text-sm text-blue-700 mt-1">
                Configure SMTP settings in backend/.env file to enable email notifications:
              </p>
              <pre className="bg-blue-100 p-3 rounded mt-2 text-xs">
{`SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@yourpharmacy.com`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Triggers */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Low Stock Alert</CardTitle>
            <CardDescription>Send email alert for products below minimum stock level</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={sendLowStockAlert}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Send Low Stock Alert
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expiry Alert</CardTitle>
            <CardDescription>Send email alert for products expiring within 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={sendExpiryAlert}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Expiry Alert
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Summary</CardTitle>
            <CardDescription>Send daily sales and inventory summary report</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={sendDailySummary}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Daily Summary
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Tasks Info */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Schedule</CardTitle>
          <CardDescription>These notifications run automatically when the scheduler is active</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Checks for products below reorder point</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline">9:00 AM</Badge>
                <Badge variant="outline" className="ml-2">5:00 PM</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Mail className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Expiry Alerts</p>
                  <p className="text-sm text-muted-foreground">Products expiring within 90 days</p>
                </div>
              </div>
              <Badge variant="outline">8:00 AM</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Send className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Daily Summary Report</p>
                  <p className="text-sm text-muted-foreground">Sales, inventory, and alerts summary</p>
                </div>
              </div>
              <Badge variant="outline">6:00 PM</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Database Backup</p>
                  <p className="text-sm text-muted-foreground">Automated daily database backup</p>
                </div>
              </div>
              <Badge variant="outline">2:00 AM</Badge>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-900">
              <strong>Note:</strong> To enable automated scheduling, run the scheduler service:
            </p>
            <pre className="bg-yellow-100 p-2 rounded mt-2 text-xs">
cd backend && python scheduler.py
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

