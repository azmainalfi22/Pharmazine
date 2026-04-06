import { useState } from "react";
import { AlertTriangle, Plus, X, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

interface DrugInteraction {
  medicine_a: string;
  medicine_b: string;
  type: string;
  description: string;
  severity: number;
  action: string;
}

export default function DrugInteractionChecker() {
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [checking, setChecking] = useState(false);

  const addMedicine = (medicineId: string) => {
    if (!selectedMedicines.includes(medicineId)) {
      setSelectedMedicines([...selectedMedicines, medicineId]);
    }
  };

  const removeMedicine = (medicineId: string) => {
    setSelectedMedicines(selectedMedicines.filter((id) => id !== medicineId));
  };

  const checkInteractions = async () => {
    if (selectedMedicines.length < 2) {
      toast.error("Please select at least 2 medicines to check interactions");
      return;
    }

    setChecking(true);
    try {
      const medicineIds = selectedMedicines.join(",");
      const response = await fetch(
        `${API_CONFIG.API_ROOT}/pharmacy/enhanced/drug-interactions/check?medicine_ids=${medicineIds}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInteractions(data.interactions || []);

        if (data.has_interactions) {
          toast.warning(
            `Found ${data.interactions.length} potential interactions!`
          );
        } else {
          toast.success("No interactions found - medicines are safe together");
        }
      }
    } catch (error) {
      logger.error("Error checking interactions:", error);
      toast.error("Error checking drug interactions");
    } finally {
      setChecking(false);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return "destructive";
    if (severity >= 3) return "warning";
    return "default";
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 4) return "SEVERE";
    if (severity >= 3) return "MODERATE";
    return "MILD";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Drug Interaction Checker
        </h1>
        <p className="text-gray-600 mt-1">
          Check for potential interactions between medicines
        </p>
      </div>

      {/* Medicine Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Medicines</CardTitle>
          <CardDescription>
            Add medicines to check for interactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search medicines by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Medicines */}
          <div className="flex flex-wrap gap-2">
            {selectedMedicines.length === 0 ? (
              <p className="text-sm text-gray-500">No medicines selected yet</p>
            ) : (
              selectedMedicines.map((id) => (
                <Badge
                  key={id}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  Medicine {id}
                  <X
                    className="w-3 h-3 ml-2 cursor-pointer"
                    onClick={() => removeMedicine(id)}
                  />
                </Badge>
              ))
            )}
          </div>

          <Button
            onClick={checkInteractions}
            disabled={selectedMedicines.length < 2 || checking}
            className="w-full"
          >
            <Shield className="w-4 h-4 mr-2" />
            {checking ? "Checking..." : "Check for Interactions"}
          </Button>
        </CardContent>
      </Card>

      {/* Interaction Results */}
      {interactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Interaction Results
            </CardTitle>
            <CardDescription>
              {interactions.length} potential interaction(s) found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {interactions.map((interaction, index) => (
              <Alert
                key={index}
                variant={interaction.severity >= 4 ? "destructive" : "default"}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  <span>
                    Medicine {interaction.medicine_a} ↔ Medicine{" "}
                    {interaction.medicine_b}
                  </span>
                  <Badge variant={getSeverityColor(interaction.severity)}>
                    {getSeverityLabel(interaction.severity)}
                  </Badge>
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p className="font-medium">{interaction.type}</p>
                  <p>{interaction.description}</p>
                  {interaction.action && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <strong>Recommended Action:</strong> {interaction.action}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Safety Information */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="destructive" className="mt-1">
              SEVERE
            </Badge>
            <p>
              Do not dispense together. Consult doctor immediately. May cause
              serious adverse effects.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="warning" className="mt-1">
              MODERATE
            </Badge>
            <p>
              Exercise caution. Monitor patient closely. May require dosage
              adjustment.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="default" className="mt-1">
              MILD
            </Badge>
            <p>
              Low risk. Inform patient of potential minor effects. Generally
              safe to use together.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
