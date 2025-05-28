"use client";

import * as React from "react";

// Health check status interface
interface ValidatorHealth {
  status: "healthy" | "warning" | "error";
  message: string;
  details?: {
    apiKeysCount: number;
    activeValidatorsCount: number;
    validatorsWithKeysCount: number;
    lastVoteTimestamp?: string;
    decryptionSuccess: boolean;
  };
}

interface HealthCheckProps {
  onHealthIssue?: (issue: string) => void;
  className?: string;
}

/**
 * ValidatorHealthCheck component
 *
 * This component monitors the health of validators and API keys,
 * showing real-time status and helping prevent issues like the ones we fixed.
 */
export function ValidatorHealthCheck({
  onHealthIssue,
  className = "",
}: HealthCheckProps) {
  const [health, setHealth] = React.useState<ValidatorHealth | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [expanded, setExpanded] = React.useState<boolean>(false);

  // Singleton interval management
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = React.useRef<boolean>(false);

  // Function to check validator and API key health
  const checkHealth = React.useCallback(async () => {
    if (isCheckingRef.current) {
      console.log("[ValidatorHealthCheck] Skipping checkHealth: already in progress");
      return;
    }

    isCheckingRef.current = true;
    setLoading(true);

    try {
      console.log("[ValidatorHealthCheck] Fetching /api/admin/health-check");
      const response = await fetch("/api/admin/health-check");
      const data = await response.json();
      
      if (!response.ok) {
        console.error("[ValidatorHealthCheck] Health check failed:", data);
        throw new Error(data.message || `HTTP error: ${response.status}`);
      }

      console.log("[ValidatorHealthCheck] Health check successful:", data);
      setHealth(data);

      // If there's an issue, call the onHealthIssue callback
      if (data.status === "error" && onHealthIssue) {
        onHealthIssue(data.message);
      }
    } catch (err) {
      console.error("[ValidatorHealthCheck] Failed to check validator health:", err);
      
      // Type guard to check if error is an instance of Error
      const error = err as Error & {
        response?: {
          data?: {
            error?: Record<string, unknown>;
          };
        };
      };
      
      const errorMessage = error.message || 'Unknown error';
      const errorDetails = error?.response?.data?.error || {};
      
      setHealth({
        status: "error",
        message: errorMessage,
        details: {
          ...errorDetails,
          apiKeysCount: 0,
          activeValidatorsCount: 0,
          validatorsWithKeysCount: 0,
          decryptionSuccess: false,
        },
      });

      if (onHealthIssue) {
        onHealthIssue(`Health check failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
    }
  }, [onHealthIssue]);

  // Singleton interval setup
  React.useEffect(() => {
    // Only set up interval if not already running
    if (!intervalRef.current) {
      console.log("[ValidatorHealthCheck] Setting up singleton interval");
      checkHealth(); // Initial check on mount

      intervalRef.current = setInterval(() => {
        console.log("[ValidatorHealthCheck] Running scheduled health check");
        checkHealth();
      }, 30000);
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        console.log("[ValidatorHealthCheck] Clearing singleton interval");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkHealth]);

  // Function to toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // If health check hasn't run yet, show loading indicator
  if (!health) {
    return (
      <div
        className={`flex items-center space-x-2 p-3 bg-gray-800 rounded-md ${className}`}
      >
        <div className="animate-pulse h-3 w-3 rounded-full bg-yellow-500"></div>
        <span className="text-gray-400 text-sm">
          Checking validator health...
        </span>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (health.status) {
      case "healthy":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Don't show the health check UI if everything is healthy and not expanded
  if (health.status === "healthy" && !expanded) {
    return null;
  }

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ${className}`}
      data-testid="validator-health-check"
    >
      <div
        className={`p-3 mb-1 rounded-md cursor-pointer flex items-center justify-between ${
          health.status === "healthy"
            ? "bg-gray-800 hover:bg-gray-700"
            : health.status === "warning"
              ? "bg-yellow-900 hover:bg-yellow-800"
              : "bg-red-900 hover:bg-red-800"
        }`}
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-medium">
            {health.status === "healthy"
              ? "All systems operational"
              : health.message || "System issue detected"}
          </span>
        </div>

        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              checkHealth();
            }}
            className="text-xs text-gray-400 hover:text-gray-200 mr-2"
            title="Refresh health check"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${expanded ? "transform rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {expanded && health.details && (
        <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
              <span className="text-sm font-medium">
                {health.status === "healthy"
                  ? "All systems operational"
                  : health.message || "System issue detected"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Active Validators:</span>
              <span
                className={
                  health.details.activeValidatorsCount === 0
                    ? "text-red-400"
                    : "text-green-400"
                }
              >
                {health.details.activeValidatorsCount}
              </span>
            </div>
          </div>

          <div className="flex justify-between">
            <span>API Keys:</span>
            <span
              className={
                health.details.apiKeysCount === 0
                  ? "text-red-400"
                  : "text-green-400"
              }
            >
              {health.details.apiKeysCount}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Active Validators (Duplicate):</span>
            <span
              className={
                health.details.activeValidatorsCount === 0
                  ? "text-red-400"
                  : "text-green-400"
              }
            >
              {health.details.activeValidatorsCount}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Validators with Keys:</span>
            <span
              className={
                health.details.validatorsWithKeysCount !==
                health.details.activeValidatorsCount
                  ? "text-red-400"
                  : "text-green-400"
              }
            >
              {health.details.validatorsWithKeysCount} /{" "}
              {health.details.activeValidatorsCount}
            </span>
          </div>

          <div className="flex justify-between">
            <span>API Key Decryption:</span>
            <span
              className={
                health.details.decryptionSuccess
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {health.details.decryptionSuccess ? "Working" : "Failed"}
            </span>
          </div>

          {health.details.lastVoteTimestamp && (
            <div className="flex justify-between">
              <span>Last Vote:</span>
              <span>
                {new Date(health.details.lastVoteTimestamp).toLocaleString()}
              </span>
            </div>
          )}

          {health.status !== "healthy" && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    window.open("/api/admin/diagnose-keys", "_blank")
                  }
                  className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Diagnose API Keys
                </button>

                <button
                  onClick={() =>
                    window.open("/api/admin/repair-keys", "_blank")
                  }
                  className="text-xs px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Repair API Keys
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}