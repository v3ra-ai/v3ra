import { useEffect, useRef } from "react";

interface UseAutoRefreshOptions {
  isEnabled: boolean;
  intervalMs?: number;
  fetchCallbacks: Array<() => Promise<void>>;
}

export function useAutoRefresh({
  isEnabled,
  intervalMs = 5000,
  fetchCallbacks,
}: UseAutoRefreshOptions) {
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start interval only if enabled
    if (isEnabled) {
      intervalIdRef.current = setInterval(async () => {
        try {
          // Execute all fetch callbacks in parallel
          await Promise.all(fetchCallbacks.map((fn) => fn()));
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error("Auto-refresh failed:", error);
        }
      }, intervalMs);
    }

    // Cleanup interval on unmount or change
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isEnabled, intervalMs, fetchCallbacks]);
}