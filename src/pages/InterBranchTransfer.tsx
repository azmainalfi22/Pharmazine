import { useState, useEffect, useCallback } from "react";
import {
  ArrowRightLeft, Building2, Package, Plus, CheckCircle,
  XCircle, Truck, Clock, RefreshCw, Search, TrendingUp,
  DollarSign, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Branch {
  id: number;
  name: string;
  city?: string;
  is_head_office?: boolean;
  is_active?: boolean;
}

interface Transfer {
  id: string;
  from_branch_name: string;
  to_branch_name: string;
  product_name: string;
  requested_qty: number;
  approved_qty?: number;
  status: string;
  requested_by?: string;
  approved_by?: string;
  notes?: string;
  requested_at: string;
}

interface ConsolidatedPL {
  branch_name: string;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin: number;
}

interface BranchStockItem {
  product_name: string;
  branch_name: string;
  quantity: number;
}

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  approved:   "bg-blue-100 text-blue-700",
  dispatched: "bg-purple-100 text-purple-700",
  received:   "bg-green-100 text-green-700",
  rejected:   "bg-red-100 text-red-700",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  pending:    Clock,
  approved:   CheckCircle,
  dispatched: Truck,
  received:   CheckCircle,
  rejected:   XCircle,
};

const fmt = (n: number) =>
  `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try { return format(parseISO(d), "dd MMM yyyy HH:mm"); } catch { return d; }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function InterBranchTransfer() {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [consolidatedPL, setConsolidatedPL] = useState<ConsolidatedPL[]>([]);
  const [branchStock, setBranchStock] = useState<BranchStockItem[]>([]);

  // New transfer dialog
  const [newOpen, setNewOpen] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    from_branch_id: "", to_branch_id: "", product_search: "",
    product_id: "", product_name: "", requested_qty: "", notes: "",
  });
  const [productSuggestions, setProductSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [br, tr, pl, bs] = await Promise.all([
        fetch(`${API_CONFIG.API_ROOT}/branches`, { headers: getAuthHeaders() }),
        fetch(`${API_CONFIG.API_ROOT}/branch-transfers`, { headers: getAuthHeaders() }),
        fetch(`${API_CONFIG.API_ROOT}/reports/consolidated-pl`, { headers: getAuthHeaders() }),
        fetch(`${API_CONFIG.API_ROOT}/branch-stock`, { headers: getAuthHeaders() }),
      ]);
      if (br.ok) setBranches(await br.json());
      if (tr.ok) setTransfers(await tr.json());
      if (pl.ok) setConsolidatedPL(await pl.json());
      if (bs.ok) setBranchStock(await bs.json());
    } catch (e) { logger.error("InterBranchTransfer.loadAll", e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Product search for new transfer
  const searchProducts = async (q: string) => {
    if (q.length < 2) { setProductSuggestions([]); return; }
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/products?search=${encodeURIComponent(q)}&limit=10`, {
        headers: getAuthHeaders(),
      });
      if (r.ok) {
        const data = await r.json();
        setProductSuggestions((data.products ?? data).slice(0, 10));
      }
    } catch (e) { logger.error("searchProducts", e); }
  };

  // Submit new transfer
  const submitTransfer = async () => {
    const { from_branch_id, to_branch_id, product_id, requested_qty } = newTransfer;
    if (!from_branch_id || !to_branch_id || !product_id || !requested_qty) {
      toast.error("Fill all required fields"); return;
    }
    if (from_branch_id === to_branch_id) {
      toast.error("From and To branches must be different"); return;
    }
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/branch-transfers`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          from_branch_id: parseInt(from_branch_id),
          to_branch_id: parseInt(to_branch_id),
          product_id,
          requested_qty: parseFloat(requested_qty),
          notes: newTransfer.notes,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Transfer request submitted");
      setNewOpen(false);
      setNewTransfer({ from_branch_id: "", to_branch_id: "", product_search: "", product_id: "", product_name: "", requested_qty: "", notes: "" });
      setProductSuggestions([]);
      loadAll();
    } catch (e) { logger.error("submitTransfer", e); toast.error("Failed to submit transfer"); }
  };

  // Advance transfer status
  const advanceStatus = async (id: string, action: "approve" | "dispatch" | "receive" | "reject") => {
    const statusMap: Record<string, string> = {
      approve: "approved", dispatch: "dispatched", receive: "received", reject: "rejected",
    };
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/branch-transfers/${id}/status`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusMap[action] }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(`Transfer ${statusMap[action]}`);
      loadAll();
    } catch (e) { logger.error("advanceStatus", e); toast.error("Failed to update status"); }
  };

  const filteredTransfers = transfers.filter(t =>
    filterStatus === "all" ? true : t.status === filterStatus
  );

  const totalRevenue = consolidatedPL.reduce((s, b) => s + b.total_revenue, 0);
  const totalProfit  = consolidatedPL.reduce((s, b) => s + b.gross_profit, 0);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ArrowRightLeft className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Multi-Branch Management</h1>
            </div>
            <p className="text-teal-100 text-sm">Inter-branch transfers · Consolidated P&L · Branch stock overview</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={loadAll} className="gap-1">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button
              size="sm"
              className="bg-white text-teal-700 hover:bg-teal-50 gap-1"
              onClick={() => setNewOpen(true)}
            >
              <Plus className="w-4 h-4" /> New Transfer
            </Button>
          </div>
        </div>
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: "Branches",        value: branches.length,                                    icon: Building2 },
            { label: "Pending Transfers",value: transfers.filter(t => t.status === "pending").length, icon: Clock },
            { label: "Total Revenue",   value: fmt(totalRevenue),                                  icon: DollarSign },
            { label: "Gross Profit",    value: fmt(totalProfit),                                   icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/15 rounded-lg p-3 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <div className="text-lg font-bold">{value}</div>
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
            <BarChart3 className="w-4 h-4" /> Consolidated P&L
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-1">
            <Package className="w-4 h-4" /> Branch Stock
          </TabsTrigger>
        </TabsList>

        {/* ── Transfers tab ─────────────────────────────────────────────────── */}
        <TabsContent value="transfers" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
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
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : filteredTransfers.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No transfers found</TableCell></TableRow>
                  ) : (
                    filteredTransfers.map(t => {
                      const SIcon = STATUS_ICON[t.status] ?? Clock;
                      return (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {t.from_branch_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Building2 className="w-3.5 h-3.5 text-teal-600" />
                              {t.to_branch_name}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{t.product_name}</TableCell>
                          <TableCell className="text-sm">
                            {t.approved_qty ?? t.requested_qty}
                            {t.approved_qty && t.approved_qty !== t.requested_qty && (
                              <span className="text-xs text-muted-foreground ml-1">(req: {t.requested_qty})</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs flex items-center gap-1 w-fit ${STATUS_COLOR[t.status] ?? "bg-gray-100 text-gray-600"}`}>
                              <SIcon className="w-3 h-3" /> {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDate(t.requested_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {t.status === "pending" && (
                                <>
                                  <Button size="sm" variant="outline" className="text-xs text-green-700 border-green-200 hover:bg-green-50" onClick={() => advanceStatus(t.id, "approve")}>Approve</Button>
                                  <Button size="sm" variant="outline" className="text-xs text-red-700 border-red-200 hover:bg-red-50" onClick={() => advanceStatus(t.id, "reject")}>Reject</Button>
                                </>
                              )}
                              {t.status === "approved" && (
                                <Button size="sm" variant="outline" className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50" onClick={() => advanceStatus(t.id, "dispatch")}>Dispatch</Button>
                              )}
                              {t.status === "dispatched" && (
                                <Button size="sm" variant="outline" className="text-xs text-teal-700 border-teal-200 hover:bg-teal-50" onClick={() => advanceStatus(t.id, "receive")}>Mark Received</Button>
                              )}
                            </div>
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
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Revenue",    value: fmt(totalRevenue),                                       color: "from-teal-500 to-cyan-500" },
              { label: "Total COGS",       value: fmt(consolidatedPL.reduce((s, b) => s + b.total_cogs, 0)), color: "from-amber-500 to-orange-500" },
              { label: "Total Gross Profit",value: fmt(totalProfit),                                       color: "from-green-500 to-emerald-500" },
            ].map(({ label, value, color }) => (
              <Card key={label} className="pharmacy-card">
                <CardContent className="pt-5 pb-4">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${color} mb-3`}>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" /> P&L by Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">COGS</TableHead>
                    <TableHead className="text-right">Gross Profit</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidatedPL.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No P&L data available</TableCell></TableRow>
                  ) : (
                    consolidatedPL.map(b => (
                      <TableRow key={b.branch_name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-teal-600" />
                            <span className="font-medium text-sm">{b.branch_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{fmt(b.total_revenue)}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{fmt(b.total_cogs)}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-green-700">{fmt(b.gross_profit)}</TableCell>
                        <TableCell className="text-right text-sm">
                          <span className={b.gross_margin >= 20 ? "text-green-600 font-semibold" : b.gross_margin >= 10 ? "text-amber-600" : "text-red-600"}>
                            {b.gross_margin.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                                style={{ width: `${Math.min(100, (b.total_revenue / (totalRevenue || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {totalRevenue > 0 ? ((b.total_revenue / totalRevenue) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Branch Stock tab ──────────────────────────────────────────────── */}
        <TabsContent value="stock" className="space-y-4 mt-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" /> Stock by Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchStock.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No branch stock data yet</TableCell></TableRow>
                  ) : (
                    branchStock.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{s.product_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.branch_name}</TableCell>
                        <TableCell className="text-right text-sm font-mono">{s.quantity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── New Transfer Dialog ─────────────────────────────────────────────── */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-teal-600" /> New Inter-Branch Transfer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From Branch <span className="text-red-500">*</span></Label>
                <Select value={newTransfer.from_branch_id} onValueChange={v => setNewTransfer(t => ({ ...t, from_branch_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b.is_active !== false).map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To Branch <span className="text-red-500">*</span></Label>
                <Select value={newTransfer.to_branch_id} onValueChange={v => setNewTransfer(t => ({ ...t, to_branch_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b.is_active !== false).map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="relative">
              <Label>Product <span className="text-red-500">*</span></Label>
              <Input
                className="mt-1"
                placeholder="Search product name…"
                value={newTransfer.product_name || newTransfer.product_search}
                onChange={e => {
                  setNewTransfer(t => ({ ...t, product_search: e.target.value, product_id: "", product_name: "" }));
                  searchProducts(e.target.value);
                }}
              />
              {productSuggestions.length > 0 && !newTransfer.product_id && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {productSuggestions.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0"
                      onClick={() => {
                        setNewTransfer(t => ({ ...t, product_id: p.id, product_name: p.name, product_search: p.name }));
                        setProductSuggestions([]);
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Quantity <span className="text-red-500">*</span></Label>
              <Input
                type="number" min="1" className="mt-1" placeholder="Units to transfer"
                value={newTransfer.requested_qty}
                onChange={e => setNewTransfer(t => ({ ...t, requested_qty: e.target.value }))}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                className="mt-1" placeholder="Optional notes…"
                value={newTransfer.notes}
                onChange={e => setNewTransfer(t => ({ ...t, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={submitTransfer} className="bg-teal-600 hover:bg-teal-700 text-white">Submit Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
