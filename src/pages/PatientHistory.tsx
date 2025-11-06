import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Users, Pill, Calendar, FileText, TrendingUp, 
  AlertCircle, Search, Clock, User
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'react-hot-toast';

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

export default function PatientHistory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [history, setHistory] = useState<MedicationHistory[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [refillReminders, setRefillReminders] = useState<RefillReminder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
      const response = await api.get('/api/customers');
      setCustomers(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load customers');
      console.error(error);
    }
  };

  const loadPatientHistory = async (customerId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/patients/${customerId}/medication-history`);
      setHistory(response.data.history || []);
    } catch (error: any) {
      toast.error('Failed to load patient history');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientStats = async (customerId: string) => {
    try {
      const response = await api.get(`/api/patients/${customerId}/statistics`);
      setStats(response.data);
    } catch (error: any) {
      toast.error('Failed to load patient statistics');
      console.error(error);
    }
  };

  const loadRefillReminders = async () => {
    try {
      const response = await api.get('/api/patients/refill-reminders');
      setRefillReminders(response.data.reminders || []);
    } catch (error: any) {
      console.error('Failed to load refill reminders:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Patient Medication History</h1>
          <p className="text-gray-500 mt-1">Track customer medication purchases and refills</p>
        </div>
      </div>

      {/* Refill Reminders */}
      {refillReminders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              Refill Reminders ({refillReminders.length})
            </CardTitle>
            <CardDescription>Patients due for medication refills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {refillReminders.slice(0, 5).map((reminder) => (
                <div key={reminder.customer_id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium">{reminder.customer_name}</p>
                    <p className="text-sm text-gray-600">{reminder.product_name}</p>
                    <p className="text-xs text-gray-500">Due in {reminder.days_until_refill} days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{reminder.customer_phone}</p>
                    <Button size="sm" variant="outline" className="mt-1">
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
        {/* Customer Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Patient</CardTitle>
            <CardDescription>Search and select a patient</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCustomer === customer.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCustomer ? (
            <>
              {/* Patient Statistics */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <Pill className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.total_purchases}</p>
                          <p className="text-xs text-gray-500">Total Purchases</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">${stats.total_spent.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Total Spent</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.unique_medications}</p>
                          <p className="text-xs text-gray-500">Unique Medications</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Medication History */}
              <Card>
                <CardHeader>
                  <CardTitle>Medication History</CardTitle>
                  <CardDescription>Past medication purchases and prescriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : history.length > 0 ? (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{item.product_name}</h3>
                                {item.generic_name && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.generic_name}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="mt-2 space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Dispensed: {new Date(item.dispensed_at).toLocaleDateString()}</span>
                                </div>
                                
                                {item.doctor_name && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>Dr. {item.doctor_name}</span>
                                  </div>
                                )}
                                
                                {item.prescription_number && (
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>Rx: {item.prescription_number}</span>
                                  </div>
                                )}
                                
                                {item.next_refill_date && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Next Refill: {new Date(item.next_refill_date).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                              <p className="font-semibold">${item.total_price.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No medication history found for this patient
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Select a patient to view their medication history</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

