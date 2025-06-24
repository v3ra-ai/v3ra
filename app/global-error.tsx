"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-zinc-900">
          <div className="max-w-md w-full bg-zinc-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Something went wrong!
            </h2>
            <p className="text-zinc-300 mb-4">
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={reset}
              className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}