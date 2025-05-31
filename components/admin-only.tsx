/**
 * A wrapper component that restricts content to admin users based on email.
 * Uses Shadcn UI and Tailwind CSS for styling.
 */

'use client';

import { useAdminAuth } from '@/utils/auth-admin-client-utils';
import { filterUndefined } from '@/utils/filter-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminOnlyProps {
  children: React.ReactNode;
}

export default function AdminOnly({ children }: AdminOnlyProps) {
  const { isAuthorized, isAuthenticated, error, isLoading, userEmail } = useAdminAuth();
  const router = useRouter();
  const [, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isLoading && typeof window.NREUM?.recordCustomEvent === 'function') {
      window.NREUM.recordCustomEvent('AdminOnlyAccess', filterUndefined({
        isAuthorized,
        isAuthenticated,
        userEmail: userEmail ?? undefined,
        error: error ?? undefined,
        time: new Date().toISOString(),
      }));
    }
  }, [isAuthorized, isAuthenticated, userEmail, error, isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto my-4">
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          {error || 'You must be signed in to access this content.'}
          <div className="mt-4 space-y-2">
            <Button onClick={() => router.push('/login')} className="w-full sm:w-auto">
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRetryKey((prev) => prev + 1);
                router.refresh();
              }}
              className="w-full sm:w-auto"
            >
              Retry Authentication
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isAuthorized) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto my-4">
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          {error || 'You are not authorized to access this content.'}
          <div className="mt-4 space-y-2">
            <Button onClick={() => router.push('/')} className="w-full sm:w-auto">
              Go to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRetryKey((prev) => prev + 1);
                router.refresh();
              }}
              className="w-full sm:w-auto"
            >
              Retry Authentication
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}