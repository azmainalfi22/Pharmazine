import { useState, useEffect, useCallback } from "react";
import {
  Heart, Shield, FileText, Activity, Search, Plus, Eye,
  AlertTriangle, CheckCircle, Clock, Download, RefreshCw,
  User, Pill, Calendar, XCircle, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  allergies?: string[];
  insurance_provider?: string;
  insurance_id?: string;
  hipaa_consent_date?: string;
  loyalty_points?: number;
}

interface HipaaLog {
  id: string;
  patient_id?: string;
  patient_name?: string;
  user_id?: string;
  action: string;
  resource_type: string;
  notes?: string;
  created_at: string;
}

interface ConsentForm {
  id: string;
  patient_id: string;
  patient_name?: string;
  form_type: string;
  status: string;
  signed_at?: string;
  signed_by?: string;
  valid_until?: string;
  created_at: string;
}

interface AdherenceRecord {
  id: string;
  customer_id: string;
  patient_name?: string;
  product_name?: string;
  last_filled_at?: string;
  next_due_date?: string;
  total_fills: number;
  missed_fills: number;
  compliance_pct: number;
}

interface AllergyAlert {
  patient_id: string;
  patient_name: string;
  allergen: string;
  severity: "low" | "medium" | "high";
}

const FORM_TYPES = [
  { value: "general_treatment", label: "General Treatment Consent" },
  { value: "data_sharing", label: "Data Sharing Agreement" },
  { value: "research", label: "Research Participation" },
  { value: "photo_video", label: "Photo/Video Consent" },
];

const ALLERGY_COLORS: Record<string, string> = {
  Penicillin: "bg-red-100 text-red-700",
  Aspirin: "bg-orange-100 text-orange-700",
  Sulfonamides: "bg-yellow-100 text-yellow-700",
  NSAIDs: "bg-pink-100 text-pink-700",
  Codeine: "bg-purple-100 text-purple-700",
};

const fmt = (n: number) =>
  `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try { return format(parseISO(d), "dd MMM yyyy"); } catch { return d; }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatientCRMModule() {
  const [activeTab, setActiveTab] = useState("allergies");
  const [loading, setLoading] = useState(false);

  // Allergies
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [allergyInput, setAllergyInput] = useState("");
  const [editAllergyOpen, setEditAllergyOpen] = useState(false);
  const [allergyAlerts] = useState<AllergyAlert[]>([
    { patient_id: "1", patient_name: "Demo Patient", allergen: "Penicillin", severity: "high" },
  ]);

  // HIPAA Audit
  const [auditLogs, setAuditLogs] = useState<HipaaLog[]>([]);
  const [auditSearch, setAuditSearch] = useState("");

  // Consent Forms
  const [consentForms, setConsentForms] = useState<ConsentForm[]>([]);
  const [newConsentOpen, setNewConsentOpen] = useState(false);
  const [newConsent, setNewConsent] = useState({
    patient_id: "", form_type: "general_treatment", signed_by: "", valid_until: "",
  });

  // Adherence
  const [adherence, setAdherence] = useState<AdherenceRecord[]>([]);

  useEffect(() => {
    loadPatients();
    logHipaaAccess("view", "patient_crm_module");
  }, []);

  useEffect(() => {
    if (activeTab === "audit") loadAuditLogs();
    if (activeTab === "consent") loadConsentForms();
    if (activeTab === "adherence") loadAdherence();
  }, [activeTab]);

  // ── HIPAA audit helper ──────────────────────────────────────────────────────
  const logHipaaAccess = async (action: string, resourceType: string, patientId?: string) => {
    try {
      await fetch(`${API_CONFIG.API_ROOT}/hipaa-audit-log`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action, resource_type: resourceType, patient_id: patientId }),
      });
    } catch (_) { /* silent */ }
  };

  // ── Load patients ───────────────────────────────────────────────────────────
  const loadPatients = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/patients/crm`, { headers: getAuthHeaders() });
      if (r.ok) setPatients(await r.json());
    } catch (e) { logger.error("loadPatients", e); }
    setLoading(false);
  };

  // ── Audit log ───────────────────────────────────────────────────────────────
  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/hipaa-audit-log`, { headers: getAuthHeaders() });
      if (r.ok) setAuditLogs(await r.json());
    } catch (e) { logger.error("loadAuditLogs", e); }
    setLoading(false);
  };

  // ── Consent forms ───────────────────────────────────────────────────────────
  const loadConsentForms = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/consent-forms`, { headers: getAuthHeaders() });
      if (r.ok) setConsentForms(await r.json());
    } catch (e) { logger.error("loadConsentForms", e); }
    setLoading(false);
  };

  const saveConsent = async () => {
    if (!newConsent.patient_id || !newConsent.form_type) {
      toast.error("Select patient and form type"); return;
    }
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/consent-forms`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(newConsent),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Consent form created");
      setNewConsentOpen(false);
      setNewConsent({ patient_id: "", form_type: "general_treatment", signed_by: "", valid_until: "" });
      await logHipaaAccess("consent_signed", "consent_form", newConsent.patient_id);
      loadConsentForms();
    } catch (e) { logger.error("saveConsent", e); toast.error("Failed to save consent"); }
  };

  const exportConsentPDF = async (form: ConsentForm) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Pharmazine Pharmacy", 14, 20);
      doc.setFontSize(13);
      doc.text("Patient Consent Form", 14, 32);
      doc.setFontSize(10);
      doc.text(`Form Type: ${FORM_TYPES.find(f => f.value === form.form_type)?.label ?? form.form_type}`, 14, 44);
      doc.text(`Patient: ${form.patient_name ?? form.patient_id}`, 14, 52);
      doc.text(`Status: ${form.status.toUpperCase()}`, 14, 60);
      doc.text(`Created: ${fmtDate(form.created_at)}`, 14, 68);
      if (form.signed_at) doc.text(`Signed: ${fmtDate(form.signed_at)} by ${form.signed_by ?? "N/A"}`, 14, 76);
      if (form.valid_until) doc.text(`Valid Until: ${fmtDate(form.valid_until)}`, 14, 84);
      doc.setFontSize(9);
      doc.text(
        "I hereby consent to the treatment and data processing described above. I understand my rights under applicable health information privacy laws.",
        14, 100, { maxWidth: 180 }
      );
      doc.text("Patient Signature: ________________________  Date: ____________", 14, 130);
      doc.text("Witness Signature: ________________________  Date: ____________", 14, 145);
      doc.save(`consent-${form.id.slice(0, 8)}.pdf`);
      await logHipaaAccess("print", "consent_form", form.patient_id);
      toast.success("PDF exported");
    } catch (e) { logger.error("exportConsentPDF", e); toast.error("PDF export failed"); }
  };

  // ── Adherence ───────────────────────────────────────────────────────────────
  const loadAdherence = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/patients/adherence`, { headers: getAuthHeaders() });
      if (r.ok) setAdherence(await r.json());
    } catch (e) { logger.error("loadAdherence", e); }
    setLoading(false);
  };

  // ── Save allergies ──────────────────────────────────────────────────────────
  const saveAllergies = async () => {
    if (!selectedPatient) return;
    const allergiesArr = allergyInput.split(",").map(a => a.trim()).filter(Boolean);
    try {
      const r = await fetch(`${API_CONFIG.API_ROOT}/patients/${selectedPatient.id}/allergies`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ allergies: allergiesArr }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success("Allergies updated");
      setEditAllergyOpen(false);
      await logHipaaAccess("edit", "allergy", selectedPatient.id);
      loadPatients();
    } catch (e) { logger.error("saveAllergies", e); toast.error("Failed to save allergies"); }
  };

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.phone ?? "").includes(patientSearch)
  );
  const filteredLogs = auditLogs.filter(l =>
    (l.patient_name ?? "").toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.action.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const complianceColor = (pct: number) => {
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-amber-500";
    return "text-red-600";
  };

  const actionBadgeColor = (action: string) => {
    if (action === "edit") return "bg-amber-100 text-amber-700";
    if (action === "export" || action === "print") return "bg-blue-100 text-blue-700";
    if (action === "consent_signed") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-600";
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Heart className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Patient CRM</h1>
            </div>
            <p className="text-rose-100 text-sm">Allergy alerts · Adherence tracking · HIPAA audit · Consent forms</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={loadPatients} className="gap-1">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: "Total Patients", value: patients.length, icon: User },
            { label: "Allergy Alerts", value: patients.filter(p => (p.allergies ?? []).length > 0).length, icon: AlertTriangle },
            { label: "Pending Consents", value: consentForms.filter(c => c.status === "pending").length, icon: FileText },
            { label: "Low Adherence", value: adherence.filter(a => a.compliance_pct < 60).length, icon: Activity },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/15 rounded-lg p-3 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-white/70">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active allergy alerts */}
      {allergyAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Active Drug Allergy Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {allergyAlerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-1.5 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="font-medium text-red-800">{alert.patient_name}</span>
                  <ChevronRight className="w-3 h-3 text-red-400" />
                  <span className="text-red-700">{alert.allergen}</span>
                  <Badge className={`text-xs ${alert.severity === "high" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="allergies" className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> Allergies
          </TabsTrigger>
          <TabsTrigger value="adherence" className="flex items-center gap-1">
            <Activity className="w-4 h-4" /> Adherence
          </TabsTrigger>
          <TabsTrigger value="consent" className="flex items-center gap-1">
            <FileText className="w-4 h-4" /> Consent
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1">
            <Shield className="w-4 h-4" /> HIPAA Audit
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Allergies ─────────────────────────────────────────────────── */}
        <TabsContent value="allergies" className="space-y-4 mt-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search patients…"
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Card className="pharmacy-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Allergies</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead>HIPAA Consent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading patients…</TableCell></TableRow>
                  ) : filteredPatients.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No patients found</TableCell></TableRow>
                  ) : (
                    filteredPatients.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 text-xs font-bold">
                              {p.name[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.phone ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(p.allergies ?? []).length === 0 ? (
                              <span className="text-xs text-muted-foreground">None recorded</span>
                            ) : (
                              (p.allergies ?? []).map(a => (
                                <Badge key={a} className={`text-xs ${ALLERGY_COLORS[a] ?? "bg-red-50 text-red-600"}`}>{a}</Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{p.insurance_provider ?? "—"}</TableCell>
                        <TableCell>
                          {p.hipaa_consent_date
                            ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle className="w-3 h-3 mr-1" />{fmtDate(p.hipaa_consent_date)}</Badge>
                            : <Badge className="bg-amber-100 text-amber-700 text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm" variant="outline"
                            onClick={() => {
                              setSelectedPatient(p);
                              setAllergyInput((p.allergies ?? []).join(", "));
                              setEditAllergyOpen(true);
                              logHipaaAccess("edit", "allergy", p.id);
                            }}
                          >
                            <Pill className="w-3 h-3 mr-1" /> Edit Allergies
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Adherence ─────────────────────────────────────────────────── */}
        <TabsContent value="adherence" className="space-y-4 mt-4">
          <Card className="pharmacy-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-600" /> Medication Adherence & Refill Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Last Filled</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Fills</TableHead>
                    <TableHead>Missed</TableHead>
                    <TableHead>Compliance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : adherence.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No adherence records found</TableCell></TableRow>
                  ) : (
                    adherence.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-sm">{a.patient_name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{a.product_name ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(a.last_filled_at)}</TableCell>
                        <TableCell className="text-sm">
                          {a.next_due_date ? (
                            <span className={new Date(a.next_due_date) < new Date() ? "text-red-600 font-medium" : ""}>
                              {fmtDate(a.next_due_date)}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{a.total_fills}</TableCell>
                        <TableCell className="text-sm text-red-600">{a.missed_fills}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                              <div
                                className={`h-2 rounded-full ${a.compliance_pct >= 80 ? "bg-green-500" : a.compliance_pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(100, a.compliance_pct)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${complianceColor(a.compliance_pct)}`}>
                              {a.compliance_pct.toFixed(0)}%
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

        {/* ── Tab: Consent Forms ─────────────────────────────────────────────── */}
        <TabsContent value="consent" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{consentForms.length} consent forms on file</p>
            <Button size="sm" onClick={() => setNewConsentOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white gap-1">
              <Plus className="w-4 h-4" /> New Consent Form
            </Button>
          </div>
          <Card className="pharmacy-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Form Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signed By</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : consentForms.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No consent forms yet</TableCell></TableRow>
                  ) : (
                    consentForms.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium text-sm">{f.patient_name ?? f.patient_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{FORM_TYPES.find(t => t.value === f.form_type)?.label ?? f.form_type}</TableCell>
                        <TableCell>
                          <Badge className={
                            f.status === "signed" ? "bg-green-100 text-green-700" :
                            f.status === "revoked" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }>
                            {f.status === "signed" ? <CheckCircle className="w-3 h-3 mr-1" /> :
                             f.status === "revoked" ? <XCircle className="w-3 h-3 mr-1" /> :
                             <Clock className="w-3 h-3 mr-1" />}
                            {f.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.signed_by ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(f.valid_until)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(f.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => exportConsentPDF(f)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: HIPAA Audit ───────────────────────────────────────────────── */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filter logs…"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button size="sm" variant="outline" onClick={loadAuditLogs} className="gap-1">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
          <Card className="pharmacy-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading audit log…</TableCell></TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit entries found</TableCell></TableRow>
                  ) : (
                    filteredLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDate(log.created_at)}{" "}
                          <span className="text-gray-400">
                            {log.created_at ? log.created_at.slice(11, 16) : ""}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{log.patient_name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${actionBadgeColor(log.action)}`}>{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.resource_type}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{log.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit Allergies Dialog ───────────────────────────────────────────── */}
      <Dialog open={editAllergyOpen} onOpenChange={setEditAllergyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-rose-600" />
              Edit Allergies — {selectedPatient?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Known Allergies (comma-separated)</Label>
              <Input
                className="mt-1"
                placeholder="e.g. Penicillin, Aspirin, NSAIDs"
                value={allergyInput}
                onChange={e => setAllergyInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Common: Penicillin · Aspirin · Sulfonamides · NSAIDs · Codeine</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {allergyInput.split(",").map(a => a.trim()).filter(Boolean).map(a => (
                <Badge key={a} className={`text-xs ${ALLERGY_COLORS[a] ?? "bg-red-50 text-red-600"}`}>{a}</Badge>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAllergyOpen(false)}>Cancel</Button>
            <Button onClick={saveAllergies} className="bg-rose-600 hover:bg-rose-700 text-white">Save Allergies</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Consent Dialog ─────────────────────────────────────────────── */}
      <Dialog open={newConsentOpen} onOpenChange={setNewConsentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-600" /> New Consent Form
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Patient</Label>
              <Select
                value={newConsent.patient_id}
                onValueChange={v => setNewConsent(c => ({ ...c, patient_id: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select patient…" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Form Type</Label>
              <Select
                value={newConsent.form_type}
                onValueChange={v => setNewConsent(c => ({ ...c, form_type: v }))}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORM_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Signed By</Label>
              <Input
                className="mt-1" placeholder="Staff name or patient name"
                value={newConsent.signed_by}
                onChange={e => setNewConsent(c => ({ ...c, signed_by: e.target.value }))}
              />
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input
                type="date" className="mt-1"
                value={newConsent.valid_until}
                onChange={e => setNewConsent(c => ({ ...c, valid_until: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewConsentOpen(false)}>Cancel</Button>
            <Button onClick={saveConsent} className="bg-rose-600 hover:bg-rose-700 text-white">Create Form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
