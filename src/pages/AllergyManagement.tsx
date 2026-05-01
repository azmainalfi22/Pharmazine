import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  AlertTriangle,
  User,
  Pill,
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

const ALLERGY_ENDPOINT = `${API_CONFIG.API_ROOT}/pharmacy/enhanced/allergies`;

export default function AllergyManagement() {
  const [allergies, setAllergies] = useState<MedicineAllergy[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allergyDialog, setAllergyDialog] = useState(false);
  const [selectedAllergy, setSelectedAllergy] = useState<MedicineAllergy | null>(null);
  const [saving, setSaving] = useState(false);

  const [allergyForm, setAllergyForm] = useState({
    customer_id: "",
    medicine_name: "",
    generic_name: "",
    allergy_type: "mild" as "mild" | "moderate" | "severe" | "life-threatening",
    symptoms: "",
    date_identified: "",
    notes: "",
  });

  useEffect(() => {
    loadAllergies();
  }, []);

  const loadAllergies = async () => {
    setLoading(true);
    try {
      const response = await fetch(ALLERGY_ENDPOINT, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setAllergies(data);
      } else {
        toast.error("Failed to load allergy records");
      }
    } catch (error) {
      logger.error("Error loading allergies:", error);
      toast.error("Error loading allergy records");
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setSelectedAllergy(null);
    resetForm();
    setAllergyDialog(true);
  };

  const openEditDialog = (allergy: MedicineAllergy) => {
    setSelectedAllergy(allergy);
    setAllergyForm({
      customer_id: allergy.customer_id,
      medicine_name: allergy.medicine_name,
      generic_name: allergy.generic_name || "",
      allergy_type: allergy.allergy_type,
      symptoms: allergy.symptoms,
      date_identified: allergy.date_identified || "",
      notes: allergy.notes || "",
    });
    setAllergyDialog(true);
  };

  const saveAllergy = async () => {
    if (!allergyForm.customer_id || !allergyForm.medicine_name || !allergyForm.symptoms) {
      toast.error("Customer ID, medicine name, and symptoms are required");
      return;
    }
    setSaving(true);
    try {
      const url = selectedAllergy
        ? `${ALLERGY_ENDPOINT}/${selectedAllergy.id}`
        : ALLERGY_ENDPOINT;
      const method = selectedAllergy ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ...allergyForm,
          date_identified: allergyForm.date_identified || null,
          generic_name: allergyForm.generic_name || null,
          notes: allergyForm.notes || null,
        }),
      });

      if (response.ok) {
        toast.success(selectedAllergy ? "Allergy record updated" : "Allergy record saved");
        setAllergyDialog(false);
        loadAllergies();
        resetForm();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.detail || "Failed to save allergy record");
      }
    } catch (error) {
      logger.error("Error saving allergy:", error);
      toast.error("Error saving allergy record");
    } finally {
      setSaving(false);
    }
  };

  const deleteAllergy = async (id: string) => {
    try {
      const response = await fetch(`${ALLERGY_ENDPOINT}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        toast.success("Allergy record removed");
        setAllergies((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.error("Failed to remove allergy record");
      }
    } catch (error) {
      logger.error("Error deleting allergy:", error);
      toast.error("Error removing allergy record");
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
          <Badge className="bg-red-600 text-white flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            LIFE-THREATENING
          </Badge>
        );
      case "severe":
        return (
          <Badge className="bg-red-500 text-white flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            SEVERE
          </Badge>
        );
      case "moderate":
        return (
          <Badge className="bg-orange-400 text-white flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            MODERATE
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
            MILD
          </Badge>
        );
    }
  };

  const statistics = {
    total: allergies.length,
    mild: allergies.filter((a) => a.allergy_type === "mild").length,
    moderate: allergies.filter((a) => a.allergy_type === "moderate").length,
    severe: allergies.filter((a) => a.allergy_type === "severe").length,
    lifeThreatening: allergies.filter((a) => a.allergy_type === "life-threatening").length,
    activePatients: new Set(allergies.map((a) => a.customer_id)).size,
  };

  const filteredAllergies = allergies.filter(
    (allergy) =>
      allergy.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allergy.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allergy.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Gradient Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-red-700 p-8 rounded-2xl border-2 border-red-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">Allergy Management</h1>
              <p className="text-white/90 text-base">Track patient medicine allergies for safe dispensing</p>
            </div>
          </div>
          <Button
            onClick={openAddDialog}
            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            Add Allergy Record
          </Button>
        </div>
      </div>

      {/* Critical Warning */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Critical Safety Feature</AlertTitle>
        <AlertDescription>
          Always check patient allergies before dispensing medication. This system
          integrates with POS to alert pharmacists of potential allergic reactions.
        </AlertDescription>
      </Alert>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Total Allergies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">{statistics.activePatients} patients</p>
          </CardContent>
        </Card>
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Life-Threatening</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{statistics.lifeThreatening}</div>
          </CardContent>
        </Card>
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Severe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{statistics.severe}</div>
          </CardContent>
        </Card>
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Moderate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{statistics.moderate}</div>
          </CardContent>
        </Card>
        <Card className="pharmacy-card">
          <CardHeader className="pb-2">
            <CardDescription>Mild</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{statistics.mild}</div>
          </CardContent>
        </Card>
      </div>

      {/* Allergies Table */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Patient Allergy Records</CardTitle>
              <CardDescription>Active allergy records for patient safety</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, medicine..."
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
          ) : filteredAllergies.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-lg font-medium mb-2">No Allergy Records</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add patient allergy information for safer dispensing
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Record
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
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
                          <User className="w-4 h-4 text-muted-foreground" />
                          {allergy.customer_name || allergy.customer_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-muted-foreground" />
                          {allergy.medicine_name}
                        </div>
                      </TableCell>
                      <TableCell>{allergy.generic_name || "-"}</TableCell>
                      <TableCell>{getSeverityBadge(allergy.allergy_type)}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {allergy.symptoms}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(allergy)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteAllergy(allergy.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={allergyDialog} onOpenChange={setAllergyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAllergy ? "Edit" : "Add"} Allergy Record</DialogTitle>
            <DialogDescription>
              Record patient allergy information for safety alerts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Patient/Customer ID *</Label>
              <Input
                value={allergyForm.customer_id}
                onChange={(e) => setAllergyForm({ ...allergyForm, customer_id: e.target.value })}
                placeholder="Customer ID"
                className="pharmacy-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Medicine Name *</Label>
                <Input
                  value={allergyForm.medicine_name}
                  onChange={(e) => setAllergyForm({ ...allergyForm, medicine_name: e.target.value })}
                  placeholder="e.g., Penicillin"
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>Generic Name</Label>
                <Input
                  value={allergyForm.generic_name}
                  onChange={(e) => setAllergyForm({ ...allergyForm, generic_name: e.target.value })}
                  placeholder="Generic name if known"
                  className="pharmacy-input"
                />
              </div>
            </div>

            <div>
              <Label>Allergy Severity *</Label>
              <Select
                value={allergyForm.allergy_type}
                onValueChange={(value: "mild" | "moderate" | "severe" | "life-threatening") =>
                  setAllergyForm({ ...allergyForm, allergy_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild — Minor symptoms</SelectItem>
                  <SelectItem value="moderate">Moderate — Significant symptoms</SelectItem>
                  <SelectItem value="severe">Severe — Serious reactions</SelectItem>
                  <SelectItem value="life-threatening">Life-Threatening — Anaphylaxis risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Symptoms *</Label>
              <Textarea
                value={allergyForm.symptoms}
                onChange={(e) => setAllergyForm({ ...allergyForm, symptoms: e.target.value })}
                placeholder='e.g., "Rash, itching, swelling, difficulty breathing"'
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date Identified</Label>
                <Input
                  type="date"
                  value={allergyForm.date_identified}
                  onChange={(e) => setAllergyForm({ ...allergyForm, date_identified: e.target.value })}
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>Additional Notes</Label>
                <Input
                  value={allergyForm.notes}
                  onChange={(e) => setAllergyForm({ ...allergyForm, notes: e.target.value })}
                  placeholder="Any additional information..."
                  className="pharmacy-input"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAllergyDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={saveAllergy} disabled={saving}>
              {saving ? "Saving..." : selectedAllergy ? "Update Record" : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safety Guidelines */}
      <Card className="pharmacy-card">
        <CardHeader>
          <CardTitle>Safety Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            { icon: "text-red-600", label: "Life-Threatening Allergies", desc: "Never dispense. Risk of anaphylaxis. Keep epinephrine available." },
            { icon: "text-orange-600", label: "Severe Allergies", desc: "Do not dispense without doctor consultation. Monitor closely." },
            { icon: "text-yellow-600", label: "Moderate Allergies", desc: "Warn patient. Provide alternative if available." },
            { icon: "text-blue-600", label: "Mild Allergies", desc: "Inform patient. Monitor for symptoms. Usually tolerable." },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 ${icon} mt-0.5 shrink-0`} />
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
