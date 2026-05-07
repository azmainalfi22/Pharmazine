import { useState, useEffect, useCallback } from "react";
import {
  Building2, ArrowRightLeft, TrendingUp, Package, Plus,
  RefreshCw, CheckCircle, Clock, XCircle, Truck,
  DollarSign, BarChart3, Search, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Branch {
  id: number;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  manager_name?: string;
  is_active: boolean;
  is_head_office?: boolean;
}

interface BranchTransfer {
  id: string;
  from_branch_id: number;
  to_branch_id: number;
  from_branch_name?: string;
  to_branch_name?: string;
  product_id: string;
  product_name?: string;
  requested_qty: number;
  approved_qty?: number;
  status: string;
  requested_by?: string;
  notes?: string;
  requested_at: string;
}

interface BranchPL {
  branch_id: number;
  branch_name: string;
  revenue: number;
  cost: number;
  gross_profit: number;
  margin_pct: number;
  total_orders: number;
}

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    color: "bg-amber-100 text-amber-700",  icon: Clock },
  approved:   { label: "Approved",   color: "bg-blue-100 text-blue-700",    icon: CheckCircle },
  dispatched: { label: "Dispatched", color: "bg-purple-100 text-purple-700",icon: Truck },
  received:   { label: "Received",   color: "bg-green-100 text-green-700",  icon: CheckCircle },
  rejected:   { label: "Rejected",   color: "bg-red-100 text-red-700",      icon: XCircle },
};

const NEXT_STATUS: Record<string, string> = {
  pending: "approved", approved: "dispatched", dispatched: "received",
};

const fmt = (n: number) =>
  `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try { return format(parseISO(d), "dd MMM yyyy"); } catch { return d; }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MultiBranchDashboard() {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transfers, setTransfers] = useState<BranchTransfer[]>([]);
  const [branchPL, setBranchPL] = useState<BranchPL[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newTransferOpen, setNewTransferOpen] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    from_branch_id: "", to_branch_id: "", product_id: "",
    requested_qty: "", notes: "",
  });
  const [plPeriod, setPlPeriod] = useState("30");

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadBranches(), loadTransfers(), loadBranchPL()]);
    setLoading(false);
  }, [plPeriod]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadBranches = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/branches`, { headers: getAuthHeaders() });
      if (r.ok) {
        const data = await r.json();
        setBranches(data);
      }
    } catch (e) { logger.error("loadBranches", e); }
  };

  const loadTransfers = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/branch-transfers`, { headers: getAuthHeaders() });
      if (r.ok) setTransfers(await r.json());
    } catch (e) { logger.error("loadTransfers", e); }
  };

  const loadBranchPL = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/branches/consolidated-pl?days=${plPeriod}`, {
        headers: getAuthHeaders(),
      });
      if (r.ok) setBranchPL(await r.json());
    } catch (e) { logger.error("loadBranchPL", e); }
  };

  const loadProducts = async () => {
    if (products.length > 0) return;
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/products?limit=200`, { headers: getAuthHeaders() });
      if (r.ok) {
        const data = await r.json();
        setProducts(Array.isArray(data) ? data : data.items ?? []);
      }
    } catch (e) { logger.error("loadProducts", e); }
  };

  const submitTransfer = async () => {
    const { from_branch_id, to_branch_id, product_id, requested_qty } = newTransfer;
    if (!from_branch_id || !to_branch_id || !product_id || !requested_qty) {
      toast.error("Fill all required fields"); return;
    }
    if (from_branch_id === to_branch_id) {
      toast.error("Source and destination branches must differ"); return;
    }
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/branch-transfers`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTransfer,
          from_branch_id: parseInt(from_branch_id),
          to_branch_id: parseInt(to_branch_id),
          requested_qty: parseFloat(requested_qty),
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Transfer request created");
      setNewTransferOpen(false);
      setNewTransfer({ from_branch_id: "", to_branch_id: "", product_id: "", requested_qty: "", notes: "" });
      loadTransfers();
    } catch (e) { logger.error("submitTransfer", e); toast.error("Failed to create transfer"); }
  };

  const advanceTransferStatus = async (transfer: BranchTransfer) => {
    const next = NEXT_STATUS[transfer.status];
    if (!next) return;
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/branch-transfers/${transfer.id}/status`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(`Transfer marked as ${next}`);
      loadTransfers();
    } catch (e) { logger.error("advanceStatus", e); toast.error("Failed to update status"); }
  };

  const filteredTransfers = transfers.filter(t => {
    const matchSearch = !searchTerm ||
      (t.from_branch_name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.to_branch_name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.product_name ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = branchPL.reduce((s, b) => s + b.revenue, 0);
  const totalProfit  = branchPL.reduce((s, b) => s + b.gross_profit, 0);
  const totalOrders  = branchPL.reduce((s, b) => s + b.total_orders, 0);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Building2 className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Multi-Branch Dashboard</h1>
            </div>
            <p className="text-teal-100 text-sm">Inter-branch transfers · Consolidated P&L · Branch performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={loadAll} className="gap-1" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              size="sm"
              className="bg-white text-teal-700 hover:bg-teal-50 gap-1"
              onClick={() => { setNewTransferOpen(true); loadProducts(); }}
            >
              <Plus className="w-4 h-4" /> New Transfer
            </Button>
          </div>
        </div>
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: "Active Branches",  value: branches.filter(b => b.is_active).length },
            { label: "Pending Transfers", value: transfers.filter(t => t.status === "pending").length },
            { label: "Total Revenue",    value: fmt(totalRevenue) },
            { label: "Gross Profit",     value: fmt(totalProfit) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/15 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-white/70">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="transfers">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="transfers" className="gap-1">
            <ArrowRightLeft className="w-4 h-4" /> Transfers
          </TabsTrigger>
          <TabsTrigger value="pl" className="gap-1">
            <TrendingUp className="w-4 h-4" /> Consolidated P&L
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-1">
            <Building2 className="w-4 h-4" /> Branches
          </TabsTrigger>
        </TabsList>

        {/* ── Transfers tab ─────────────────────────────────────────────────── */}
        <TabsContent value="transfers" className="space-y-4 mt-4">
          <div className="flex gap-3 items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transfers…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5">
              {["all", "pending", "approved", "dispatched", "received", "rejected"].map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={filterStatus === s ? "default" : "outline"}
                  onClick={() => setFilterStatus(s)}
                  className="capitalize text-xs"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <Card className="pharmacy-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No transfers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransfers.map(t => {
                      const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.pending;
                      const Icon = cfg.icon;
                      const next = NEXT_STATUS[t.status];
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium text-sm">{t.from_branch_name ?? `Branch ${t.from_branch_id}`}</TableCell>
                          <TableCell className="text-sm">{t.to_branch_name ?? `Branch ${t.to_branch_id}`}</TableCell>
                          <TableCell className="text-sm">{t.product_name ?? t.product_id.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm font-mono">{t.requested_qty}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${cfg.color} flex items-center gap-1 w-fit`}>
                              <Icon className="w-3 h-3" /> {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDate(t.requested_at)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{t.requested_by ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            {next && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => advanceTransferStatus(t)}
                                className="text-xs gap-1"
                              >
                                Mark {next} <ChevronRight className="w-3 h-3" />
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

        {/* ── Consolidated P&L tab ──────────────────────────────────────────── */}
        <TabsContent value="pl" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {[
                { v: "7",   l: "7 days" },
                { v: "30",  l: "30 days" },
                { v: "90",  l: "90 days" },
                { v: "365", l: "1 year" },
              ].map(({ v, l }) => (
                <Button
                  key={v}
                  size="sm"
                  variant={plPeriod === v ? "default" : "outline"}
                  onClick={() => { setPlPeriod(v); }}
                  className="text-xs"
                >
                  {l}
                </Button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {totalOrders} orders · {fmt(totalRevenue)} revenue · {fmt(totalProfit)} profit
            </div>
          </div>

          {/* Chart */}
          {branchPL.length > 0 && (
            <Card className="pharmacy-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600" /> Branch Revenue vs Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={branchPL}>
                    <XAxis dataKey="branch_name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="revenue"      name="Revenue"      fill="#0d9488" radius={[3,3,0,0]} />
                    <Bar dataKey="gross_profit" name="Gross Profit" fill="#0891b2" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="pharmacy-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Gross Profit</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchPL.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No P&L data for this period</TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {branchPL.map(b => (
                        <TableRow key={b.branch_id}>
                          <TableCell className="font-medium text-sm">{b.branch_name}</TableCell>
                          <TableCell className="text-right text-sm">{b.total_orders}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(b.revenue)}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">{fmt(b.cost)}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-teal-700">{fmt(b.gross_profit)}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={`text-xs ${b.margin_pct >= 20 ? "bg-green-100 text-green-700" : b.margin_pct >= 10 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                              {b.margin_pct.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals row */}
                      <TableRow className="bg-teal-50 font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{totalOrders}</TableCell>
                        <TableCell className="text-right">{fmt(totalRevenue)}</TableCell>
                        <TableCell className="text-right">{fmt(branchPL.reduce((s,b) => s+b.cost,0))}</TableCell>
                        <TableCell className="text-right text-teal-700">{fmt(totalProfit)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-teal-100 text-teal-700 text-xs">
                            {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0"}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Branches tab ──────────────────────────────────────────────────── */}
        <TabsContent value="branches" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.length === 0 ? (
              <p className="col-span-3 text-center py-8 text-muted-foreground">No branches found</p>
            ) : (
              branches.map(b => (
                <Card key={b.id} className={`pharmacy-card ${!b.is_active ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-teal-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.city ?? b.address ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={b.is_active ? "bg-green-100 text-green-700 text-xs" : "bg-gray-100 text-gray-500 text-xs"}>
                          {b.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {b.is_head_office && (
                          <Badge className="bg-teal-100 text-teal-700 text-xs">HQ</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div><span className="font-medium">Manager:</span> {b.manager_name ?? "—"}</div>
                      <div><span className="font-medium">Phone:</span> {b.phone ?? "—"}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── New Transfer Dialog ──────────────────────────────────────────────── */}
      <Dialog open={newTransferOpen} onOpenChange={setNewTransferOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-teal-600" /> New Inter-Branch Transfer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From Branch</Label>
                <Select
                  value={newTransfer.from_branch_id}
                  onValueChange={v => setNewTransfer(t => ({ ...t, from_branch_id: v }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b.is_active).map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To Branch</Label>
                <Select
                  value={newTransfer.to_branch_id}
                  onValueChange={v => setNewTransfer(t => ({ ...t, to_branch_id: v }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b.is_active && String(b.id) !== newTransfer.from_branch_id).map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Product</Label>
              <Select
                value={newTransfer.product_id}
                onValueChange={v => setNewTransfer(t => ({ ...t, product_id: v }))}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product…" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} (stock: {p.stock_quantity})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number" min="1" className="mt-1" placeholder="e.g. 50"
                value={newTransfer.requested_qty}
                onChange={e => setNewTransfer(t => ({ ...t, requested_qty: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                className="mt-1" placeholder="Reason for transfer…"
                value={newTransfer.notes}
                onChange={e => setNewTransfer(t => ({ ...t, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTransferOpen(false)}>Cancel</Button>
            <Button onClick={submitTransfer} className="bg-teal-600 hover:bg-teal-700 text-white">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
