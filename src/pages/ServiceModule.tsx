import { useState, useEffect } from "react";
import { Plus, Stethoscope, Calendar, Users, Edit, Trash2, Search, Check, X, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";

const API_BASE = "http://localhost:8000/api/services";

interface Service {
  id: string;
  service_code: string;
  category_id?: string;
  name: string;
  description?: string;
  base_price: number;
  vat_percentage: number;
  duration_minutes?: number;
  is_home_service: boolean;
  travel_charges: number;
  is_active: boolean;
  created_at: string;
}

interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  advance_paid: number;
  assigned_to?: string;
  created_at: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export default function ServiceModule() {
  const [activeTab, setActiveTab] = useState("services");
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Service Dialog
  const [serviceDialog, setServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    service_code: "",
    category_id: "",
    name: "",
    description: "",
    base_price: 0,
    vat_percentage: 0,
    duration_minutes: 30,
    is_home_service: false,
    travel_charges: 0,
    is_active: true
  });

  // Booking Dialog
  const [bookingDialog, setBookingDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingForm, setBookingForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    service_id: "",
    service_name: "",
    booking_date: format(new Date(), "yyyy-MM-dd"),
    booking_time: "09:00",
    advance_paid: 0,
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesRes, bookingsRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}`, { headers: getAuthHeader() }),
        fetch(`${API_BASE}/bookings/all`, { headers: getAuthHeader() }),
        fetch(`${API_BASE}/categories`, { headers: getAuthHeader() })
      ]);

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data);
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.service_code) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const url = editingService
        ? `${API_BASE}/${editingService.id}`
        : `${API_BASE}`;
      const method = editingService ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(serviceForm)
      });

      if (response.ok) {
        toast.success(`Service ${editingService ? 'updated' : 'created'} successfully`);
        setServiceDialog(false);
        setEditingService(null);
        setServiceForm({
          service_code: "",
          category_id: "",
          name: "",
          description: "",
          base_price: 0,
          vat_percentage: 0,
          duration_minutes: 30,
          is_home_service: false,
          travel_charges: 0,
          is_active: true
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save service");
      }
    } catch (error) {
      toast.error("Error saving service");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });

      if (response.ok) {
        toast.success("Service deleted successfully");
        loadData();
      } else {
        toast.error("Failed to delete service");
      }
    } catch (error) {
      toast.error("Error deleting service");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBooking = async () => {
    if (!bookingForm.customer_name || !bookingForm.service_id) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const url = editingBooking
        ? `${API_BASE}/bookings/${editingBooking.id}`
        : `${API_BASE}/bookings`;
      const method = editingBooking ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(bookingForm)
      });

      if (response.ok) {
        toast.success(`Booking ${editingBooking ? 'updated' : 'created'} successfully`);
        setBookingDialog(false);
        setEditingBooking(null);
        setBookingForm({
          customer_name: "",
          customer_phone: "",
          customer_address: "",
          service_id: "",
          service_name: "",
          booking_date: format(new Date(), "yyyy-MM-dd"),
          booking_time: "09:00",
          advance_paid: 0,
          notes: ""
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save booking");
      }
    } catch (error) {
      toast.error("Error saving booking");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/bookings/${id}/confirm`, {
        method: "POST",
        headers: getAuthHeader()
      });

      if (response.ok) {
        toast.success("Booking confirmed");
        loadData();
      } else {
        toast.error("Failed to confirm booking");
      }
    } catch (error) {
      toast.error("Error confirming booking");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/bookings/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast.success("Booking cancelled");
        loadData();
      } else {
        toast.error("Failed to cancel booking");
      }
    } catch (error) {
      toast.error("Error cancelling booking");
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.service_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings.filter(b =>
    b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.booking_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Service Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage consultations, lab tests, and service bookings
          </p>
        </div>
        <Button className="pharmacy-button" onClick={() => {
          setActiveTab("services");
          setServiceDialog(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="services"><Stethoscope className="w-4 h-4 mr-2" />Services ({services.length})</TabsTrigger>
          <TabsTrigger value="bookings"><Calendar className="w-4 h-4 mr-2" />Bookings ({bookings.length})</TabsTrigger>
        </TabsList>

        {/* SERVICES TAB */}
        <TabsContent value="services">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Services</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pharmacy-input w-[300px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? "No services found" : "No services yet. Add your first service!"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Service Name</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead>Home Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell><Badge variant="outline">{service.service_code}</Badge></TableCell>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>
                            {service.duration_minutes ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.duration_minutes} min
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">৳{service.base_price.toFixed(2)}</TableCell>
                          <TableCell>
                            {service.is_home_service ? (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <MapPin className="w-3 h-3" />
                                Yes
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={service.is_active ? "default" : "secondary"}>
                              {service.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingService(service);
                                  setServiceForm({
                                    service_code: service.service_code,
                                    category_id: service.category_id || "",
                                    name: service.name,
                                    description: service.description || "",
                                    base_price: service.base_price,
                                    vat_percentage: service.vat_percentage,
                                    duration_minutes: service.duration_minutes || 30,
                                    is_home_service: service.is_home_service,
                                    travel_charges: service.travel_charges,
                                    is_active: service.is_active
                                  });
                                  setServiceDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteService(service.id)}
                              >
                                <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Service Bookings</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pharmacy-input w-[300px]"
                    />
                  </div>
                  <Button className="pharmacy-button" onClick={() => setBookingDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Booking
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? "No bookings found" : "No bookings yet. Create your first booking!"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Advance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell><Badge variant="outline">{booking.booking_number}</Badge></TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.customer_name}</div>
                              <div className="text-sm text-muted-foreground">{booking.customer_phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>{booking.service_name}</TableCell>
                          <TableCell>
                            <div>
                              <div>{format(new Date(booking.booking_date), "dd MMM yyyy")}</div>
                              <div className="text-sm text-muted-foreground">{booking.booking_time}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              booking.status === "completed" ? "default" :
                              booking.status === "confirmed" ? "secondary" :
                              booking.status === "cancelled" ? "destructive" : "outline"
                            }>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">৳{booking.advance_paid.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {booking.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleConfirmBooking(booking.id)}
                                  title="Confirm"
                                >
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                              )}
                              {booking.status !== "cancelled" && booking.status !== "completed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4 text-red-600" />
                                </Button>
                              )}
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
        </TabsContent>
      </Tabs>

      {/* Service Dialog */}
      <Dialog open={serviceDialog} onOpenChange={setServiceDialog}>
        <DialogContent className="glass-strong max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>Enter service details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Code *</Label>
              <Input
                value={serviceForm.service_code}
                onChange={(e) => setServiceForm({ ...serviceForm, service_code: e.target.value })}
                placeholder="SVC001"
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={serviceForm.category_id}
                onValueChange={(value) => setServiceForm({ ...serviceForm, category_id: value })}
              >
                <SelectTrigger className="pharmacy-input">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Service Name *</Label>
              <Input
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="Blood Test"
                className="pharmacy-input"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                className="pharmacy-input"
                rows={3}
              />
            </div>
            <div>
              <Label>Base Price *</Label>
              <Input
                type="number"
                value={serviceForm.base_price}
                onChange={(e) => setServiceForm({ ...serviceForm, base_price: parseFloat(e.target.value) || 0 })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={serviceForm.duration_minutes}
                onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) || 0 })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>VAT %</Label>
              <Input
                type="number"
                value={serviceForm.vat_percentage}
                onChange={(e) => setServiceForm({ ...serviceForm, vat_percentage: parseFloat(e.target.value) || 0 })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Travel Charges</Label>
              <Input
                type="number"
                value={serviceForm.travel_charges}
                onChange={(e) => setServiceForm({ ...serviceForm, travel_charges: parseFloat(e.target.value) || 0 })}
                className="pharmacy-input"
                disabled={!serviceForm.is_home_service}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={serviceForm.is_home_service}
                onCheckedChange={(checked) => setServiceForm({ ...serviceForm, is_home_service: checked })}
              />
              <Label>Home Service</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={serviceForm.is_active}
                onCheckedChange={(checked) => setServiceForm({ ...serviceForm, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialog(false)}>Cancel</Button>
            <Button className="pharmacy-button" onClick={handleSaveService} disabled={loading}>
              {loading ? "Saving..." : "Save Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
        <DialogContent className="glass-strong max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBooking ? "Edit Booking" : "New Service Booking"}</DialogTitle>
            <DialogDescription>Enter booking details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={bookingForm.customer_name}
                onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                value={bookingForm.customer_phone}
                onChange={(e) => setBookingForm({ ...bookingForm, customer_phone: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input
                value={bookingForm.customer_address}
                onChange={(e) => setBookingForm({ ...bookingForm, customer_address: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div className="col-span-2">
              <Label>Service *</Label>
              <Select
                value={bookingForm.service_id}
                onValueChange={(value) => {
                  const service = services.find(s => s.id === value);
                  setBookingForm({ 
                    ...bookingForm, 
                    service_id: value,
                    service_name: service?.name || ""
                  });
                }}
              >
                <SelectTrigger className="pharmacy-input">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.filter(s => s.is_active).map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ৳{service.base_price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Booking Date *</Label>
              <Input
                type="date"
                value={bookingForm.booking_date}
                onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Booking Time *</Label>
              <Input
                type="time"
                value={bookingForm.booking_time}
                onChange={(e) => setBookingForm({ ...bookingForm, booking_time: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Advance Payment</Label>
              <Input
                type="number"
                value={bookingForm.advance_paid}
                onChange={(e) => setBookingForm({ ...bookingForm, advance_paid: parseFloat(e.target.value) || 0 })}
                className="pharmacy-input"
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                className="pharmacy-input"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialog(false)}>Cancel</Button>
            <Button className="pharmacy-button" onClick={handleSaveBooking} disabled={loading}>
              {loading ? "Saving..." : "Save Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
