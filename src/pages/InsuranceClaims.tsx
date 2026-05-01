import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

interface InsuranceClaim {
  id: string;
  claim_number: string;
  sale_id?: string;
  customer_id: string;
  customer_name?: string;
  insurance_provider: string;
  policy_number: string;
  claim_amount: number;
  approved_amount?: number;
  claim_status: "pending" | "approved" | "rejected" | "paid";
  submitted_date: string;
  approval_date?: string;
  payment_date?: string;
  rejection_reason?: string;
  notes?: string;
}

const CLAIMS_ENDPOINT = `${API_CONFIG.API_ROOT}/pharmacy/enhanced/insurance-claims`;

export default function InsuranceClaims() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [claimDialog, setClaimDialog] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [claimForm, setClaimForm] = useState({
    claim_number: "",
    sale_id: "",
    customer_id: "",
    insurance_provider: "",
    policy_number: "",
    claim_amount: 0,
    submitted_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const response = await fetch(CLAIMS_ENDPOINT, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setClaims(data);
      } else {
        toast.error("Failed to load insurance claims");
      }
    } catch (error) {
      logger.error("Error loading claims:", error);
      toast.error("Error loading insurance claims");
    } finally {
      setLoading(false);
    }
  };

  const submitClaim = async () => {
    if (!claimForm.claim_number || !claimForm.customer_id || !claimForm.insurance_provider || !claimForm.policy_number) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(CLAIMS_ENDPOINT, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ...claimForm,
          sale_id: claimForm.sale_id || null,
          notes: claimForm.notes || null,
        }),
      });

      if (response.ok) {
        toast.success("Insurance claim submitted successfully");
        setClaimDialog(false);
        loadClaims();
        resetForm();
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.detail || "Failed to submit claim");
      }
    } catch (error) {
      logger.error("Error submitting claim:", error);
      toast.error("Error submitting insurance claim");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setClaimForm({
      claim_number: "",
      sale_id: "",
      customer_id: "",
      insurance_provider: "",
      policy_number: "",
      claim_amount: 0,
      submitted_date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
  };

  const statistics = {
    total: claims.length,
    pending: claims.filter((c) => c.claim_status === "pending").length,
    approved: claims.filter((c) => c.claim_status === "approved").length,
    rejected: claims.filter((c) => c.claim_status === "rejected").length,
    paid: claims.filter((c) => c.claim_status === "paid").length,
    totalAmount: claims.reduce((sum, c) => sum + c.claim_amount, 0),
    approvedAmount: claims.reduce((sum, c) => sum + (c.approved_amount || 0), 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border border-green-200 flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      case "paid":
        return (
          <Badge className="bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 w-fit">
            <DollarSign className="w-3 h-3" />
            Paid
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredClaims = claims.filter(
    (claim) =>
      claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.insurance_provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.policy_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-sky-600 to-cyan-700 p-8 rounded-2xl border-2 border-cyan-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">Insurance Claims</h1>
              <p className="text-white/90 text-base">Manage and track insurance claim submissions</p>
            </div>
          </div>
          <Button
            onClick={() => { resetForm(); setClaimDialog(true); }}
            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            New Claim
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Claims</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">৳{statistics.totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{statistics.pending}</div>
          </CardContent>
        </Card>
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{statistics.approved}</div>
            <p className="text-xs text-muted-foreground">৳{statistics.approvedAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Paid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{statistics.paid}</div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Insurance Claims</CardTitle>
              <CardDescription>Track submitted claims and their approval status</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by claim, provider, policy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pharmacy-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading...</div>
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-lg font-medium mb-2">No Claims Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Submit your first insurance claim to get started
              </p>
              <Button onClick={() => { resetForm(); setClaimDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Submit Claim
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim Number</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.claim_number}</TableCell>
                      <TableCell>{claim.insurance_provider}</TableCell>
                      <TableCell>{claim.policy_number}</TableCell>
                      <TableCell>
                        ৳{claim.claim_amount.toLocaleString()}
                        {claim.approved_amount != null && (
                          <div className="text-xs text-green-600">
                            Approved: ৳{claim.approved_amount.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.claim_status)}</TableCell>
                      <TableCell>
                        {format(new Date(claim.submitted_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedClaim(claim); setViewDialog(true); }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Claim Dialog */}
      <Dialog open={claimDialog} onOpenChange={setClaimDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Insurance Claim</DialogTitle>
            <DialogDescription>Submit a new insurance claim for a customer purchase</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Claim Number *</Label>
                <Input
                  value={claimForm.claim_number}
                  onChange={(e) => setClaimForm({ ...claimForm, claim_number: e.target.value })}
                  placeholder="CLM-2024-001"
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>Sale ID (optional)</Label>
                <Input
                  value={claimForm.sale_id}
                  onChange={(e) => setClaimForm({ ...claimForm, sale_id: e.target.value })}
                  placeholder="Sale reference"
                  className="pharmacy-input"
                />
              </div>
            </div>

            <div>
              <Label>Customer ID *</Label>
              <Input
                value={claimForm.customer_id}
                onChange={(e) => setClaimForm({ ...claimForm, customer_id: e.target.value })}
                placeholder="Customer ID"
                className="pharmacy-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Insurance Provider *</Label>
                <Input
                  value={claimForm.insurance_provider}
                  onChange={(e) => setClaimForm({ ...claimForm, insurance_provider: e.target.value })}
                  placeholder="e.g., MetLife, Sunlife"
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>Policy Number *</Label>
                <Input
                  value={claimForm.policy_number}
                  onChange={(e) => setClaimForm({ ...claimForm, policy_number: e.target.value })}
                  placeholder="Policy number"
                  className="pharmacy-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Claim Amount (৳) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={claimForm.claim_amount}
                  onChange={(e) => setClaimForm({ ...claimForm, claim_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>Submitted Date *</Label>
                <Input
                  type="date"
                  value={claimForm.submitted_date}
                  onChange={(e) => setClaimForm({ ...claimForm, submitted_date: e.target.value })}
                  className="pharmacy-input"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={claimForm.notes}
                onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialog(false)}>Cancel</Button>
            <Button onClick={submitClaim} disabled={saving}>
              {saving ? "Submitting..." : "Submit Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Claim Dialog */}
      {selectedClaim && (
        <Dialog open={viewDialog} onOpenChange={setViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Claim Details</DialogTitle>
              <DialogDescription>{selectedClaim.claim_number}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedClaim.claim_status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Claim Amount</Label>
                  <p className="font-medium">৳{selectedClaim.claim_amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Insurance Provider</Label>
                  <p className="font-medium">{selectedClaim.insurance_provider}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Policy Number</Label>
                  <p className="font-medium">{selectedClaim.policy_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Submitted Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedClaim.submitted_date), "MMM dd, yyyy")}
                  </p>
                </div>
                {selectedClaim.approved_amount != null && (
                  <div>
                    <Label className="text-muted-foreground">Approved Amount</Label>
                    <p className="font-medium text-green-600">
                      ৳{selectedClaim.approved_amount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedClaim.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedClaim.notes}</p>
                </div>
              )}

              {selectedClaim.rejection_reason && (
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <Label className="text-red-600">Rejection Reason</Label>
                  <p className="text-sm text-red-800 mt-1">{selectedClaim.rejection_reason}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setViewDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
