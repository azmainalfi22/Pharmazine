import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  User,
  Calendar,
  Pill,
  Check,
  X,
  Download,
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
  doctor_name: string;
  doctor_license?: string;
  diagnosis?: string;
  prescription_date: string;
  valid_until?: string;
  refills_allowed: number;
  refills_used: number;
  is_active: boolean;
  items?: PrescriptionItem[];
}

interface PrescriptionItem {
  id: string;
  product_id: string;
  product_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  quantity_prescribed: number;
  quantity_dispensed: number;
  instructions?: string;
}

export default function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [prescriptionDialog, setPrescriptionDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

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
      // This would load all prescriptions - for now showing empty
      toast.info("Prescription management system ready");
    } catch (error) {
      logger.error("Error loading prescriptions:", error);
      toast.error("Error loading prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const createPrescription = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.API_ROOT}/pharmacy/enhanced/prescriptions`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(prescriptionForm),
        }
      );

      if (response.ok) {
        toast.success("Prescription created successfully");
        setPrescriptionDialog(false);
        loadPrescriptions();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to create prescription");
      }
    } catch (error) {
      logger.error("Error creating prescription:", error);
      toast.error("Error creating prescription");
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Prescription Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage digital prescriptions and refills
          </p>
        </div>
        <Button onClick={() => setPrescriptionDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Prescription
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by prescription number, customer name, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
          <CardDescription>
            Digital prescription records with refill tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Prescriptions Yet</p>
            <p className="text-sm">
              Create your first prescription to get started
            </p>
            <Button
              onClick={() => setPrescriptionDialog(true)}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Prescription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Prescription Dialog */}
      <Dialog open={prescriptionDialog} onOpenChange={setPrescriptionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Prescription</DialogTitle>
            <DialogDescription>
              Create a new digital prescription record
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prescription Number *</Label>
                <Input
                  value={prescriptionForm.prescription_number}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      prescription_number: e.target.value,
                    })
                  }
                  placeholder="RX-2024-001"
                />
              </div>
              <div>
                <Label>Customer ID *</Label>
                <Input
                  value={prescriptionForm.customer_id}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      customer_id: e.target.value,
                    })
                  }
                  placeholder="Customer ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Doctor Name *</Label>
                <Input
                  value={prescriptionForm.doctor_name}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      doctor_name: e.target.value,
                    })
                  }
                  placeholder="Dr. John Smith"
                />
              </div>
              <div>
                <Label>Doctor License</Label>
                <Input
                  value={prescriptionForm.doctor_license}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      doctor_license: e.target.value,
                    })
                  }
                  placeholder="MD-12345"
                />
              </div>
            </div>

            <div>
              <Label>Diagnosis</Label>
              <Input
                value={prescriptionForm.diagnosis}
                onChange={(e) =>
                  setPrescriptionForm({
                    ...prescriptionForm,
                    diagnosis: e.target.value,
                  })
                }
                placeholder="Patient diagnosis"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prescription Date *</Label>
                <Input
                  type="date"
                  value={prescriptionForm.prescription_date}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      prescription_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={prescriptionForm.valid_until}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      valid_until: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Refills Allowed</Label>
              <Input
                type="number"
                min="0"
                value={prescriptionForm.refills_allowed}
                onChange={(e) =>
                  setPrescriptionForm({
                    ...prescriptionForm,
                    refills_allowed: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={prescriptionForm.notes}
                onChange={(e) =>
                  setPrescriptionForm({
                    ...prescriptionForm,
                    notes: e.target.value,
                  })
                }
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPrescriptionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={createPrescription}>Create Prescription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
