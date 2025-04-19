interface VoteHistoryErrorProps {
  error: string;
}

export default function VoteHistoryError({ error }: VoteHistoryErrorProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 max-w-6xl mx-auto">
      <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
        Validator Vote History
      </h3>
      <p className="text-red-500">{error}</p>
    </div>
  );
}