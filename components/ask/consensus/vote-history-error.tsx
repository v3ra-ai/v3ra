import DOMPurify from "dompurify";

interface VoteHistoryErrorProps {
  error: string;
  onRetry?: () => void;
}

export default function VoteHistoryError({
  error,
  onRetry,
}: VoteHistoryErrorProps) {
  // Handle retry with placeholder for CSRF protection
  const handleRetry = () => {
    if (!onRetry) return;
    // TODO: Ensure the API call triggered by onRetry includes a CSRF token
    // Example: Add 'X-CSRF-Token' header in the parent component's API call (e.g., fetchVoteHistory)
    onRetry();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 max-w-6xl mx-auto">
      <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
        Validator Vote History
      </h3>
      <div className="flex items-center gap-4">
        <p className="text-red-500">{DOMPurify.sanitize(error)}</p>
        {onRetry && (
          <button
            onClick={handleRetry}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
