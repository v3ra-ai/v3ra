interface VoteHistoryHeaderProps {
  voteCount: number;
}

export default function VoteHistoryHeader({ voteCount }: VoteHistoryHeaderProps) {
  return (
    <div className="px-4 py-5 sm:px-6 border-b border-zinc-200 dark:border-zinc-700">
      <h3 className="text-xl font-medium leading-6 text-gray-800 dark:text-zinc-200">
        Validator Vote History ({voteCount})
      </h3>
      <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
        Historical voting sessions and their outcomes
      </p>
    </div>
  );
}