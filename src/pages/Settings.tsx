import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Building2, Bell, Shield, Database } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const [settings, setSettings] = useState({
    companyName: "Sharkar Pharmacy",
    email: "contact@sharkarpharmacy.com",
    phone: "+880 1234567890",
    address: "Dhaka, Bangladesh",
    taxId: "BIN-123456789",
    currency: "BDT",
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    expiryAlerts: true,
    autoBackup: true
  });

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Prominent Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-600 via-slate-600 to-gray-700 p-8 rounded-2xl border-2 border-gray-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <SettingsIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">
                Settings
              </h1>
              <p className="text-white/90 text-base">
                Configure your system preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="company"><Building2 className="w-4 h-4 mr-2" />Company</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-2" />Security</TabsTrigger>
          <TabsTrigger value="database"><Database className="w-4 h-4 mr-2" />Database</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Tax ID</Label>
                  <Input
                    value={settings.taxId}
                    onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                    className="pharmacy-input"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="pharmacy-input"
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="pharmacy-input"
                  />
                </div>
              </div>
              <Button className="pharmacy-button" onClick={handleSave}>
                Save Company Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive alerts via email</div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">SMS Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive alerts via SMS</div>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Low Stock Alerts</div>
                  <div className="text-sm text-muted-foreground">Alert when stock falls below threshold</div>
                </div>
                <Switch
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, lowStockAlerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Expiry Alerts</div>
                  <div className="text-sm text-muted-foreground">Alert for expiring medicines</div>
                </div>
                <Switch
                  checked={settings.expiryAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, expiryAlerts: checked })}
                />
              </div>
              <Button className="pharmacy-button" onClick={handleSave}>
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage security and access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Change Password</Label>
                <Input type="password" placeholder="New password" className="pharmacy-input" />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input type="password" placeholder="Confirm password" className="pharmacy-input" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                </div>
                <Badge variant="secondary">Not Configured</Badge>
              </div>
              <Button className="pharmacy-button" onClick={handleSave}>
                Update Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle>Database & Backup</CardTitle>
              <CardDescription>Manage database operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Automatic Backup</div>
                  <div className="text-sm text-muted-foreground">Daily database backups</div>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoBackup: checked })}
                />
              </div>
              <div className="flex gap-4 pt-4 border-t">
                <Button className="pharmacy-button">
                  Create Backup Now
                </Button>
                <Button variant="outline">
                  Restore from Backup
                </Button>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> Database backups are automatically created daily at 2:00 AM.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
