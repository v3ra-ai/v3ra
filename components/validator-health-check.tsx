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

  // Function to check validator and API key health
  const checkHealth = React.useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/health-check");
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      setHealth(data);

      // If there's an issue, call the onHealthIssue callback
      if (data.status === "error" && onHealthIssue) {
        onHealthIssue(data.message);
      }
    } catch (error) {
      console.error("Failed to check validator health:", error);
      setHealth({
        status: "error",
        message: "Failed to check validator health",
        details: {
          apiKeysCount: 0,
          activeValidatorsCount: 0,
          validatorsWithKeysCount: 0,
          decryptionSuccess: false,
        },
      });

      if (onHealthIssue) {
        onHealthIssue("Failed to check validator health");
      }
    } finally {
      setLoading(false);
    }
  }, [onHealthIssue]);

  // Fetch health data when component mounts
  React.useEffect(() => {
    checkHealth();

    // Set up interval to check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
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

  // Determine indicator color based on status
  const statusColors = {
    healthy: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

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
          <div
            className={`h-3 w-3 rounded-full ${statusColors[health.status]}`}
          ></div>
          <span
            className={`text-sm ${health.status === "healthy" ? "text-gray-300" : "text-white"}`}
          >
            {health.message || <div className="w-full dark:text-gray-200 items-center justify-center">Validators Healthy</div>}
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
        <div className="p-3 bg-gray-800 rounded-md shadow-inner text-sm text-gray-300 space-y-2 border border-gray-700">
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
