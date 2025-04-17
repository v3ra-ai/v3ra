import { useEffect, useRef } from "react";

interface UseAutoRefreshOptions {
  isEnabled: boolean;
  intervalMs?: number;
  fetchFunctions: Array<() => Promise<void>>;
}

export function useAutoRefresh({
  isEnabled,
  intervalMs = 5000,
  fetchFunctions,
}: UseAutoRefreshOptions) {
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isEnabled) {
      intervalIdRef.current = setInterval(async () => {
        try {
          await Promise.all(fetchFunctions.map((fn) => fn()));
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error("Auto-refresh failed:", error);
        }
      }, intervalMs);
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isEnabled, intervalMs, fetchFunctions]);
}
