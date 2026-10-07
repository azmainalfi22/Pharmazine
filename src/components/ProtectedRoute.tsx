import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Waits for the saved session to be restored, then renders the page.
 * Visitors who are not signed in are NOT redirected to /auth — they use the
 * app in guest mode (see src/guest) and can sign in later from the sidebar.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
