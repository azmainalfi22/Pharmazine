import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

interface InsuranceClaim {
  id: string;
  claim_number: string;
  sale_id: string;
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

export default function InsuranceClaims() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [claimDialog, setClaimDialog] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(
    null
  );
  const [viewDialog, setViewDialog] = useState(false);

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

  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    totalAmount: 0,
    approvedAmount: 0,
  });

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.API_ROOT}/pharmacy/enhanced/insurance-claims/pending`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setClaims(data);
        calculateStatistics(data);
      }
    } catch (error) {
      logger.error("Error loading claims:", error);
      toast.error("Error loading insurance claims");
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (claimsData: InsuranceClaim[]) => {
    const stats = {
      total: claimsData.length,
      pending: claimsData.filter((c) => c.claim_status === "pending").length,
      approved: claimsData.filter((c) => c.claim_status === "approved").length,
      rejected: claimsData.filter((c) => c.claim_status === "rejected").length,
      paid: claimsData.filter((c) => c.claim_status === "paid").length,
      totalAmount: claimsData.reduce((sum, c) => sum + c.claim_amount, 0),
      approvedAmount: claimsData.reduce(
        (sum, c) => sum + (c.approved_amount || 0),
        0
      ),
    };
    setStatistics(stats);
  };

  const submitClaim = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.API_ROOT}/pharmacy/enhanced/insurance-claims`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(claimForm),
        }
      );

      if (response.ok) {
        toast.success("Insurance claim submitted successfully");
        setClaimDialog(false);
        loadClaims();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to submit claim");
      }
    } catch (error) {
      logger.error("Error submitting claim:", error);
      toast.error("Error submitting insurance claim");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="default"
            className="bg-green-600 flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      case "paid":
        return (
          <Badge
            variant="default"
            className="bg-blue-600 flex items-center gap-1"
          >
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
      claim.insurance_provider
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      claim.policy_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insurance Claims</h1>
          <p className="text-gray-600 mt-1">
            Manage and track insurance claim submissions
          </p>
        </div>
        <Button onClick={() => setClaimDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Claim
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Claims</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.total}</div>
            <p className="text-xs text-gray-500">
              ৳{statistics.totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {statistics.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {statistics.approved}
            </div>
            <p className="text-xs text-gray-500">
              ৳{statistics.approvedAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {statistics.paid}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by claim number, provider, or policy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Claims</CardTitle>
          <CardDescription>
            Track submitted claims and their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClaims.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Claims Yet</p>
              <p className="text-sm">
                Submit your first insurance claim to get started
              </p>
              <Button onClick={() => setClaimDialog(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Submit Claim
              </Button>
            </div>
          ) : (
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
                    <TableCell className="font-medium">
                      {claim.claim_number}
                    </TableCell>
                    <TableCell>{claim.insurance_provider}</TableCell>
                    <TableCell>{claim.policy_number}</TableCell>
                    <TableCell>
                      ৳{claim.claim_amount.toLocaleString()}
                      {claim.approved_amount && (
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
                        onClick={() => {
                          setSelectedClaim(claim);
                          setViewDialog(true);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Submit Claim Dialog */}
      <Dialog open={claimDialog} onOpenChange={setClaimDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Insurance Claim</DialogTitle>
            <DialogDescription>
              Submit a new insurance claim for customer purchase
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Claim Number *</Label>
                <Input
                  value={claimForm.claim_number}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, claim_number: e.target.value })
                  }
                  placeholder="CLM-2024-001"
                />
              </div>
              <div>
                <Label>Sale ID *</Label>
                <Input
                  value={claimForm.sale_id}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, sale_id: e.target.value })
                  }
                  placeholder="Sale reference"
                />
              </div>
            </div>

            <div>
              <Label>Customer ID *</Label>
              <Input
                value={claimForm.customer_id}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, customer_id: e.target.value })
                }
                placeholder="Customer ID"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Insurance Provider *</Label>
                <Input
                  value={claimForm.insurance_provider}
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      insurance_provider: e.target.value,
                    })
                  }
                  placeholder="e.g., MetLife, Sunlife"
                />
              </div>
              <div>
                <Label>Policy Number *</Label>
                <Input
                  value={claimForm.policy_number}
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      policy_number: e.target.value,
                    })
                  }
                  placeholder="Policy number"
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
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      claim_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Submitted Date *</Label>
                <Input
                  type="date"
                  value={claimForm.submitted_date}
                  onChange={(e) =>
                    setClaimForm({
                      ...claimForm,
                      submitted_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={claimForm.notes}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitClaim}>Submit Claim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Claim Dialog */}
      {selectedClaim && (
        <Dialog open={viewDialog} onOpenChange={setViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Claim Details</DialogTitle>
              <DialogDescription>
                {selectedClaim.claim_number}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedClaim.claim_status)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Claim Amount</Label>
                  <p className="font-medium">
                    ৳{selectedClaim.claim_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Insurance Provider</Label>
                  <p className="font-medium">
                    {selectedClaim.insurance_provider}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Policy Number</Label>
                  <p className="font-medium">{selectedClaim.policy_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Submitted Date</Label>
                  <p className="font-medium">
                    {format(
                      new Date(selectedClaim.submitted_date),
                      "MMM dd, yyyy"
                    )}
                  </p>
                </div>
                {selectedClaim.approved_amount && (
                  <div>
                    <Label className="text-gray-600">Approved Amount</Label>
                    <p className="font-medium text-green-600">
                      ৳{selectedClaim.approved_amount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedClaim.notes && (
                <div>
                  <Label className="text-gray-600">Notes</Label>
                  <p className="text-sm">{selectedClaim.notes}</p>
                </div>
              )}

              {selectedClaim.rejection_reason && (
                <div className="p-3 bg-red-50 rounded">
                  <Label className="text-red-600">Rejection Reason</Label>
                  <p className="text-sm text-red-800">
                    {selectedClaim.rejection_reason}
                  </p>
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
