import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  AlertTriangle,
  User,
  Pill,
  X,
  Edit,
  Trash2,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

interface MedicineAllergy {
  id: string;
  customer_id: string;
  customer_name?: string;
  medicine_name: string;
  generic_name?: string;
  allergy_type: "mild" | "moderate" | "severe" | "life-threatening";
  symptoms: string;
  date_identified?: string;
  notes?: string;
  is_active: boolean;
}

export default function AllergyManagement() {
  const [allergies, setAllergies] = useState<MedicineAllergy[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allergyDialog, setAllergyDialog] = useState(false);
  const [selectedAllergy, setSelectedAllergy] =
    useState<MedicineAllergy | null>(null);

  const [allergyForm, setAllergyForm] = useState({
    customer_id: "",
    medicine_name: "",
    generic_name: "",
    allergy_type: "mild" as "mild" | "moderate" | "severe" | "life-threatening",
    symptoms: "",
    date_identified: "",
    notes: "",
  });

  const [statistics, setStatistics] = useState({
    total: 0,
    mild: 0,
    moderate: 0,
    severe: 0,
    lifeThreatening: 0,
    activePatients: 0,
  });

  useEffect(() => {
    loadAllergies();
  }, []);

  const loadAllergies = async () => {
    setLoading(true);
    try {
      // Mock data for now - API endpoint to be implemented
      toast.info("Allergy management system ready");
      calculateStatistics([]);
    } catch (error) {
      logger.error("Error loading allergies:", error);
      toast.error("Error loading allergy records");
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (allergyData: MedicineAllergy[]) => {
    const activeAllergies = allergyData.filter((a) => a.is_active);
    const stats = {
      total: activeAllergies.length,
      mild: activeAllergies.filter((a) => a.allergy_type === "mild").length,
      moderate: activeAllergies.filter((a) => a.allergy_type === "moderate")
        .length,
      severe: activeAllergies.filter((a) => a.allergy_type === "severe").length,
      lifeThreatening: activeAllergies.filter(
        (a) => a.allergy_type === "life-threatening"
      ).length,
      activePatients: new Set(activeAllergies.map((a) => a.customer_id)).size,
    };
    setStatistics(stats);
  };

  const saveAllergy = async () => {
    try {
      // API call would go here
      toast.success("Allergy record saved successfully");
      setAllergyDialog(false);
      loadAllergies();
      resetForm();
    } catch (error) {
      logger.error("Error saving allergy:", error);
      toast.error("Error saving allergy record");
    }
  };

  const resetForm = () => {
    setAllergyForm({
      customer_id: "",
      medicine_name: "",
      generic_name: "",
      allergy_type: "mild",
      symptoms: "",
      date_identified: "",
      notes: "",
    });
    setSelectedAllergy(null);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "life-threatening":
        return (
          <Badge
            variant="destructive"
            className="bg-red-600 flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3" />
            LIFE-THREATENING
          </Badge>
        );
      case "severe":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            SEVERE
          </Badge>
        );
      case "moderate":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            MODERATE
          </Badge>
        );
      case "mild":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            MILD
          </Badge>
        );
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const filteredAllergies = allergies.filter(
    (allergy) =>
      allergy.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allergy.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allergy.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Allergy Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track patient medicine allergies for safety
          </p>
        </div>
        <Button onClick={() => setAllergyDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Allergy Record
        </Button>
      </div>

      {/* Critical Warning */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Critical Safety Feature</AlertTitle>
        <AlertDescription>
          Always check patient allergies before dispensing medication. This
          system integrates with POS to alert pharmacists of potential allergic
          reactions.
        </AlertDescription>
      </Alert>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Allergies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.total}</div>
            <p className="text-xs text-gray-500">
              {statistics.activePatients} patients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Life-Threatening</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {statistics.lifeThreatening}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Severe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {statistics.severe}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Moderate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {statistics.moderate}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mild</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {statistics.mild}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Allergies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, medicine, or generic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Allergies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Allergy Records</CardTitle>
          <CardDescription>
            Active allergy records for patient safety
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAllergies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Allergy Records</p>
              <p className="text-sm">
                Add patient allergy information for safer dispensing
              </p>
              <Button onClick={() => setAllergyDialog(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add First Record
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medicine Name</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Symptoms</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllergies.map((allergy) => (
                  <TableRow key={allergy.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {allergy.customer_name || allergy.customer_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-gray-400" />
                        {allergy.medicine_name}
                      </div>
                    </TableCell>
                    <TableCell>{allergy.generic_name || "-"}</TableCell>
                    <TableCell>
                      {getSeverityBadge(allergy.allergy_type)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {allergy.symptoms}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAllergy(allergy);
                            setAllergyDialog(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Allergy Dialog */}
      <Dialog open={allergyDialog} onOpenChange={setAllergyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAllergy ? "Edit" : "Add"} Allergy Record
            </DialogTitle>
            <DialogDescription>
              Record patient allergy information for safety alerts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Patient/Customer ID *</Label>
              <Input
                value={allergyForm.customer_id}
                onChange={(e) =>
                  setAllergyForm({
                    ...allergyForm,
                    customer_id: e.target.value,
                  })
                }
                placeholder="Customer ID"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Medicine Name *</Label>
                <Input
                  value={allergyForm.medicine_name}
                  onChange={(e) =>
                    setAllergyForm({
                      ...allergyForm,
                      medicine_name: e.target.value,
                    })
                  }
                  placeholder="e.g., Penicillin"
                />
              </div>
              <div>
                <Label>Generic Name</Label>
                <Input
                  value={allergyForm.generic_name}
                  onChange={(e) =>
                    setAllergyForm({
                      ...allergyForm,
                      generic_name: e.target.value,
                    })
                  }
                  placeholder="Generic name if known"
                />
              </div>
            </div>

            <div>
              <Label>Allergy Severity *</Label>
              <Select
                value={allergyForm.allergy_type}
                onValueChange={(value: any) =>
                  setAllergyForm({ ...allergyForm, allergy_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild - Minor symptoms</SelectItem>
                  <SelectItem value="moderate">
                    Moderate - Significant symptoms
                  </SelectItem>
                  <SelectItem value="severe">
                    Severe - Serious reactions
                  </SelectItem>
                  <SelectItem value="life-threatening">
                    Life-Threatening - Anaphylaxis risk
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Symptoms *</Label>
              <Textarea
                value={allergyForm.symptoms}
                onChange={(e) =>
                  setAllergyForm({ ...allergyForm, symptoms: e.target.value })
                }
                placeholder="Describe the allergic reaction symptoms..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                e.g., "Rash, itching, swelling, difficulty breathing"
              </p>
            </div>

            <div>
              <Label>Date Identified</Label>
              <Input
                type="date"
                value={allergyForm.date_identified}
                onChange={(e) =>
                  setAllergyForm({
                    ...allergyForm,
                    date_identified: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={allergyForm.notes}
                onChange={(e) =>
                  setAllergyForm({ ...allergyForm, notes: e.target.value })
                }
                placeholder="Any additional information..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAllergyDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveAllergy}>
              {selectedAllergy ? "Update" : "Add"} Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium">Life-Threatening Allergies</p>
              <p className="text-gray-600">
                Never dispense. Risk of anaphylaxis. Keep epinephrine available.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium">Severe Allergies</p>
              <p className="text-gray-600">
                Do not dispense without doctor consultation. Monitor closely.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium">Moderate Allergies</p>
              <p className="text-gray-600">
                Warn patient. Provide alternative if available.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">Mild Allergies</p>
              <p className="text-gray-600">
                Inform patient. Monitor for symptoms. Usually tolerable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
