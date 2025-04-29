
import { useNetworkState } from "@/hooks/useNetworkState";
import { NetworkState } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DOMPurify from "dompurify";

const StatusCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
    <CardHeader className="p-0 mb-0">
      <h4 className="text-sm font-medium text-gray-800 dark:text-zinc-200">{title}</h4>
    </CardHeader>
    <CardContent className="p-0">{children}</CardContent>
  </Card>
);

const getNetworkStateDefaults = (networkState: NetworkState | null) => ({
  validators: networkState?.validators || [],
  currentLeaderIndex: networkState?.currentLeaderIndex ?? 0,
  isVoting: networkState?.isVoting || false,
  currentQuery: networkState?.lastQuery || null,
});

const truncateText = (text: string, maxLength: number) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;

export default function NetworkStatus() {
  const { networkState, isLoading, error } = useNetworkState();

  const { validators, currentLeaderIndex, isVoting, currentQuery } = getNetworkStateDefaults(networkState);

  // Sanitize fields to prevent XSS
  const sanitizedCurrentQuery = currentQuery ? DOMPurify.sanitize(currentQuery) : null;
  const sanitizedLeader = Array.isArray(validators) && validators.length > currentLeaderIndex
    ? {
        ...validators[currentLeaderIndex],
        id: DOMPurify.sanitize(validators[currentLeaderIndex].id || ""),
        profileName: DOMPurify.sanitize(validators[currentLeaderIndex].profileName || ""),
        provider: DOMPurify.sanitize(validators[currentLeaderIndex].provider || ""),
        publicKey: DOMPurify.sanitize(validators[currentLeaderIndex].publicKey || ""),
      }
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
          <span className="text-red-500">Error: {DOMPurify.sanitize(error.message)}</span>
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
          <StatusCard title="Network Overview">
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
                <div className="font-medium" title={sanitizedLeader?.id || "None"}>
                  {truncateText(sanitizedLeader?.id || "None", 30)}
                </div>
              </div>
              {sanitizedCurrentQuery && (
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="text-gray-500">Current Query:</div>
                  <div className="font-medium max-w-full">
                    {truncateText(sanitizedCurrentQuery, 40)}
                  </div>
                </div>
              )}
            </div>
          </StatusCard>
          <StatusCard title="Leader Information">
            {sanitizedLeader ? (
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="text-gray-500">Profile:</div>
                  <div className="font-medium">{sanitizedLeader.profileName}</div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="text-gray-500">Provider:</div>
                  <div className="font-medium">{sanitizedLeader.provider}</div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="text-gray-500">Public Key:</div>
                  <div className="font-medium truncate max-w-[150px]">
                    {truncateText(sanitizedLeader.publicKey, 30)}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="text-gray-500">ID:</div>
                  <div className="font-medium">
                    {truncateText(sanitizedLeader.id, 30)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No leader selected</p>
            )}
          </StatusCard>
        </div>
      </CardContent>
    </Card>
  );
}