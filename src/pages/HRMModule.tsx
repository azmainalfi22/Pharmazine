import { useState, useEffect } from "react";
import { Plus, Users, Calendar, DollarSign, FileText, Edit, Trash2, Search, Check, X, Clock } from "lucide-react";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";

interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  email?: string;
  phone: string;
  designation?: string;
  department?: string;
  employment_type: string;
  joining_date: string;
  basic_salary: number;
  is_active: boolean;
}

interface Leave {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: string;
  applied_date: string;
}

interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: string;
  working_hours: number;
  overtime_hours: number;
}

interface Payroll {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  gross_salary: number;
  net_salary: number;
  payment_status: string;
  payment_date?: string;
}

export default function HRMModule() {
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Employee Dialog
  const [employeeDialog, setEmployeeDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    employee_code: "",
    full_name: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
    employment_type: "full_time",
    joining_date: format(new Date(), "yyyy-MM-dd"),
    basic_salary: 0,
    allowances: 0
  });

  // Leave Dialog
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employee_id: "",
    leave_type: "casual",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    total_days: 1,
    reason: ""
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
      const [employeesRes, leavesRes, attendanceRes, payrollRes] = await Promise.all([
        fetch(`${API_CONFIG.HRM_BASE}/employees`, { headers: getAuthHeaders() }),
        fetch(`${API_CONFIG.HRM_BASE}/leaves`, { headers: getAuthHeaders() }),
        fetch(`${API_CONFIG.HRM_BASE}/attendance`, { headers: getAuthHeaders() }),
        fetch(`${API_CONFIG.HRM_BASE}/payroll`, { headers: getAuthHeaders() })
      ]);

      if (employeesRes.ok) setEmployees(await employeesRes.json());
      if (leavesRes.ok) setLeaves(await leavesRes.json());
      if (attendanceRes.ok) setAttendance(await attendanceRes.json());
      if (payrollRes.ok) setPayroll(await payrollRes.json());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmployee = async () => {
    if (!employeeForm.full_name || !employeeForm.employee_code) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const url = editingEmployee
        ? `${API_CONFIG.HRM_BASE}/employees/${editingEmployee.id}`
        : `${API_CONFIG.HRM_BASE}/employees`;
      const method = editingEmployee ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(employeeForm)
      });

      if (response.ok) {
        toast.success(`Employee ${editingEmployee ? 'updated' : 'created'} successfully`);
        setEmployeeDialog(false);
        setEditingEmployee(null);
        setEmployeeForm({
          employee_code: "",
          full_name: "",
          email: "",
          phone: "",
          designation: "",
          department: "",
          employment_type: "full_time",
          joining_date: format(new Date(), "yyyy-MM-dd"),
          basic_salary: 0,
          allowances: 0
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to save employee");
      }
    } catch (error) {
      toast.error("Error saving employee");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.HRM_BASE}/employees/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success("Employee deleted successfully");
        loadData();
      } else {
        toast.error("Failed to delete employee");
      }
    } catch (error) {
      toast.error("Error deleting employee");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!leaveForm.employee_id) {
      toast.error("Please select an employee");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.HRM_BASE}/leaves`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(leaveForm)
      });

      if (response.ok) {
        toast.success("Leave application submitted successfully");
        setLeaveDialog(false);
        setLeaveForm({
          employee_id: "",
          leave_type: "casual",
          start_date: format(new Date(), "yyyy-MM-dd"),
          end_date: format(new Date(), "yyyy-MM-dd"),
          total_days: 1,
          reason: ""
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to apply leave");
      }
    } catch (error) {
      toast.error("Error applying leave");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.HRM_BASE}/leaves/${id}/approve`, {
        method: "POST",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success("Leave approved");
        loadData();
      } else {
        toast.error("Failed to approve leave");
      }
    } catch (error) {
      toast.error("Error approving leave");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLeave = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.HRM_BASE}/leaves/${id}/reject?reason=${encodeURIComponent(reason)}`, {
        method: "POST",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success("Leave rejected");
        loadData();
      } else {
        toast.error("Failed to reject leave");
      }
    } catch (error) {
      toast.error("Error rejecting leave");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Prominent Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 p-8 rounded-2xl border-2 border-amber-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">
                Human Resource Management
              </h1>
              <p className="text-white/90 text-base">
                Manage employees, attendance, payroll, and leaves
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 text-center">
              <div className="text-xs text-white/70 font-medium">EMPLOYEES</div>
              <div className="text-2xl font-bold text-white">{employees.length}</div>
            </div>
            <Button 
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg" 
              onClick={() => {
                setActiveTab("employees");
                setEmployeeDialog(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="employees"><Users className="w-4 h-4 mr-2" />Employees ({employees.length})</TabsTrigger>
          <TabsTrigger value="attendance"><Calendar className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
          <TabsTrigger value="payroll"><DollarSign className="w-4 h-4 mr-2" />Payroll</TabsTrigger>
          <TabsTrigger value="leaves"><FileText className="w-4 h-4 mr-2" />Leaves ({leaves.length})</TabsTrigger>
        </TabsList>

        {/* EMPLOYEES TAB */}
        <TabsContent value="employees">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Employees</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
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
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No employees found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Salary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell><Badge variant="outline">{employee.employee_code}</Badge></TableCell>
                          <TableCell className="font-medium">{employee.full_name}</TableCell>
                          <TableCell>{employee.designation || "-"}</TableCell>
                          <TableCell>{employee.department || "-"}</TableCell>
                          <TableCell>{employee.phone}</TableCell>
                          <TableCell className="text-right">৳{employee.basic_salary.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={employee.is_active ? "default" : "secondary"}>
                              {employee.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingEmployee(employee);
                                  setEmployeeForm({
                                    employee_code: employee.employee_code,
                                    full_name: employee.full_name,
                                    email: employee.email || "",
                                    phone: employee.phone,
                                    designation: employee.designation || "",
                                    department: employee.department || "",
                                    employment_type: employee.employment_type,
                                    joining_date: employee.joining_date,
                                    basic_salary: employee.basic_salary,
                                    allowances: 0
                                  });
                                  setEmployeeDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteEmployee(employee.id)}
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

        {/* ATTENDANCE TAB */}
        <TabsContent value="attendance">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Attendance Records</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Attendance tracking - {attendance.length} records
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYROLL TAB */}
        <TabsContent value="payroll">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Payroll</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Payroll management - {payroll.length} records
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEAVES TAB */}
        <TabsContent value="leaves">
          <Card className="pharmacy-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Leave Applications</CardTitle>
                <Button className="pharmacy-button" onClick={() => setLeaveDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Apply Leave
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : leaves.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No leave applications yet
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map((leave) => {
                        const employee = employees.find(e => e.id === leave.employee_id);
                        return (
                          <TableRow key={leave.id}>
                            <TableCell className="font-medium">{employee?.full_name || "Unknown"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{leave.leave_type}</Badge>
                            </TableCell>
                            <TableCell>{format(new Date(leave.start_date), "dd MMM yyyy")}</TableCell>
                            <TableCell>{format(new Date(leave.end_date), "dd MMM yyyy")}</TableCell>
                            <TableCell>{leave.total_days} days</TableCell>
                            <TableCell>
                              <Badge variant={
                                leave.status === "approved" ? "default" :
                                leave.status === "rejected" ? "destructive" : "secondary"
                              }>
                                {leave.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {leave.status === "pending" && (
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveLeave(leave.id)}
                                    title="Approve"
                                  >
                                    <Check className="w-4 h-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectLeave(leave.id)}
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee Dialog */}
      <Dialog open={employeeDialog} onOpenChange={setEmployeeDialog}>
        <DialogContent className="glass-strong max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            <DialogDescription>Enter employee details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employee Code *</Label>
              <Input
                value={employeeForm.employee_code}
                onChange={(e) => setEmployeeForm({ ...employeeForm, employee_code: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input
                value={employeeForm.full_name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, full_name: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Designation</Label>
              <Input
                value={employeeForm.designation}
                onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Department</Label>
              <Input
                value={employeeForm.department}
                onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Employment Type</Label>
              <Select
                value={employeeForm.employment_type}
                onValueChange={(value) => setEmployeeForm({ ...employeeForm, employment_type: value })}
              >
                <SelectTrigger className="pharmacy-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Joining Date *</Label>
              <Input
                type="date"
                value={employeeForm.joining_date}
                onChange={(e) => setEmployeeForm({ ...employeeForm, joining_date: e.target.value })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Basic Salary</Label>
              <Input
                type="number"
                value={employeeForm.basic_salary}
                onChange={(e) => setEmployeeForm({ ...employeeForm, basic_salary: parseFloat(e.target.value) || 0 })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Allowances</Label>
              <Input
                type="number"
                value={employeeForm.allowances}
                onChange={(e) => setEmployeeForm({ ...employeeForm, allowances: parseFloat(e.target.value) || 0 })}
                className="pharmacy-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmployeeDialog(false)}>Cancel</Button>
            <Button className="pharmacy-button" onClick={handleSaveEmployee} disabled={loading}>
              {loading ? "Saving..." : "Save Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Dialog */}
      <Dialog open={leaveDialog} onOpenChange={setLeaveDialog}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit a leave application</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select
                value={leaveForm.employee_id}
                onValueChange={(value) => setLeaveForm({ ...leaveForm, employee_id: value })}
              >
                <SelectTrigger className="pharmacy-input">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.is_active).map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Leave Type *</Label>
              <Select
                value={leaveForm.leave_type}
                onValueChange={(value) => setLeaveForm({ ...leaveForm, leave_type: value })}
              >
                <SelectTrigger className="pharmacy-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                  className="pharmacy-input"
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                  className="pharmacy-input"
                />
              </div>
            </div>
            <div>
              <Label>Total Days *</Label>
              <Input
                type="number"
                value={leaveForm.total_days}
                onChange={(e) => setLeaveForm({ ...leaveForm, total_days: parseFloat(e.target.value) || 1 })}
                className="pharmacy-input"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                className="pharmacy-input"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialog(false)}>Cancel</Button>
            <Button className="pharmacy-button" onClick={handleApplyLeave} disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
