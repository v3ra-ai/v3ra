export default function VoteHistoryEmpty() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-4 max-w-6xl mx-auto">
      <h3 className="text-lg font-medium text-gray-800 dark:text-zinc-200 mb-2">
        Validator Vote History
      </h3>
      <p className="text-gray-500 dark:text-gray-400">No votes recorded yet</p>
    </div>
  );
}