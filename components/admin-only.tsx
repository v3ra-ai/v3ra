/**
 * A wrapper component that restricts content to admin users based on email.
 * Uses Shadcn UI and Tailwind CSS for styling.
 */

'use client';

import { useAdminAuth } from '@/utils/auth-admin-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminOnlyProps {
  children: React.ReactNode;
}

export default function AdminOnly({ children }: AdminOnlyProps) {
  const { isAuthorized, isAuthenticated, error, isLoading } = useAdminAuth();
  const router = useRouter();

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
          <div className="mt-4">
            <Button onClick={() => router.push('/login')} className="w-full sm:w-auto">
              Sign In
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
          <div className="mt-4">
            <Button onClick={() => router.push('/')} className="w-full sm:w-auto">
              Go to Home
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}