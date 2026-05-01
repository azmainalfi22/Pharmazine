import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  User,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

interface Prescription {
  id: string;
  prescription_number: string;
  customer_id: string;
  customer_name?: string;
  doctor_name?: string;
  doctor_license?: string;
  diagnosis?: string;
  prescription_date: string;
  valid_until?: string;
  refills_allowed: number;
  refills_used: number;
  is_active: boolean;
  notes?: string;
}

const RX_ENDPOINT = `${API_CONFIG.API_ROOT}/pharmacy/enhanced/prescriptions`;

export default function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [prescriptionDialog, setPrescriptionDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [prescriptionForm, setPrescriptionForm] = useState({
    prescription_number: "",
    customer_id: "",
    doctor_name: "",
    doctor_license: "",
    diagnosis: "",
    prescription_date: format(new Date(), "yyyy-MM-dd"),
    valid_until: "",
    refills_allowed: 0,
    notes: "",
  });

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(RX_ENDPOINT, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      } else {
        toast.error("Failed to load prescriptions");
      }
    } catch (error) {
      logger.error("Error loading prescriptions:", error);
      toast.error("Error loading prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const createPrescription = async () => {
    if (!prescriptionForm.prescription_number || !prescriptionForm.customer_id || !prescriptionForm.doctor_name) {
      toast.error("Prescription number, customer ID, and doctor name are required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(RX_ENDPOINT, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ...prescriptionForm,
          valid_until: prescriptionForm.valid_until || null,
          doctor_license: prescriptionForm.doctor_license || null,
          diagnosis: prescriptionForm.diagnosis || null,
          notes: prescriptionForm.notes || null,
        }),
      });

      if (response.ok) {
        toast.success("Prescription created successfully");
        setPrescriptionDialog(false);
        loadPrescriptions();
        resetForm();
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.detail || "Failed to create prescription");
      }
    } catch (error) {
      logger.error("Error creating prescription:", error);
      toast.error("Error creating prescription");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setPrescriptionForm({
      prescription_number: "",
      customer_id: "",
      doctor_name: "",
      doctor_license: "",
      diagnosis: "",
      prescription_date: format(new Date(), "yyyy-MM-dd"),
      valid_until: "",
      refills_allowed: 0,
      notes: "",
    });
  };

  const getStatusBadge = (rx: Prescription) => {
    if (!rx.is_active)
      return <Badge className="bg-gray-100 text-gray-600 border border-gray-200">Inactive</Badge>;

    const today = new Date();
    if (rx.valid_until && new Date(rx.valid_until) < today)
      return <Badge className="bg-red-100 text-red-800 border border-red-200">Expired</Badge>;

    if (rx.refills_used >= rx.refills_allowed && rx.refills_allowed > 0)
      return <Badge className="bg-orange-100 text-orange-800 border border-orange-200">No Refills</Badge>;

    return <Badge className="bg-green-100 text-green-800 border border-green-200">Active</Badge>;
  };

  const filteredPrescriptions = prescriptions.filter(
    (rx) =>
      rx.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: prescriptions.length,
    active: prescriptions.filter((rx) => rx.is_active).length,
    expiring: prescriptions.filter((rx) => {
      if (!rx.valid_until) return false;
      const daysLeft = (new Date(rx.valid_until).getTime() - Date.now()) / 86400000;
      return daysLeft >= 0 && daysLeft <= 30;
    }).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 p-8 rounded-2xl border-2 border-violet-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">Prescription Management</h1>
              <p className="text-white/90 text-base">Digital prescription records with refill tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadPrescriptions}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => { resetForm(); setPrescriptionDialog(true); }}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              New Prescription
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Prescriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Expiring in 30 Days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.expiring}</div>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions Table */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prescription Records</CardTitle>
              <CardDescription>All digital prescription records with refill tracking</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by number, patient, doctor..."
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
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-lg font-medium mb-2">No Prescriptions Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first prescription to get started
              </p>
              <Button onClick={() => { resetForm(); setPrescriptionDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Prescription
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rx Number</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="text-center">Refills</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-mono font-medium text-sm">
                        {rx.prescription_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {rx.customer_name || rx.customer_id}
                        </div>
                      </TableCell>
                      <TableCell>{rx.doctor_name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {format(new Date(rx.prescription_date), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {rx.valid_until
                          ? format(new Date(rx.valid_until), "MMM dd, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{rx.refills_used}</span>
                        <span className="text-muted-foreground">/{rx.refills_allowed}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(rx)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Prescription Dialog */}
      <Dialog open={prescriptionDialog} onOpenChange={setPrescriptionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Prescription</DialogTitle>
            <DialogDescription>Create a new digital prescription record</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prescription Number *</Label>
                <Input
                  value={prescriptionForm.prescription_number}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, prescription_number: e.target.value })}
                  placeholder="RX-2024-001"
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>Customer ID *</Label>
                <Input
                  value={prescriptionForm.customer_id}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, customer_id: e.target.value })}
                  placeholder="Customer ID"
                  className="pharmacy-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Doctor Name *</Label>
                <Input
                  value={prescriptionForm.doctor_name}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctor_name: e.target.value })}
                  placeholder="Dr. John Smith"
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>Doctor License</Label>
                <Input
                  value={prescriptionForm.doctor_license}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctor_license: e.target.value })}
                  placeholder="MD-12345"
                  className="pharmacy-input"
                />
              </div>
            </div>

            <div>
              <Label>Diagnosis</Label>
              <Input
                value={prescriptionForm.diagnosis}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                placeholder="Patient diagnosis"
                className="pharmacy-input"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Prescription Date *</Label>
                <Input
                  type="date"
                  value={prescriptionForm.prescription_date}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, prescription_date: e.target.value })}
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={prescriptionForm.valid_until}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, valid_until: e.target.value })}
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>Refills Allowed</Label>
                <Input
                  type="number"
                  min="0"
                  value={prescriptionForm.refills_allowed}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, refills_allowed: parseInt(e.target.value) || 0 })}
                  className="pharmacy-input"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={prescriptionForm.notes}
                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrescriptionDialog(false)}>Cancel</Button>
            <Button onClick={createPrescription} disabled={saving}>
              {saving ? "Creating..." : "Create Prescription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
