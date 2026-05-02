import { useState, useEffect, useCallback } from "react";
import {
  Bell, Mail, Send, CheckCircle, AlertTriangle, MessageSquare,
  RefreshCw, Trash2, CheckCheck, Settings, Phone, Clock,
  Package, TrendingDown, Info, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { apiClient } from "@/integrations/api/client";
import { logger } from "@/utils/logger";
import { cn } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AppNotification {
  id: string;
  title: string;
  body?: string;
  type: string;
  category: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

interface SmsLog {
  id: string;
  phone_number: string;
  message: string;
  type: string;
  status: string;
  provider: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

interface NotifPrefs {
  expiry_alerts: boolean;
  low_stock_alerts: boolean;
  order_alerts: boolean;
  sms_enabled: boolean;
  sms_phone: string;
  email_enabled: boolean;
  digest_hour: number;
}

const TYPE_COLOR: Record<string, string> = {
  warning: "bg-amber-100 text-amber-700",
  error:   "bg-red-100 text-red-700",
  success: "bg-green-100 text-green-700",
  alert:   "bg-orange-100 text-orange-700",
  info:    "bg-blue-100 text-blue-700",
};

const CAT_ICON: Record<string, React.ElementType> = {
  expiry:    Clock,
  low_stock: TrendingDown,
  order:     Package,
  system:    Settings,
  sms:       MessageSquare,
  general:   Info,
};

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try { return format(parseISO(d), "dd MMM yyyy HH:mm"); } catch { return d; }
};

const SMS_STATUS_COLOR: Record<string, string> = {
  sent:       "bg-green-100 text-green-700",
  pending:    "bg-amber-100 text-amber-700",
  failed:     "bg-red-100 text-red-700",
  simulated:  "bg-purple-100 text-purple-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [prefs, setPrefs] = useState<NotifPrefs>({
    expiry_alerts: true, low_stock_alerts: true, order_alerts: true,
    sms_enabled: false, sms_phone: "", email_enabled: true, digest_hour: 8,
  });
  const [filterType, setFilterType] = useState("all");
  const [smsTestPhone, setSmsTestPhone] = useState("");
  const [smsTestMsg, setSmsTestMsg] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [nr, sr] = await Promise.all([
        fetch(`${API_CONFIG.API_ROOT}/notifications?limit=100`, { headers: getAuthHeaders() }),
        fetch(`${API_CONFIG.API_ROOT}/sms-log?limit=50`, { headers: getAuthHeaders() }),
      ]);
      if (nr.ok) setNotifications(await nr.json());
      if (sr.ok) setSmsLogs(await sr.json());
    } catch (e) { logger.error("NotificationsPage.loadAll", e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Alert triggers (existing apiClient) ─────────────────────────────────
  const triggerAlert = async (type: "low_stock" | "expiry" | "daily") => {
    setLoading(true);
    try {
      if (type === "low_stock") await apiClient.triggerLowStockAlert();
      else if (type === "expiry") await apiClient.triggerExpiryAlert();
      else await apiClient.triggerDailySummary();
      toast.success(`${type.replace("_", " ")} alert triggered`);
      loadAll();
    } catch { toast.error("Failed to trigger alert"); }
    setLoading(false);
  };

  // ── Mark read ────────────────────────────────────────────────────────────
  const markRead = async (id: string) => {
    try {
      await fetch(`${API_CONFIG.API_ROOT}/notifications/${id}/read`, {
        method: "PATCH", headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) { logger.error("markRead", e); }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_CONFIG.API_ROOT}/notifications/read-all`, {
        method: "PATCH", headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed to mark all read"); }
  };

  // ── SMS stub send ────────────────────────────────────────────────────────
  const sendTestSms = async () => {
    if (!smsTestPhone || !smsTestMsg) { toast.error("Enter phone and message"); return; }
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/sms/send`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: smsTestPhone, message: smsTestMsg, type: "general" }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("SMS queued (simulated — no real Twilio configured)");
      setSmsTestPhone(""); setSmsTestMsg("");
      loadAll();
    } catch (e) { logger.error("sendTestSms", e); toast.error("SMS send failed"); }
  };

  // ── Save preferences ─────────────────────────────────────────────────────
  const savePrefs = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/notification-preferences`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Preferences saved");
    } catch (e) { logger.error("savePrefs", e); toast.error("Failed to save"); }
  };

  // ── Filtered notifications ───────────────────────────────────────────────
  const filtered = notifications.filter(n =>
    filterType === "all" ? true :
    filterType === "unread" ? !n.is_read :
    n.category === filterType
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Bell className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Notification Center</h1>
            </div>
            <p className="text-violet-100 text-sm">In-app alerts · SMS stubs · Email triggers · Preferences</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={loadAll} className="gap-1" disabled={loading}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: "Total",   value: notifications.length,                        color: "bg-white/15" },
            { label: "Unread",  value: unreadCount,                                 color: "bg-red-500/30" },
            { label: "SMS Sent",value: smsLogs.filter(s => s.status === "sent" || s.status === "simulated").length, color: "bg-white/15" },
            { label: "SMS Failed", value: smsLogs.filter(s => s.status === "failed").length, color: "bg-red-500/20" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} rounded-lg p-3 text-center`}>
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-white/70">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick triggers */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { type: "low_stock" as const, label: "Low Stock Alert", icon: TrendingDown, color: "bg-red-600 hover:bg-red-700" },
          { type: "expiry" as const, label: "Expiry Alert", icon: Clock, color: "bg-orange-600 hover:bg-orange-700" },
          { type: "daily" as const, label: "Daily Summary", icon: Send, color: "bg-blue-600 hover:bg-blue-700" },
        ].map(({ type, label, icon: Icon, color }) => (
          <Card key={type} className="pharmacy-card">
            <CardContent className="pt-5 pb-5 flex flex-col items-center gap-3">
              <Icon className="w-8 h-8 text-muted-foreground" />
              <p className="font-medium text-sm text-center">{label}</p>
              <Button
                size="sm"
                onClick={() => triggerAlert(type)}
                disabled={loading}
                className={`${color} text-white w-full`}
              >
                Trigger Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="inbox">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="inbox" className="gap-1">
            <Bell className="w-4 h-4" /> Inbox {unreadCount > 0 && <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 ml-1">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-1">
            <MessageSquare className="w-4 h-4" /> SMS Log
          </TabsTrigger>
          <TabsTrigger value="prefs" className="gap-1">
            <Settings className="w-4 h-4" /> Preferences
          </TabsTrigger>
        </TabsList>

        {/* ── Inbox tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="inbox" className="space-y-3 mt-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {["all", "unread", "expiry", "low_stock", "order", "system"].map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={filterType === f ? "default" : "outline"}
                  onClick={() => setFilterType(f)}
                  className="capitalize text-xs"
                >
                  {f.replace("_", " ")}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="ghost" onClick={markAllRead} className="ml-auto gap-1 text-xs">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          </div>

          <Card className="pharmacy-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-6" />
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No notifications
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(n => {
                      const CatIcon = CAT_ICON[n.category] ?? Info;
                      return (
                        <TableRow
                          key={n.id}
                          className={cn(!n.is_read && "bg-primary/5")}
                        >
                          <TableCell>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary block" />}
                          </TableCell>
                          <TableCell>
                            <p className={cn("text-sm", !n.is_read && "font-semibold")}>{n.title}</p>
                            {n.body && <p className="text-xs text-muted-foreground truncate max-w-xs">{n.body}</p>}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${TYPE_COLOR[n.type] ?? "bg-gray-100 text-gray-600"}`}>
                              {n.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CatIcon className="w-3.5 h-3.5" />
                              {n.category}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDate(n.created_at)}</TableCell>
                          <TableCell className="text-right">
                            {!n.is_read && (
                              <Button size="sm" variant="ghost" onClick={() => markRead(n.id)} className="text-xs gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Read
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SMS tab ───────────────────────────────────────────────────────── */}
        <TabsContent value="sms" className="space-y-4 mt-4">
          {/* Test SMS send */}
          <Card className="pharmacy-card border-violet-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-600" /> Send Test SMS (Simulated)
              </CardTitle>
              <CardDescription className="text-xs">
                No real Twilio configured — messages are logged as "simulated". Add TWILIO_* keys to .env to enable real SMS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    placeholder="+8801XXXXXXXXX"
                    value={smsTestPhone}
                    onChange={e => setSmsTestPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Message</Label>
                  <Input
                    placeholder="Enter message text…"
                    value={smsTestMsg}
                    onChange={e => setSmsTestMsg(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={sendTestSms} size="sm" className="mt-3 gap-1 bg-violet-600 hover:bg-violet-700 text-white">
                <MessageSquare className="w-4 h-4" /> Send SMS
              </Button>
            </CardContent>
          </Card>

          {/* SMS log table */}
          <Card className="pharmacy-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">SMS Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smsLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No SMS records</TableCell></TableRow>
                  ) : (
                    smsLogs.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm font-mono">{s.phone_number}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{s.message}</TableCell>
                        <TableCell>
                          <Badge className="text-xs bg-gray-100 text-gray-700">{s.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${SMS_STATUS_COLOR[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(s.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Preferences tab ──────────────────────────────────────────────── */}
        <TabsContent value="prefs" className="mt-4">
          <Card className="pharmacy-card max-w-lg">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-violet-600" /> Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: "expiry_alerts", label: "Expiry Alerts", desc: "Notify when products approach expiry date" },
                { key: "low_stock_alerts", label: "Low Stock Alerts", desc: "Notify when stock drops below reorder point" },
                { key: "order_alerts", label: "Order Alerts", desc: "Notify on new purchases and status changes" },
                { key: "email_enabled", label: "Email Notifications", desc: "Send alerts via email (requires SMTP config)" },
                { key: "sms_enabled", label: "SMS Notifications", desc: "Send alerts via SMS (requires Twilio config)" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={prefs[key as keyof NotifPrefs] as boolean}
                    onCheckedChange={v => setPrefs(p => ({ ...p, [key]: v }))}
                  />
                </div>
              ))}

              {prefs.sms_enabled && (
                <div>
                  <Label className="text-sm">SMS Phone Number</Label>
                  <Input
                    placeholder="+8801XXXXXXXXX"
                    value={prefs.sms_phone}
                    onChange={e => setPrefs(p => ({ ...p, sms_phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label className="text-sm">Daily Digest Hour (24h)</Label>
                <Input
                  type="number" min={0} max={23}
                  value={prefs.digest_hour}
                  onChange={e => setPrefs(p => ({ ...p, digest_hour: parseInt(e.target.value) || 8 }))}
                  className="mt-1 w-24"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Daily summary sent at {prefs.digest_hour}:00 local time
                </p>
              </div>

              <div className="pt-2 border-t">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs font-semibold text-blue-800">SMTP Configuration</p>
                    <pre className="mt-1 text-[11px] text-blue-700 bg-blue-100 rounded p-2 overflow-x-auto">{`SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your@email.com
SMTP_PASSWORD=app-password
ADMIN_EMAIL=admin@pharmacy.com`}</pre>
                    <p className="text-xs font-semibold text-blue-800 mt-3">Twilio SMS (optional)</p>
                    <pre className="mt-1 text-[11px] text-blue-700 bg-blue-100 rounded p-2 overflow-x-auto">{`TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX`}</pre>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={savePrefs} className="bg-violet-600 hover:bg-violet-700 text-white w-full gap-1">
                <CheckCircle className="w-4 h-4" /> Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
