import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle, X, Search, Shield, Pill,
  CheckCircle, Info, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { apiClient } from "@/integrations/api/client";
import { logger } from "@/utils/logger";

interface Product {
  id: string;
  name: string;
  generic_name?: string;
  active_ingredients?: string;
}

interface SelectedMedicine {
  id: string;
  name: string;
}

interface DrugInteraction {
  medicine_a: string;
  medicine_b: string;
  type: string;
  description: string;
  severity: number;
  action: string;
}

const SEVERITY_CONFIG = {
  severe:   { min: 4, label: "SEVERE",   bg: "bg-red-100 border-red-300",    badge: "bg-red-600 text-white",    icon: "text-red-600" },
  moderate: { min: 3, label: "MODERATE", bg: "bg-orange-100 border-orange-300", badge: "bg-orange-500 text-white", icon: "text-orange-600" },
  mild:     { min: 1, label: "MILD",     bg: "bg-yellow-50 border-yellow-200",  badge: "bg-yellow-400 text-white", icon: "text-yellow-600" },
};

function severityConfig(level: number) {
  if (level >= 4) return SEVERITY_CONFIG.severe;
  if (level >= 3) return SEVERITY_CONFIG.moderate;
  return SEVERITY_CONFIG.mild;
}

export default function DrugInteractionChecker() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState<SelectedMedicine[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);

  // Build id → name lookup map
  const nameMap = useMemo(() => {
    const m: Record<string, string> = {};
    products.forEach((p) => { m[p.id] = p.name; });
    return m;
  }, [products]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (err) {
      logger.error("Failed to load products", err);
      toast.error("Failed to load medicine list");
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.generic_name?.toLowerCase().includes(q) ||
          p.active_ingredients?.toLowerCase().includes(q)
      )
      .filter((p) => !selectedMedicines.find((s) => s.id === p.id))
      .slice(0, 8);
  }, [searchTerm, products, selectedMedicines]);

  const addMedicine = (product: Product) => {
    setSelectedMedicines((prev) => [...prev, { id: product.id, name: product.name }]);
    setSearchTerm("");
    setShowDropdown(false);
    setChecked(false);
    setInteractions([]);
  };

  const removeMedicine = (id: string) => {
    setSelectedMedicines((prev) => prev.filter((m) => m.id !== id));
    setChecked(false);
    setInteractions([]);
  };

  const checkInteractions = async () => {
    if (selectedMedicines.length < 2) {
      toast.error("Select at least 2 medicines to check interactions");
      return;
    }
    setChecking(true);
    setChecked(false);
    try {
      const ids = selectedMedicines.map((m) => m.id).join(",");
      const response = await fetch(
        `${API_CONFIG.API_ROOT}/pharmacy/enhanced/drug-interactions/check?medicine_ids=${ids}`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setInteractions(data.interactions || []);
      setChecked(true);
      if (data.has_interactions) {
        toast.warning(`Found ${data.interactions.length} potential interaction(s)!`);
      } else {
        toast.success("No interactions found — safe to dispense together");
      }
    } catch (err) {
      logger.error("Error checking interactions", err);
      toast.error("Failed to check drug interactions");
    } finally {
      setChecking(false);
    }
  };

  const resolveName = (id: string) => nameMap[id] || id;

  const stats = {
    severe:   interactions.filter((i) => i.severity >= 4).length,
    moderate: interactions.filter((i) => i.severity === 3).length,
    mild:     interactions.filter((i) => i.severity < 3).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Drug Interaction Checker</h1>
            <p className="text-blue-100 text-sm mt-0.5">
              Select medicines to check for potential interactions before dispensing
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{selectedMedicines.length}</p>
            <p className="text-xs text-blue-200">Medicines selected</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{stats.severe}</p>
            <p className="text-xs text-blue-200">Severe interactions</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs text-blue-200">Medicines in database</p>
          </div>
        </div>
      </div>

      {/* Search + Selection */}
      <Card className="pharmacy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            Select Medicines
          </CardTitle>
          <CardDescription>
            Type a medicine name to search and add it to the interaction check
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search input + dropdown */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={loadingProducts ? "Loading medicines..." : "Search by name or generic name…"}
              value={searchTerm}
              disabled={loadingProducts}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              className="pl-10 pharmacy-input"
            />
            {showDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center justify-between group"
                    onMouseDown={() => addMedicine(p)}
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">{p.name}</p>
                      {p.generic_name && (
                        <p className="text-xs text-gray-500">{p.generic_name}</p>
                      )}
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400 rotate-[-90deg] group-hover:text-blue-500" />
                  </button>
                ))}
              </div>
            )}
            {showDropdown && searchTerm.length > 1 && filteredProducts.length === 0 && !loadingProducts && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
                No medicines found for "{searchTerm}"
              </div>
            )}
          </div>

          {/* Selected medicines chips */}
          <div className="min-h-[40px]">
            {selectedMedicines.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No medicines selected yet — search above to add</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedMedicines.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-sm px-3 py-1.5 rounded-full font-medium"
                  >
                    <Pill className="w-3 h-3" />
                    {m.name}
                    <button
                      onClick={() => removeMedicine(m.id)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <Button
            onClick={checkInteractions}
            disabled={selectedMedicines.length < 2 || checking}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            size="lg"
          >
            <Shield className="w-4 h-4 mr-2" />
            {checking
              ? "Checking interactions…"
              : selectedMedicines.length < 2
              ? `Add ${2 - selectedMedicines.length} more medicine(s) to check`
              : `Check ${selectedMedicines.length} medicines for interactions`}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {checked && (
        <Card className="pharmacy-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {interactions.length === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              Interaction Results
            </CardTitle>
            {interactions.length > 0 && (
              <div className="flex gap-3 mt-2">
                {stats.severe > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                    {stats.severe} Severe
                  </span>
                )}
                {stats.moderate > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                    {stats.moderate} Moderate
                  </span>
                )}
                {stats.mild > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                    {stats.mild} Mild
                  </span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {interactions.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">No interactions detected</p>
                  <p className="text-sm text-green-700 mt-0.5">
                    The selected medicines are safe to dispense together based on the current interaction database.
                  </p>
                </div>
              </div>
            ) : (
              interactions.map((interaction, i) => {
                const cfg = severityConfig(interaction.severity);
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border-2 ${cfg.bg}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {resolveName(interaction.medicine_a)}
                        </span>
                        <span className="text-gray-500">↔</span>
                        <span className="font-semibold text-gray-900">
                          {resolveName(interaction.medicine_b)}
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {interaction.type && (
                      <p className="text-sm font-medium text-gray-700 mb-1">{interaction.type}</p>
                    )}
                    {interaction.description && (
                      <p className="text-sm text-gray-600">{interaction.description}</p>
                    )}
                    {interaction.action && (
                      <div className="mt-2 p-2 bg-white/70 rounded text-sm border border-current/20">
                        <strong>Recommended Action:</strong> {interaction.action}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Severity Guide */}
      <Card className="pharmacy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Severity Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              label: "SEVERE (4–5)",
              color: "bg-red-600 text-white",
              text: "Do not dispense together. Consult the prescribing doctor immediately. May cause life-threatening adverse effects.",
            },
            {
              label: "MODERATE (3)",
              color: "bg-orange-500 text-white",
              text: "Exercise caution. Monitor patient closely. May require dosage adjustment or physician review.",
            },
            {
              label: "MILD (1–2)",
              color: "bg-yellow-400 text-white",
              text: "Low risk. Inform the patient of potential minor effects. Generally safe to use together with monitoring.",
            },
          ].map(({ label, color, text }) => (
            <div key={label} className="flex items-start gap-3">
              <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 ${color}`}>
                {label}
              </span>
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
