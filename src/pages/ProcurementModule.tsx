import { useState, useEffect } from "react";
import {
  Package, ShoppingCart, CheckCircle, XCircle, Clock,
  Truck, DollarSign, Search, RefreshCw, AlertTriangle,
  TrendingUp, ArrowRight, FileText, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface PO {
  id: string;
  invoice_no: string;
  supplier_name?: string;
  date: string;
  total_amount: number;
  payment_status: string;
  po_status: string;
  due_date?: string;
  po_notes?: string;
}

interface SupplierAging {
  supplier_id: string;
  supplier_name: string;
  total_orders: number;
  outstanding: number;
  overdue: number;
  due_30d: number;
  due_31_60d: number;
  due_61_90d: number;
}

interface PriceHistory {
  product_name: string;
  supplier_name: string;
  unit_price: number;
  purchase_date: string;
}

const PO_STATUS_FLOW: Record<string, { next: string; label: string; color: string; icon: React.ElementType }> = {
  draft:    { next: "approved",  label: "Draft",    color: "bg-gray-100 text-gray-700",    icon: FileText },
  approved: { next: "ordered",   label: "Approved", color: "bg-blue-100 text-blue-700",    icon: CheckCircle },
  ordered:  { next: "received",  label: "Ordered",  color: "bg-amber-100 text-amber-700",  icon: Truck },
  received: { next: "paid",      label: "Received", color: "bg-purple-100 text-purple-700",icon: Package },
  paid:     { next: "",          label: "Paid",     color: "bg-green-100 text-green-700",  icon: DollarSign },
  cancelled:{ next: "",          label: "Cancelled",color: "bg-red-100 text-red-700",      icon: XCircle },
};

const fmt = (n: number) =>
  `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProcurementModule() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PO[]>([]);
  const [agingData, setAgingData] = useState<SupplierAging[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadPurchases(), loadAging(), loadPriceHistory()]);
    setLoading(false);
  };

  const loadPurchases = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/purchases`, { headers: getAuthHeaders() });
      if (r.ok) {
        const data = await r.json();
        setPurchases(data);
      }
    } catch (e) { logger.error("purchases", e); }
  };

  const loadAging = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/procurement/aging`, { headers: getAuthHeaders() });
      if (r.ok) setAgingData(await r.json());
    } catch (e) { logger.error("aging", e); }
  };

  const loadPriceHistory = async () => {
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/procurement/price-history`, { headers: getAuthHeaders() });
      if (r.ok) setPriceHistory(await r.json());
    } catch (e) { logger.error("price-history", e); }
  };

  // E1: Advance PO status
  const advanceStatus = async (po: PO) => {
    const next = PO_STATUS_FLOW[po.po_status]?.next;
    if (!next) return;
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/purchases/${po.id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ po_status: next }),
      });
      if (r.ok) {
        setPurchases(ps => ps.map(p => p.id === po.id ? { ...p, po_status: next } : p));
        toast.success(`PO ${po.invoice_no} → ${PO_STATUS_FLOW[next].label}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (e) {
      logger.error("status update", e);
      toast.error("Error updating status");
    }
  };

  const cancelPO = async (po: PO) => {
    if (!confirm(`Cancel PO ${po.invoice_no}?`)) return;
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/purchases/${po.id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ po_status: "cancelled" }),
      });
      if (r.ok) {
        setPurchases(ps => ps.map(p => p.id === po.id ? { ...p, po_status: "cancelled" } : p));
        toast.success("PO cancelled");
      }
    } catch (e) { logger.error("cancel", e); }
  };

  const filtered = purchases.filter(p => {
    const matchSearch = !searchTerm ||
      p.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || p.po_status === filterStatus;
    return matchSearch && matchStatus;
  });

  // KPI summary
  const totalOutstanding = agingData.reduce((s, a) => s + a.outstanding, 0);
  const totalOverdue = agingData.reduce((s, a) => s + a.overdue, 0);
  const pendingOrders = purchases.filter(p => !["paid", "cancelled"].includes(p.po_status)).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-8 rounded-2xl border-2 border-orange-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Procurement</h1>
              <p className="text-white/90 text-sm mt-1">
                PO lifecycle · GRN · 3-way matching · Supplier credit aging · Price comparison
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 text-center">
              <div className="text-xs text-white/70">PENDING</div>
              <div className="text-2xl font-bold text-white">{pendingOrders}</div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 text-center">
              <div className="text-xs text-white/70">OUTSTANDING</div>
              <div className="text-lg font-bold text-white">{fmt(totalOutstanding)}</div>
            </div>
            <div className={`bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border text-center ${totalOverdue > 0 ? "border-red-300/40" : "border-white/20"}`}>
              <div className="text-xs text-white/70">OVERDUE</div>
              <div className={`text-lg font-bold ${totalOverdue > 0 ? "text-red-200" : "text-white"}`}>{fmt(totalOverdue)}</div>
            </div>
            <Button
              variant="outline"
              onClick={loadAll}
              disabled={loading}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="lifecycle">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="lifecycle">PO Lifecycle</TabsTrigger>
          <TabsTrigger value="aging">Supplier Aging</TabsTrigger>
          <TabsTrigger value="pricing">Price Comparison</TabsTrigger>
          <TabsTrigger value="matching">3-Way Match</TabsTrigger>
        </TabsList>

        {/* ── E1: PO Lifecycle ────────────────────────────────────────────── */}
        <TabsContent value="lifecycle" className="space-y-4">
          {/* Lifecycle stages */}
          <div className="flex items-center gap-2 p-4 bg-white rounded-xl border shadow-sm overflow-x-auto">
            {["draft", "approved", "ordered", "received", "paid"].map((stage, i) => {
              const s = PO_STATUS_FLOW[stage];
              const count = purchases.filter(p => p.po_status === stage).length;
              return (
                <div key={stage} className="flex items-center gap-2 flex-shrink-0">
                  <div className={`px-4 py-2 rounded-lg ${s.color} text-sm font-medium flex items-center gap-2`}>
                    <s.icon className="w-4 h-4" />
                    {s.label}
                    {count > 0 && (
                      <span className="bg-white/50 text-current rounded-full px-2 py-0.5 text-xs font-bold">{count}</span>
                    )}
                  </div>
                  {i < 4 && <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice, supplier…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pharmacy-input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 pharmacy-input">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(PO_STATUS_FLOW).map(([key, s]) => (
                  <SelectItem key={key} value={key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PO Table */}
          <Card className="pharmacy-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>PO Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No purchase orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((po) => {
                      const statusInfo = PO_STATUS_FLOW[po.po_status] || PO_STATUS_FLOW.draft;
                      const nextStatus = statusInfo.next;
                      const isOverdue = po.due_date && new Date(po.due_date) < new Date() && po.po_status !== "paid";
                      return (
                        <TableRow key={po.id} className={isOverdue ? "bg-red-50" : ""}>
                          <TableCell className="font-mono text-sm">{po.invoice_no}</TableCell>
                          <TableCell>{po.supplier_name || "—"}</TableCell>
                          <TableCell>{format(new Date(po.date || po.created_at || Date.now()), "dd MMM yyyy")}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(po.total_amount || 0)}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              <statusInfo.icon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={po.payment_status === "paid" ? "default" : "secondary"}>
                              {po.payment_status || "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {po.due_date ? (
                              <span className={isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
                                {isOverdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                                {format(new Date(po.due_date), "dd MMM yyyy")}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {nextStatus && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => advanceStatus(po)}
                                  className="text-xs gap-1"
                                >
                                  → {PO_STATUS_FLOW[nextStatus].label}
                                </Button>
                              )}
                              {!["paid", "cancelled"].includes(po.po_status) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => cancelPO(po)}
                                  className="text-red-600 hover:bg-red-50 text-xs"
                                >
                                  Cancel
                                </Button>
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

        {/* ── E4: Supplier Credit Aging ────────────────────────────────────── */}
        <TabsContent value="aging">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                Supplier Credit Aging
              </CardTitle>
              <CardDescription>Outstanding payables aged by 0-30, 31-60, 61-90 days</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading…
                </div>
              ) : agingData.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No aging data available — supplier credit data loads from purchase orders with due dates</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Total Orders</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right text-red-600">Overdue</TableHead>
                      <TableHead className="text-right text-amber-600">0-30 days</TableHead>
                      <TableHead className="text-right">31-60 days</TableHead>
                      <TableHead className="text-right">61-90 days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agingData.map((a) => (
                      <TableRow key={a.supplier_id}>
                        <TableCell className="font-medium">{a.supplier_name}</TableCell>
                        <TableCell className="text-right">{a.total_orders}</TableCell>
                        <TableCell className="text-right font-bold">{fmt(a.outstanding)}</TableCell>
                        <TableCell className={`text-right ${a.overdue > 0 ? "text-red-600 font-bold" : ""}`}>
                          {a.overdue > 0 && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {fmt(a.overdue)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">{fmt(a.due_30d)}</TableCell>
                        <TableCell className="text-right">{fmt(a.due_31_60d)}</TableCell>
                        <TableCell className="text-right">{fmt(a.due_61_90d)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-gray-50">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{agingData.reduce((s, a) => s + a.total_orders, 0)}</TableCell>
                      <TableCell className="text-right">{fmt(agingData.reduce((s, a) => s + a.outstanding, 0))}</TableCell>
                      <TableCell className="text-right text-red-600">{fmt(agingData.reduce((s, a) => s + a.overdue, 0))}</TableCell>
                      <TableCell className="text-right">{fmt(agingData.reduce((s, a) => s + a.due_30d, 0))}</TableCell>
                      <TableCell className="text-right">{fmt(agingData.reduce((s, a) => s + a.due_31_60d, 0))}</TableCell>
                      <TableCell className="text-right">{fmt(agingData.reduce((s, a) => s + a.due_61_90d, 0))}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── E5: Price Comparison ─────────────────────────────────────────── */}
        <TabsContent value="pricing">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Price Comparison History
              </CardTitle>
              <CardDescription>Compare purchase prices for products across suppliers over time</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading…
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>Price history records are created as purchase orders are received.</p>
                  <p className="text-sm mt-1 text-gray-400">Complete a few POs to build comparison data.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead>Purchase Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceHistory.slice(0, 50).map((ph, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{ph.product_name}</TableCell>
                        <TableCell>{ph.supplier_name}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{fmt(ph.unit_price)}</TableCell>
                        <TableCell>{format(new Date(ph.purchase_date), "dd MMM yyyy")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── E3: 3-Way Matching ───────────────────────────────────────────── */}
        <TabsContent value="matching">
          <ThreeWayMatchPanel purchases={purchases} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── 3-Way Match Panel ────────────────────────────────────────────────────────
function ThreeWayMatchPanel({ purchases }: { purchases: PO[] }) {
  const [selectedPO, setSelectedPO] = useState<string>("");
  const [matchData, setMatchData] = useState<{
    product_name?: string;
    po_qty: number; grn_qty: number; invoice_qty: number;
    po_price: number; grn_price: number; invoice_price: number;
    match_status: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);

  const runMatch = async () => {
    if (!selectedPO) return;
    setLoading(true);
    try {
      const r = await fetch(
        `${API_CONFIG.API_ROOT}/procurement/three-way-match/${selectedPO}`,
        { headers: getAuthHeaders() }
      );
      if (r.ok) {
        setMatchData(await r.json());
      } else {
        toast.error("Failed to run 3-way match");
      }
    } catch (e) {
      logger.error("3-way match", e);
      toast.error("Error running 3-way match");
    } finally {
      setLoading(false);
    }
  };

  const matchColor = (status: string) => {
    if (status === "matched") return "bg-green-100 text-green-700";
    if (status === "matched_with_variance") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <Card className="pharmacy-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-500" />
          3-Way Matching: PO vs GRN vs Invoice
        </CardTitle>
        <CardDescription>
          Verify that purchase order quantities and prices match the GRN and supplier invoice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={selectedPO} onValueChange={setSelectedPO}>
            <SelectTrigger className="pharmacy-input flex-1">
              <SelectValue placeholder="Select a Purchase Order…" />
            </SelectTrigger>
            <SelectContent>
              {purchases.filter(p => p.po_status === "received").map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.invoice_no} — {p.supplier_name} ({new Intl.NumberFormat("en-BD").format(p.total_amount)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={runMatch} disabled={!selectedPO || loading} className="pharmacy-button">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Run Match
          </Button>
        </div>

        {purchases.filter(p => p.po_status === "received").length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            3-way matching is available for POs with status "Received". Advance a PO through the lifecycle to use this feature.
          </div>
        )}

        {matchData.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">PO Qty</TableHead>
                <TableHead className="text-right">GRN Qty</TableHead>
                <TableHead className="text-right">Invoice Qty</TableHead>
                <TableHead className="text-right">PO Price</TableHead>
                <TableHead className="text-right">GRN Price</TableHead>
                <TableHead className="text-right">Inv Price</TableHead>
                <TableHead>Match Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.product_name || "—"}</TableCell>
                  <TableCell className="text-right">{row.po_qty}</TableCell>
                  <TableCell className={`text-right ${row.grn_qty !== row.po_qty ? "text-red-600 font-bold" : ""}`}>
                    {row.grn_qty}
                  </TableCell>
                  <TableCell className={`text-right ${row.invoice_qty !== row.po_qty ? "text-amber-600 font-bold" : ""}`}>
                    {row.invoice_qty}
                  </TableCell>
                  <TableCell className="text-right">{fmt(row.po_price)}</TableCell>
                  <TableCell className={`text-right ${row.grn_price !== row.po_price ? "text-red-600" : ""}`}>
                    {fmt(row.grn_price)}
                  </TableCell>
                  <TableCell className={`text-right ${row.invoice_price !== row.po_price ? "text-amber-600" : ""}`}>
                    {fmt(row.invoice_price)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${matchColor(row.match_status)}`}>
                      {row.match_status.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
