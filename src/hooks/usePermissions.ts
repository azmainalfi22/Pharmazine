import { useState, useEffect } from 'react';

export interface UserPermissions {
  user_id: string;
  roles: string[];
  permissions: string[];
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const { apiClient: client } = await import('@/integrations/api/client');
      const data = await client.getUserPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!permissions) return false;
    return permissions.permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    if (!permissions) return false;
    return perms.some(perm => permissions.permissions.includes(perm));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    if (!permissions) return false;
    return perms.every(perm => permissions.permissions.includes(perm));
  };

  const hasRole = (role: string): boolean => {
    if (!permissions) return false;
    return permissions.roles.includes(role);
  };

  const isAdmin = (): boolean => {
    if (!permissions) return false;
    return permissions.roles.includes('admin') || permissions.roles.includes('super_admin');
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
  };
};

