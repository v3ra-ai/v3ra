'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry
    if (typeof window !== 'undefined') {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          tags: {
            errorBoundary: 'app-error',
          },
          extra: {
            digest: error.digest,
          },
        });
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          Something went wrong!
        </h1>
        <p className="text-gray-400 mb-8">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Go home
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-gray-400">
              Error details (development only)
            </summary>
            <div className="mt-2 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 font-mono">{error.message}</p>
              {error.stack && (
                <pre className="mt-2 text-xs text-red-300 overflow-auto">{error.stack}</pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}