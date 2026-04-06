/**
 * Multi-Branch Management
 * NEW FEATURE: Manage multiple pharmacy branches with full API integration
 */
import { useState, useEffect } from "react";
import {
  Plus,
  Building2,
  MapPin,
  Users,
  TrendingUp,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import apiClient from "@/integrations/api/client";

interface Branch {
  id: number;
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  manager_phone?: string;
  is_active: boolean;
  is_head_office: boolean;
  opening_date?: string;
  total_employees: number;
  monthly_sales_target: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface BranchStats {
  total_branches: number;
  active_branches: number;
  inactive_branches: number;
  total_employees: number;
}

export default function MultiBranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<BranchStats>({
    total_branches: 0,
    active_branches: 0,
    inactive_branches: 0,
    total_employees: 0,
  });
  const [loading, setLoading] = useState(false);
  const [branchDialog, setBranchDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [branchForm, setBranchForm] = useState({
    code: "",
    name: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    phone: "",
    email: "",
    manager_name: "",
    manager_phone: "",
    total_employees: 0,
    monthly_sales_target: 0,
    notes: "",
  });

  // Fetch branches from API
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/branches/");
      setBranches(response.data);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      toast.error(error.response?.data?.detail || "Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  // Fetch branch statistics
  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/api/branches/stats");
      setStats(response.data);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchStats();
  }, []);

  const resetForm = () => {
    setBranchForm({
      code: "",
      name: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      phone: "",
      email: "",
      manager_name: "",
      manager_phone: "",
      total_employees: 0,
      monthly_sales_target: 0,
      notes: "",
    });
    setEditMode(false);
    setSelectedBranch(null);
  };

  const handleAddBranch = async () => {
    try {
      if (!branchForm.code || !branchForm.name) {
        toast.error("Branch code and name are required");
        return;
      }

      setLoading(true);
      const response = await apiClient.post("/api/branches/", branchForm);

      setBranches([...branches, response.data]);
      toast.success("Branch added successfully!");
      setBranchDialog(false);
      resetForm();
      fetchStats(); // Refresh stats
    } catch (error: any) {
      console.error("Error adding branch:", error);
      toast.error(error.response?.data?.detail || "Failed to add branch");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBranch = async () => {
    try {
      if (!selectedBranch) return;

      setLoading(true);
      const response = await apiClient.put(
        `/api/branches/${selectedBranch.id}`,
        branchForm
      );

      setBranches(
        branches.map((b) => (b.id === selectedBranch.id ? response.data : b))
      );
      toast.success("Branch updated successfully!");
      setBranchDialog(false);
      resetForm();
      fetchStats();
    } catch (error: any) {
      console.error("Error updating branch:", error);
      toast.error(error.response?.data?.detail || "Failed to update branch");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setBranchForm({
      code: branch.code,
      name: branch.name,
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      postal_code: branch.postal_code || "",
      phone: branch.phone || "",
      email: branch.email || "",
      manager_name: branch.manager_name || "",
      manager_phone: branch.manager_phone || "",
      total_employees: branch.total_employees,
      monthly_sales_target: branch.monthly_sales_target,
      notes: branch.notes || "",
    });
    setEditMode(true);
    setBranchDialog(true);
  };

  const handleDeleteBranch = async (branchId: number) => {
    if (!confirm("Are you sure you want to deactivate this branch?")) return;

    try {
      setLoading(true);
      await apiClient.delete(`/api/branches/${branchId}`);

      // Refresh the list
      fetchBranches();
      fetchStats();
      toast.success("Branch deactivated successfully");
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      toast.error(
        error.response?.data?.detail || "Failed to deactivate branch"
      );
    } finally {
      setLoading(false);
    }
  };

  const totalSales = branches.reduce(
    (sum, b) => sum + b.monthly_sales_target,
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Multi-Branch Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all pharmacy branches from one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchBranches();
              fetchStats();
            }}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setBranchDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Branch
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_branches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.active_branches}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_employees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sales Target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ৳{totalSales.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Branch List</CardTitle>
          <CardDescription>
            View and manage all pharmacy branches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && branches.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2">Loading branches...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-gray-600 mt-2">
                No branches found. Add your first branch!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {branch.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {branch.city || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        {branch.manager_name || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{branch.total_employees}</TableCell>
                    <TableCell>
                      ৳{branch.monthly_sales_target.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={branch.is_active ? "default" : "secondary"}
                      >
                        {branch.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBranch(branch)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBranch(branch.id)}
                        >
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

      {/* Add/Edit Branch Dialog */}
      <Dialog open={branchDialog} onOpenChange={setBranchDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Branch" : "Add New Branch"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Update branch information"
                : "Create a new pharmacy branch"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Branch Name *</Label>
                <Input
                  value={branchForm.name}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, name: e.target.value })
                  }
                  placeholder="e.g., Gulshan Branch"
                />
              </div>
              <div>
                <Label>Branch Code *</Label>
                <Input
                  value={branchForm.code}
                  onChange={(e) =>
                    setBranchForm({
                      ...branchForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g., BR002"
                  disabled={editMode}
                />
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={branchForm.address}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, address: e.target.value })
                }
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={branchForm.city}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, city: e.target.value })
                  }
                  placeholder="e.g., Dhaka"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={branchForm.state}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, state: e.target.value })
                  }
                  placeholder="State/Province"
                />
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input
                  value={branchForm.postal_code}
                  onChange={(e) =>
                    setBranchForm({
                      ...branchForm,
                      postal_code: e.target.value,
                    })
                  }
                  placeholder="Postal code"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={branchForm.phone}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, phone: e.target.value })
                  }
                  placeholder="+880 1234567890"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={branchForm.email}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, email: e.target.value })
                  }
                  placeholder="branch@pharmacy.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Branch Manager</Label>
                <Input
                  value={branchForm.manager_name}
                  onChange={(e) =>
                    setBranchForm({
                      ...branchForm,
                      manager_name: e.target.value,
                    })
                  }
                  placeholder="Manager name"
                />
              </div>
              <div>
                <Label>Manager Phone</Label>
                <Input
                  value={branchForm.manager_phone}
                  onChange={(e) =>
                    setBranchForm({
                      ...branchForm,
                      manager_phone: e.target.value,
                    })
                  }
                  placeholder="Manager contact"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Employees</Label>
                <Input
                  type="number"
                  value={branchForm.total_employees}
                  onChange={(e) =>
                    setBranchForm({
                      ...branchForm,
                      total_employees: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Monthly Sales Target (৳)</Label>
                <Input
                  type="number"
                  value={branchForm.monthly_sales_target}
                  onChange={(e) =>
                    setBranchForm({
                      ...branchForm,
                      monthly_sales_target: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={branchForm.notes}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, notes: e.target.value })
                }
                placeholder="Additional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBranchDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editMode ? handleUpdateBranch : handleAddBranch}
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editMode
                ? "Update Branch"
                : "Add Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

