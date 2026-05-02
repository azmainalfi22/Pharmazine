import { useState, useEffect, useCallback } from "react";
import {
  Shield, Key, Smartphone, Eye, EyeOff, CheckCircle,
  AlertTriangle, Clock, RefreshCw, Lock, Unlock, User,
  LogIn, LogOut, Settings, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";
import { cn } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface SecurityAuditEntry {
  id: string;
  user_id?: string;
  user_email?: string;
  event_type: string;
  ip_address?: string;
  success: boolean;
  details?: Record<string, unknown>;
  created_at: string;
}

interface TwoFAStatus {
  is_enabled: boolean;
  totp_uri?: string;
  secret?: string;
}

interface RateLimitEntry {
  ip_address: string;
  endpoint: string;
  request_count: number;
  blocked: boolean;
  window_start: string;
}

const EVENT_COLORS: Record<string, string> = {
  login:           "bg-green-100 text-green-700",
  logout:          "bg-gray-100 text-gray-700",
  login_failed:    "bg-red-100 text-red-700",
  "2fa_enabled":   "bg-blue-100 text-blue-700",
  password_change: "bg-amber-100 text-amber-700",
  role_change:     "bg-purple-100 text-purple-700",
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  login:        LogIn,
  logout:       LogOut,
  login_failed: AlertTriangle,
  "2fa_enabled": Shield,
  password_change: Key,
  role_change:  User,
};

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try { return format(parseISO(d), "dd MMM yyyy HH:mm:ss"); } catch { return d; }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [auditLog, setAuditLog] = useState<SecurityAuditEntry[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimitEntry[]>([]);
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFAStatus>({ is_enabled: false });
  const [totpCode, setTotpCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Session settings
  const [sessionTimeout, setSessionTimeout] = useState(480); // minutes
  const [forceHttps, setForceHttps] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ar, rr, tr] = await Promise.all([
        fetch(`${API_CONFIG.API_ROOT}/security/audit-log?limit=100`, { headers: getAuthHeaders() }),
        fetch(`${API_CONFIG.API_ROOT}/security/rate-limits`, { headers: getAuthHeaders() }),
        fetch(`${API_CONFIG.API_ROOT}/security/2fa/status`, { headers: getAuthHeaders() }),
      ]);
      if (ar.ok) setAuditLog(await ar.json());
      if (rr.ok) setRateLimits(await rr.json());
      if (tr.ok) setTwoFAStatus(await tr.json());
    } catch (e) { logger.error("SecurityPage.loadAll", e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── 2FA Enrollment ─────────────────────────────────────────────────────────
  const start2FA = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/security/2fa/setup`, {
        method: "POST", headers: getAuthHeaders(),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setTwoFAStatus(s => ({ ...s, totp_uri: data.totp_uri, secret: data.secret }));
      setEnrolling(true);
    } catch (e) { logger.error("start2FA", e); toast.error("Failed to start 2FA setup"); }
  };

  const verify2FA = async () => {
    if (!totpCode || totpCode.length !== 6) { toast.error("Enter 6-digit code"); return; }
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/security/2fa/verify`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("2FA enabled successfully");
      setEnrolling(false);
      setTotpCode("");
      loadAll();
    } catch (e) { logger.error("verify2FA", e); toast.error("Invalid code — try again"); }
  };

  const disable2FA = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/security/2fa/disable`, {
        method: "POST", headers: getAuthHeaders(),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("2FA disabled");
      setTwoFAStatus({ is_enabled: false });
    } catch (e) { logger.error("disable2FA", e); toast.error("Failed to disable 2FA"); }
  };

  // ── Password change ─────────────────────────────────────────────────────────
  const changePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error("Fill all fields"); return; }
    if (newPassword !== confirmPassword) { toast.error("New passwords don't match"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/security/change-password`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Password changed successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e) { logger.error("changePassword", e); toast.error("Password change failed"); }
  };

  // ── Save session settings ───────────────────────────────────────────────────
  const saveSessionSettings = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/security/session-settings`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ session_timeout: sessionTimeout, force_https: forceHttps, ip_whitelist: ipWhitelist }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Session settings saved");
    } catch (e) { logger.error("saveSessionSettings", e); toast.error("Failed to save"); }
  };

  const failedLogins = auditLog.filter(e => e.event_type === "login_failed").length;
  const blockedIPs   = rateLimits.filter(r => r.blocked).length;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 via-gray-800 to-zinc-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Security Settings</h1>
            </div>
            <p className="text-slate-300 text-sm">2FA · Password · Rate limiting · Audit trail</p>
          </div>
          <Button variant="secondary" size="sm" onClick={loadAll} className="gap-1" disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
          </Button>
        </div>
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: "2FA Status",      value: twoFAStatus.is_enabled ? "Enabled" : "Disabled", color: twoFAStatus.is_enabled ? "bg-green-500/30" : "bg-red-500/30" },
            { label: "Audit Events",    value: auditLog.length,     color: "bg-white/15" },
            { label: "Failed Logins",   value: failedLogins,        color: failedLogins > 0 ? "bg-red-500/30" : "bg-white/15" },
            { label: "Blocked IPs",     value: blockedIPs,          color: blockedIPs > 0 ? "bg-amber-500/30" : "bg-white/15" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} rounded-lg p-3 text-center`}>
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-white/70">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="2fa">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="2fa" className="gap-1"><Smartphone className="w-4 h-4" /> 2FA</TabsTrigger>
          <TabsTrigger value="password" className="gap-1"><Key className="w-4 h-4" /> Password</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1"><Shield className="w-4 h-4" /> Audit Log</TabsTrigger>
          <TabsTrigger value="ratelimit" className="gap-1"><Lock className="w-4 h-4" /> Rate Limits</TabsTrigger>
        </TabsList>

        {/* ── 2FA tab ───────────────────────────────────────────────────────── */}
        <TabsContent value="2fa" className="mt-4">
          <Card className="pharmacy-card max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-slate-700" /> Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security with TOTP (Google Authenticator, Authy, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Status badge */}
              <div className="flex items-center gap-3 p-4 rounded-xl border">
                {twoFAStatus.is_enabled ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">2FA is Active</p>
                      <p className="text-xs text-muted-foreground">Your account is protected with two-factor authentication</p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-auto text-red-600 border-red-200 hover:bg-red-50" onClick={disable2FA}>
                      Disable
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-700">2FA is Not Enabled</p>
                      <p className="text-xs text-muted-foreground">Enable 2FA for better account security</p>
                    </div>
                    <Button size="sm" onClick={start2FA} className="ml-auto bg-slate-700 hover:bg-slate-800 text-white">
                      Enable 2FA
                    </Button>
                  </>
                )}
              </div>

              {/* Enrollment flow */}
              {enrolling && twoFAStatus.secret && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold">Setup Steps:</p>
                  <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                    <li>Install Google Authenticator or Authy on your phone</li>
                    <li>Scan the QR code or enter the secret key manually</li>
                    <li>Enter the 6-digit code shown in the app to verify</li>
                  </ol>

                  <div>
                    <Label className="text-xs">Secret Key (manual entry)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        readOnly
                        value={showSecret ? twoFAStatus.secret : "••••••••••••••••"}
                        className="font-mono text-sm bg-white"
                      />
                      <Button size="icon" variant="ghost" onClick={() => setShowSecret(s => !s)}>
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      TOTP URI: <span className="font-mono text-xs break-all">{twoFAStatus.totp_uri ?? "—"}</span>
                    </p>
                  </div>

                  <div>
                    <Label>Verification Code <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="000000"
                        maxLength={6}
                        value={totpCode}
                        onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
                        className="font-mono tracking-widest text-center text-lg w-36"
                      />
                      <Button onClick={verify2FA} className="bg-slate-700 hover:bg-slate-800 text-white">
                        Verify & Enable
                      </Button>
                      <Button variant="outline" onClick={() => setEnrolling(false)}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Password tab ──────────────────────────────────────────────────── */}
        <TabsContent value="password" className="mt-4">
          <Card className="pharmacy-card max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-slate-700" /> Change Password
              </CardTitle>
              <CardDescription>Use a strong password with letters, numbers, and symbols</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Current Password", value: currentPassword, setter: setCurrentPassword },
                { label: "New Password", value: newPassword, setter: setNewPassword },
                { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <Label>{label}</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPw ? "text" : "password"}
                      value={value}
                      onChange={e => setter(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Password strength */}
              {newPassword && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Password strength:</p>
                  <div className="flex gap-1">
                    {[8, 12, 16].map(len => (
                      <div
                        key={len}
                        className={`h-1.5 flex-1 rounded-full ${newPassword.length >= len ? (len === 8 ? "bg-red-400" : len === 12 ? "bg-amber-400" : "bg-green-500") : "bg-gray-200"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {newPassword.length < 8 ? "Too short" : newPassword.length < 12 ? "Moderate" : "Strong"}
                  </p>
                </div>
              )}

              <Button onClick={changePassword} className="bg-slate-700 hover:bg-slate-800 text-white w-full gap-1">
                <Key className="w-4 h-4" /> Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Session settings */}
          <Card className="pharmacy-card max-w-lg mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="w-5 h-5 text-slate-700" /> Session & Access Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Force HTTPS</p>
                  <p className="text-xs text-muted-foreground">Redirect all HTTP to HTTPS</p>
                </div>
                <Switch checked={forceHttps} onCheckedChange={setForceHttps} />
              </div>
              <div>
                <Label className="text-sm">Session Timeout (minutes)</Label>
                <Input
                  type="number" min={15} max={10080}
                  value={sessionTimeout}
                  onChange={e => setSessionTimeout(parseInt(e.target.value) || 480)}
                  className="mt-1 w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-logout after {Math.floor(sessionTimeout / 60)}h {sessionTimeout % 60}m of inactivity
                </p>
              </div>
              <div>
                <Label className="text-sm">IP Whitelist (comma-separated, blank = allow all)</Label>
                <Input
                  className="mt-1"
                  placeholder="192.168.1.0/24, 10.0.0.1"
                  value={ipWhitelist}
                  onChange={e => setIpWhitelist(e.target.value)}
                />
              </div>
              <Button onClick={saveSessionSettings} className="bg-slate-700 hover:bg-slate-800 text-white gap-1 w-full">
                <CheckCircle className="w-4 h-4" /> Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Audit Log tab ─────────────────────────────────────────────────── */}
        <TabsContent value="audit" className="mt-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-700" /> Security Audit Log
              </CardTitle>
              <CardDescription>All security-relevant events in your system</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : auditLog.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit events yet</TableCell></TableRow>
                  ) : (
                    auditLog.map(entry => {
                      const EIcon = EVENT_ICONS[entry.event_type] ?? Shield;
                      return (
                        <TableRow key={entry.id} className={!entry.success ? "bg-red-50/50" : undefined}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(entry.created_at)}</TableCell>
                          <TableCell className="text-sm">{entry.user_email ?? "System"}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs flex items-center gap-1 w-fit ${EVENT_COLORS[entry.event_type] ?? "bg-gray-100 text-gray-600"}`}>
                              <EIcon className="w-3 h-3" /> {entry.event_type.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{entry.ip_address ?? "—"}</TableCell>
                          <TableCell>
                            {entry.success
                              ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>
                              : <Badge className="bg-red-100 text-red-700 text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>
                            }
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

        {/* ── Rate Limits tab ───────────────────────────────────────────────── */}
        <TabsContent value="ratelimit" className="mt-4">
          <Card className="pharmacy-card mb-4 border-amber-200 bg-amber-50">
            <CardContent className="pt-4 pb-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Rate Limiting (Backend)</p>
                <p className="text-xs text-amber-700 mt-1">
                  The FastAPI backend uses in-memory counters to limit requests per IP to 100/min on sensitive endpoints.
                  Blocked IPs are listed below. Add <code className="bg-amber-100 px-1 rounded">RATE_LIMIT_ENABLED=true</code> to backend/.env to activate.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-700" /> Rate Limit Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead>Window Start</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateLimits.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No rate limit data</TableCell></TableRow>
                  ) : (
                    rateLimits.map((r, i) => (
                      <TableRow key={i} className={r.blocked ? "bg-red-50/50" : undefined}>
                        <TableCell className="font-mono text-sm">{r.ip_address}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.endpoint}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{r.request_count}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(r.window_start)}</TableCell>
                        <TableCell>
                          {r.blocked
                            ? <Badge className="bg-red-100 text-red-700 text-xs"><Lock className="w-3 h-3 mr-1" />Blocked</Badge>
                            : <Badge className="bg-green-100 text-green-700 text-xs"><Unlock className="w-3 h-3 mr-1" />OK</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
