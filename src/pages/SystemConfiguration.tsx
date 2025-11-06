import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Settings, Save, RefreshCw, Database, 
  Bell, Lock, Printer, Globe 
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'react-hot-toast';

interface SystemConfig {
  id: string;
  config_key: string;
  config_value: string;
  config_type: string;
  category: string;
  description: string;
  is_encrypted: boolean;
  updated_by: string;
  updated_at: string;
}

export default function SystemConfiguration() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadConfigs();
  }, [selectedCategory]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/system/config?category=${selectedCategory}`);
      setConfigs(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load configurations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (configKey: string, newValue: string) => {
    try {
      await api.put(`/api/system/config/${configKey}`, {
        config_value: newValue
      });
      toast.success('Configuration updated');
      setEditingConfig(null);
      loadConfigs();
    } catch (error: any) {
      toast.error('Failed to update configuration');
      console.error(error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      general: Globe,
      backup: Database,
      notification: Bell,
      security: Lock,
      printer: Printer
    };
    return icons[category] || Settings;
  };

  const categories = [
    { value: 'general', label: 'General Settings' },
    { value: 'backup', label: 'Backup Settings' },
    { value: 'notification', label: 'Notification Settings' },
    { value: 'security', label: 'Security Settings' },
    { value: 'printer', label: 'Printer Settings' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Configuration</h1>
          <p className="text-gray-500 mt-1">Manage system settings and preferences</p>
        </div>
        <Button onClick={loadConfigs} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-5 w-full">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.value);
            return (
              <TabsTrigger key={cat.value} value={cat.value} className="gap-2">
                <Icon className="h-4 w-4" />
                {cat.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.value} value={cat.value}>
            <Card>
              <CardHeader>
                <CardTitle>{cat.label}</CardTitle>
                <CardDescription>Configure {cat.label.toLowerCase()} options</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : configs.length > 0 ? (
                  <div className="space-y-4">
                    {configs.map((config) => (
                      <div key={config.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{config.config_key}</h3>
                              <Badge variant="outline" className="text-xs">
                                {config.config_type}
                              </Badge>
                              {config.is_encrypted && (
                                <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Encrypted
                                </Badge>
                              )}
                            </div>
                            {config.description && (
                              <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                            )}
                            {editingConfig === config.config_key ? (
                              <div className="flex gap-2 mt-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder="New value"
                                  className="flex-1"
                                />
                                <Button size="sm" onClick={() => updateConfig(config.config_key, editValue)}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingConfig(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center mt-2">
                                <code className="text-sm bg-gray-100 px-3 py-1 rounded">
                                  {config.is_encrypted ? '***ENCRYPTED***' : config.config_value}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingConfig(config.config_key);
                                    setEditValue(config.config_value);
                                  }}
                                >
                                  Edit
                                </Button>
                              </div>
                            )}
                            {config.updated_by && (
                              <p className="text-xs text-gray-500 mt-2">
                                Last updated: {new Date(config.updated_at).toLocaleString()} by {config.updated_by}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No configurations found for this category
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

