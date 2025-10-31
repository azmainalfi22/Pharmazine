import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users as UsersIcon } from 'lucide-react';

const Users = () => {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 p-8 rounded-2xl border-2 border-teal-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <UsersIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">User Management</h1>
            <p className="text-white/90 text-base">
              Manage users and their roles
            </p>
          </div>
        </div>
      </div>

      <Card className="p-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-muted">
              <UsersIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">User Management</h3>
            <p className="text-muted-foreground">
              User management features coming soon
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Users;
