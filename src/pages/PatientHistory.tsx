import { useState, useEffect, useMemo } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users, Pill, Calendar, FileText, TrendingUp,
  AlertCircle, Search, Clock, User, Activity,
} from "lucide-react";
import api from "@/config/api";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

interface MedicationHistory {
  id: string;
  product_name: string;
  generic_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  prescription_number: string;
  doctor_name: string;
  dispensed_at: string;
  next_refill_date: string | null;
}

interface PatientStats {
  total_purchases: number;
  total_spent: number;
  unique_medications: number;
  first_purchase: string | null;
  last_purchase: string | null;
  most_purchased: string | null;
}

interface RefillReminder {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  product_name: string;
  generic_name: string;
  last_dispensed: string;
  next_refill_date: string;
  days_until_refill: number;
  prescription_number: string;
  doctor_name: string;
}

function fmt(amount: number) {
  return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PatientHistory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [history, setHistory] = useState<MedicationHistory[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [refillReminders, setRefillReminders] = useState<RefillReminder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadRefillReminders();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadPatientHistory(selectedCustomer);
      loadPatientStats(selectedCustomer);
    }
  }, [selectedCustomer]);

  const loadCustomers = async () => {
    try {
      const response = await api.get("/api/customers");
      setCustomers(response.data || []);
    } catch (error: any) {
      logger.error("Failed to load customers", error);
      toast.error("Failed to load customers");
    }
  };

  const loadPatientHistory = async (customerId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/patients/${customerId}/medication-history`);
      setHistory(response.data.history || []);
    } catch (error: any) {
      logger.error("Failed to load patient history", error);
      toast.error("Failed to load patient history");
    } finally {
      setLoading(false);
    }
  };

  const loadPatientStats = async (customerId: string) => {
    try {
      const response = await api.get(`/api/patients/${customerId}/statistics`);
      setStats(response.data);
    } catch (error: any) {
      logger.error("Failed to load patient statistics", error);
    }
  };

  const loadRefillReminders = async () => {
    try {
      // Route: GET /api/refill-reminders (not /api/patients/refill-reminders)
      const response = await api.get("/api/refill-reminders");
      setRefillReminders(response.data.reminders || []);
    } catch (error: any) {
      logger.error("Failed to load refill reminders", error);
    }
  };

  const selectedCustomerName = useMemo(() => {
    const c = customers.find((c) => c.id === selectedCustomer);
    return c ? c.name : "";
  }, [customers, selectedCustomer]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone?.includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [customers, searchTerm]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Patient Medication History</h1>
            <p className="text-teal-100 text-sm mt-0.5">
              Track customer medication purchases and refill schedules
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{customers.length}</p>
            <p className="text-xs text-teal-200">Total Patients</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{refillReminders.length}</p>
            <p className="text-xs text-teal-200">Refills Due</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{stats?.total_purchases ?? "—"}</p>
            <p className="text-xs text-teal-200">Selected Patient Visits</p>
          </div>
        </div>
      </div>

      {/* Refill Reminders */}
      {refillReminders.length > 0 && (
        <Card className="pharmacy-card border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-5 h-5" />
              Refill Reminders ({refillReminders.length})
            </CardTitle>
            <CardDescription className="text-orange-600">
              Patients due for medication refills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {refillReminders.slice(0, 5).map((reminder) => (
                <div
                  key={`${reminder.customer_id}-${reminder.product_name}`}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">{reminder.customer_name}</p>
                    <p className="text-sm text-gray-600">{reminder.product_name}</p>
                    <p className="text-xs text-orange-600 font-medium">
                      Due in {reminder.days_until_refill} day{reminder.days_until_refill !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{reminder.customer_phone}</p>
                    <Button size="sm" variant="outline" className="mt-1 text-orange-600 border-orange-300 hover:bg-orange-50">
                      Send Reminder
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <Card className="pharmacy-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Select Patient
            </CardTitle>
            <CardDescription>Search and select a patient to view history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, phone, or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pharmacy-input"
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-4">
                {customers.length === 0 ? "Loading patients…" : "No patients match your search"}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCustomer === customer.id
                        ? "bg-teal-50 border-teal-400"
                        : "hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">{customer.name}</p>
                    {customer.phone && (
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCustomer ? (
            <>
              {/* Stats Row */}
              {stats && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="pharmacy-card">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <Pill className="h-8 w-8 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-2xl font-bold">{stats.total_purchases}</p>
                          <p className="text-xs text-gray-500">Total Purchases</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="pharmacy-card">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="text-xl font-bold">{fmt(stats.total_spent)}</p>
                          <p className="text-xs text-gray-500">Total Spent</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="pharmacy-card">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <Activity className="h-8 w-8 text-purple-500 flex-shrink-0" />
                        <div>
                          <p className="text-2xl font-bold">{stats.unique_medications}</p>
                          <p className="text-xs text-gray-500">Unique Meds</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Most purchased badge */}
              {stats?.most_purchased && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-gray-500">Most purchased:</span>
                  <Badge variant="secondary" className="text-xs">{stats.most_purchased}</Badge>
                </div>
              )}

              {/* Medication History */}
              <Card className="pharmacy-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    Medication History — {selectedCustomerName}
                  </CardTitle>
                  <CardDescription>Past medication purchases and prescriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading history…</div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Pill className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                      <p className="font-medium">No medication history found</p>
                      <p className="text-sm mt-1">History is recorded when medicines are sold via POS</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div key={item.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                                {item.generic_name && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.generic_name}
                                  </Badge>
                                )}
                              </div>

                              <div className="mt-2 space-y-1 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>Dispensed: {new Date(item.dispensed_at).toLocaleDateString("en-BD")}</span>
                                </div>
                                {item.doctor_name && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5" />
                                    <span>Dr. {item.doctor_name}</span>
                                  </div>
                                )}
                                {item.prescription_number && (
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Rx: {item.prescription_number}</span>
                                  </div>
                                )}
                                {item.next_refill_date && (
                                  <div className="flex items-center gap-2 text-orange-600">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>
                                      Next Refill: {new Date(item.next_refill_date).toLocaleDateString("en-BD")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right ml-4">
                              <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                              <p className="font-semibold text-gray-900">{fmt(item.total_price)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="pharmacy-card">
              <CardContent className="py-16">
                <div className="text-center text-gray-400">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                  <p className="font-medium text-gray-500">No patient selected</p>
                  <p className="text-sm mt-1">Search and select a patient on the left to view their history</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
