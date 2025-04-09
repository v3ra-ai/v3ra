import type { NetworkState } from "@/lib/types";

interface NetworkStatsProps {
  networkState: NetworkState;
}

export function NetworkStats({ networkState }: NetworkStatsProps) {
  // Safely destructure networkState with fallbacks
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">Network Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">
              Validators:
            </span>
            <span className="font-medium">{validators.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">
              Current Leader:
            </span>
            <span className="font-medium">{leader?.id || "None"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
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
              <span className="text-gray-500 dark:text-gray-400">
                Current Query:
              </span>
              <span className="font-medium">{currentQuery}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">Leader Information</h3>
        {leader ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">ID:</span>
              <span className="font-medium">{leader.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Profile:</span>
              <span className="font-medium">{leader.profileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Provider:
              </span>
              <span className="font-medium">{leader.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Public Key:
              </span>
              <span className="font-medium truncate max-w-[150px]">
                {leader.publicKey}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No leader selected</p>
        )}
      </div>
    </div>
  );
}
