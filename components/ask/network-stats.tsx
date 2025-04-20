import type { NetworkState } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NetworkStatsProps {
  networkState?: NetworkState; // Optional to handle loading state
}

export function NetworkStats({ networkState }: NetworkStatsProps) {
  // Fallbacks for when networkState is undefined (e.g., during loading)
  const validators = networkState?.validators || [];
  const currentLeaderIndex = networkState?.currentLeaderIndex ?? 0;
  const isVoting = networkState?.isVoting || false;
  const currentQuery = networkState?.lastQuery || null;

  // Safely access the leader
  const leader =
    Array.isArray(validators) && validators.length > currentLeaderIndex
      ? validators[currentLeaderIndex]
      : null;

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Network Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-base font-medium text-gray-900 dark:text-white">
              Network Overview
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Validators:</span>
                <span className="font-medium">{validators.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Leader:</span>
                <span className="font-medium">{leader?.id || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium">
                  {isVoting ? (
                    <span className="text-yellow-500">Voting in Progress</span>
                  ) : (
                    <span className="text-green-500">Ready</span>
                  )}
                </span>
              </div>
              {currentQuery && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Query:</span>
                  <span className="font-medium truncate max-w-[200px]">
                    {currentQuery}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-medium text-gray-900 dark:text-white">
              Leader Information
            </h3>
            {leader ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID:</span>
                  <span className="font-medium">{leader.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Profile:</span>
                  <span className="font-medium">{leader.profileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Provider:</span>
                  <span className="font-medium">{leader.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Public Key:</span>
                  <span className="font-medium truncate max-w-[150px]">
                    {leader.publicKey}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No leader selected</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}