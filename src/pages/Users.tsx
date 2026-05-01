import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Users as UsersIcon, Plus, Edit, Search, RefreshCw, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { API_CONFIG, apiCall } from '@/config/api';
import { apiClient } from '@/integrations/api/client';

import { logger } from "@/utils/logger";

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'pharmacy_manager', label: 'Pharmacy Manager' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'stock_clerk', label: 'Stock Clerk' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'employee', label: 'Employee' },
];

const ROLE_BADGE_VARIANTS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  pharmacy_manager: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  pharmacist: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  cashier: 'bg-green-100 text-green-800 border-green-200',
  stock_clerk: 'bg-orange-100 text-orange-800 border-orange-200',
  accountant: 'bg-teal-100 text-teal-800 border-teal-200',
  employee: 'bg-gray-100 text-gray-800 border-gray-200',
};

interface SystemUser {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  roles: string[];
  created_at?: string;
}

interface AddUserForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

const Users = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<SystemUser | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState<AddUserForm>({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'employee',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiCall<SystemUser[]>(`${API_CONFIG.API_ROOT}/users`);
      setUsers(data);
    } catch (error: any) {
      logger.error('Error loading users:', error);
      toast.error(error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!addForm.full_name || !addForm.email || !addForm.password) {
      toast.error('Name, email and password are required');
      return;
    }
    setSaving(true);
    try {
      // Register the user via existing auth endpoint
      await apiClient.registerUser({
        full_name: addForm.full_name,
        email: addForm.email,
        password: addForm.password,
        phone: addForm.phone || undefined,
      });

      // After registration, find the new user and update their role if not 'employee'
      // Reload users first to get the new user's ID
      const updatedUsers = await apiCall<SystemUser[]>(`${API_CONFIG.API_ROOT}/users`);
      setUsers(updatedUsers);

      if (addForm.role !== 'employee') {
        const newUser = updatedUsers.find((u) => u.email === addForm.email.toLowerCase().trim());
        if (newUser) {
          await apiCall(`${API_CONFIG.API_ROOT}/users/${newUser.id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role: addForm.role }),
          });
          // Reload again to reflect role update
          const finalUsers = await apiCall<SystemUser[]>(`${API_CONFIG.API_ROOT}/users`);
          setUsers(finalUsers);
        }
      }

      toast.success(`User ${addForm.full_name} created successfully`);
      setAddDialogOpen(false);
      setAddForm({ full_name: '', email: '', password: '', phone: '', role: 'employee' });
    } catch (error: any) {
      logger.error('Error creating user:', error);
      toast.error(error?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditRole = (user: SystemUser) => {
    setEditUser(user);
    setEditRole(user.role || 'employee');
    setEditDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await apiCall(`${API_CONFIG.API_ROOT}/users/${editUser.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: editRole }),
      });
      toast.success(`Role updated to ${editRole}`);
      setEditDialogOpen(false);
      setEditUser(null);
      // Optimistically update list
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, role: editRole, roles: [editRole] } : u))
      );
    } catch (error: any) {
      logger.error('Error updating role:', error);
      toast.error(error?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    const r = u.role || 'employee';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-gray-700 to-slate-800 p-8 rounded-2xl border-2 border-slate-200/20 shadow-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <UsersIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-1">User Management</h1>
              <p className="text-white/90 text-base">
                {users.length} system user{users.length !== 1 ? 's' : ''} — manage accounts and roles
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg">
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <Label>Full Name *</Label>
                    <Input
                      value={addForm.full_name}
                      onChange={(e) => setAddForm((f) => ({ ...f, full_name: e.target.value }))}
                      placeholder="e.g. John Smith"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={addForm.password}
                      onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone (optional)</Label>
                    <Input
                      value={addForm.phone}
                      onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+880..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Select
                      value={addForm.role}
                      onValueChange={(v) => setAddForm((f) => ({ ...f, role: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser} disabled={saving}>
                    {saving ? 'Creating…' : 'Create User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Role summary pills */}
        {Object.keys(roleCounts).length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-2 mt-5">
            {Object.entries(roleCounts).map(([role, count]) => (
              <span
                key={role}
                className="px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm"
              >
                {count} {role.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Users Table */}
      <Card className="pharmacy-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>System Users</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or role…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm ? 'No users match your search.' : 'No users found.'}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const role = user.role || 'employee';
                    const badgeClass = ROLE_BADGE_VARIANTS[role] || ROLE_BADGE_VARIANTS.employee;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">{user.phone || '—'}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs font-semibold border ${badgeClass}`}>
                            {role.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleOpenEditRole(user)}
                          >
                            <Shield className="w-3 h-3" />
                            Change Role
                          </Button>
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

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Change Role
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-sm text-muted-foreground">User</p>
                <p className="font-medium">{editUser.full_name}</p>
                <p className="text-sm text-muted-foreground">{editUser.email}</p>
              </div>
              <div className="space-y-1">
                <Label>New Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving ? 'Saving…' : 'Save Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
