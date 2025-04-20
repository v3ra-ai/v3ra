// components/ask/consensus/network-status.tsx
import { useNetworkState } from "@/hooks/useNetworkState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NetworkStatus() {
  const { networkState, isLoading, error } = useNetworkState();

  // Fallbacks for when networkState is null
  const validators = networkState?.validators || [];
  const currentLeaderIndex = networkState?.currentLeaderIndex ?? 0;
  const isVoting = networkState?.isVoting || false;
  const currentQuery = networkState?.lastQuery || null;

  // Safely access the leader
  const leader =
    Array.isArray(validators) && validators.length > currentLeaderIndex
      ? validators[currentLeaderIndex]
      : null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-48 w-full">
        <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
          Network Status
        </h3>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl h-24 w-full flex items-center justify-center">
          <span className="text-gray-400 dark:text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-48 w-full">
        <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
          Network Status
        </h3>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl h-24 w-full flex items-center justify-center">
          <span className="text-red-500">Error: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 w-full">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-md font-medium text-gray-800 dark:text-zinc-200">
          Network Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
            <CardHeader className="p-0 mb-0">
              <h4 className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                Network Overview
              </h4>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="text-gray-500">Validators:</div>
                  <div className="font-medium">{validators.length}</div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="text-gray-500">Status:</div>
                  <div className="font-medium">
                    {isVoting ? (
                      <span className="text-yellow-500">
                        Voting in Progress
                      </span>
                    ) : (
                      <span className="text-green-500">Ready</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="text-gray-500">Current Leader:</div>
                  <div className="font-medium" title={leader?.id || "None"}>
                    {leader?.id
                      ? leader.id.length > 30
                        ? `${leader.id.slice(0, 27)}...`
                        : leader.id
                      : "None"}
                  </div>
                </div>
                {currentQuery && (
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div className="text-gray-500">Current Query:</div>
                    <div className="font-medium max-w-full">
                      {currentQuery.length > 40
                        ? `${currentQuery.substring(0, 37)}...`
                        : currentQuery}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
            <CardHeader className="p-0 mb-0">
              <h4 className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                Leader Information
              </h4>
            </CardHeader>
            <CardContent className="p-0">
              {leader ? (
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div className="text-gray-500">Profile:</div>
                    <div className="font-medium">{leader.profileName}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div className="text-gray-500">Provider:</div>
                    <div className="font-medium">{leader.provider}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div className="text-gray-500">Public Key:</div>
                    <div className="font-medium truncate max-w-[150px]">
                      {leader.publicKey.length > 30
                        ? `${leader.publicKey.substring(0, 27)}...`
                        : leader.publicKey}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div className="text-gray-500">ID:</div>
                    <div className="font-medium">
                      {leader.id.length > 30
                        ? `${leader.id.substring(0, 27)}...`
                        : leader.id}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No leader selected</p>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
