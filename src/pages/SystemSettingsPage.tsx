import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, Database, Shield, Mail, Smartphone, Save } from "lucide-react";
import { toast } from "sonner";

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    // Email Settings
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    adminEmail: '',
    
    // Notification Settings
    lowStockAlertEnabled: true,
    lowStockAlertTimes: ['09:00', '17:00'],
    expiryAlertEnabled: true,
    expiryAlertDays: 90,
    dailySummaryEnabled: true,
    dailySummaryTime: '18:00',
    
    // Auto-Reorder Settings
    autoReorderEnabled: true,
    autoReorderLeadTimeDays: 7,
    autoReorderSafetyStockDays: 7,
    autoReorderMaxStockDays: 60,
    
    // Backup Settings
    backupEnabled: true,
    backupTime: '02:00',
    backupRetentionDays: 30,
    maxBackups: 50,
    
    // SMS Settings
    twilioEnabled: false,
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    
    // Security Settings
    sessionTimeoutMinutes: 30,
    passwordMinLength: 8,
    requireStrongPassword: true,
    enable2FA: false,
  });

  const saveSettings = () => {
    // In production, save to backend
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-gray-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/5 opacity-50" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">System Settings</h1>
            <p className="text-white/90 text-base">Configure notifications, backups, and system preferences</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="backups">
            <Database className="h-4 w-4 mr-2" />
            Backups
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms">
            <Smartphone className="h-4 w-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>Configure automated inventory and sales alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">Send emails when products reach reorder point</p>
                </div>
                <Switch
                  checked={settings.lowStockAlertEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, lowStockAlertEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Expiry Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alert for products expiring within</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.expiryAlertDays}
                    onChange={(e) => setSettings({ ...settings, expiryAlertDays: parseInt(e.target.value) })}
                    className="w-20"
                  />
                  <span className="text-sm">days</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Daily Summary Report</Label>
                  <p className="text-sm text-muted-foreground">End-of-day sales and inventory summary</p>
                </div>
                <Switch
                  checked={settings.dailySummaryEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, dailySummaryEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Auto-Reorder Recommendations</Label>
                  <p className="text-sm text-muted-foreground">Weekly smart reorder suggestions</p>
                </div>
                <Switch
                  checked={settings.autoReorderEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoReorderEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Configuration</CardTitle>
              <CardDescription>Configure automated database backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Automated Backups</Label>
                  <p className="text-sm text-muted-foreground">Daily automatic database backups</p>
                </div>
                <Switch
                  checked={settings.backupEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, backupEnabled: checked })}
                />
              </div>

              <div>
                <Label>Backup Time</Label>
                <Input
                  type="time"
                  value={settings.backupTime}
                  onChange={(e) => setSettings({ ...settings, backupTime: e.target.value })}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground mt-1">Daily backup time (default: 2:00 AM)</p>
              </div>

              <div>
                <Label>Retention Period (days)</Label>
                <Input
                  type="number"
                  value={settings.backupRetentionDays}
                  onChange={(e) => setSettings({ ...settings, backupRetentionDays: parseInt(e.target.value) })}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground mt-1">Keep backups for this many days</p>
              </div>

              <div>
                <Label>Maximum Backups</Label>
                <Input
                  type="number"
                  value={settings.maxBackups}
                  onChange={(e) => setSettings({ ...settings, maxBackups: parseInt(e.target.value) })}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground mt-1">Maximum number of backups to keep</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>SMTP settings for email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SMTP Server</Label>
                  <Input
                    value={settings.smtpServer}
                    onChange={(e) => setSettings({ ...settings, smtpServer: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label>SMTP Port</Label>
                  <Input
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                    placeholder="587"
                  />
                </div>
              </div>

              <div>
                <Label>Email Username</Label>
                <Input
                  value={settings.smtpUsername}
                  onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div>
                <Label>Email Password</Label>
                <Input
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                  placeholder="App password"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  For Gmail: Use App Password, not regular password
                </p>
              </div>

              <div>
                <Label>Admin Email</Label>
                <Input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                  placeholder="admin@yourpharmacy.com"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Receives all system alerts and reports
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Configuration (Twilio)</CardTitle>
              <CardDescription>SMS notifications for customer refill reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-base">Enable SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Requires Twilio account</p>
                </div>
                <Switch
                  checked={settings.twilioEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, twilioEnabled: checked })}
                />
              </div>

              {settings.twilioEnabled && (
                <>
                  <div>
                    <Label>Twilio Account SID</Label>
                    <Input
                      value={settings.twilioAccountSid}
                      onChange={(e) => setSettings({ ...settings, twilioAccountSid: e.target.value })}
                      placeholder="ACxxxxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <Label>Twilio Auth Token</Label>
                    <Input
                      type="password"
                      value={settings.twilioAuthToken}
                      onChange={(e) => setSettings({ ...settings, twilioAuthToken: e.target.value })}
                      placeholder="Auth token"
                    />
                  </div>

                  <div>
                    <Label>Twilio Phone Number</Label>
                    <Input
                      value={settings.twilioPhoneNumber}
                      onChange={(e) => setSettings({ ...settings, twilioPhoneNumber: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Authentication and access control configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) })}
                  className="max-w-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Require Strong Passwords</Label>
                  <p className="text-sm text-muted-foreground">Min 8 chars with uppercase, lowercase, number</p>
                </div>
                <Switch
                  checked={settings.requireStrongPassword}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireStrongPassword: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Two-Factor Authentication (2FA)</Label>
                  <p className="text-sm text-muted-foreground">Require OTP for admin users</p>
                </div>
                <Switch
                  checked={settings.enable2FA}
                  onCheckedChange={(checked) => setSettings({ ...settings, enable2FA: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} className="pharmacy-button">
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}

