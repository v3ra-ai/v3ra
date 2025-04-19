import Link from "next/link";
import { Button } from "@/components/ui/button";

interface QueryStatsProps {
  availableQueries: number;
  queriesNeeded: number;
  costToQuery: string;
}

export default function QueryStats({
  availableQueries,
  queriesNeeded,
  costToQuery,
}: QueryStatsProps) {
  return (
    <div className="flex items-center gap-4 mt-8">
      <div className="flex items-center gap-2">
        <span className="text-gray-700 dark:text-zinc-400">Queries left</span>
        <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
          {availableQueries}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-700 dark:text-zinc-400">
          Cost to query: ({queriesNeeded})
        </span>
        <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
          {costToQuery} SOL
        </span>
      </div>
      <Link href="/credits">
        <Button
          className="rounded-md bg-zinc-100 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
        >
          Stake to get more
        </Button>
      </Link>
      <Link href="/credits">
        <Button
          className="rounded-md bg-zinc-100 dark:bg-zinc-600 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
        >
          Buy Credits
        </Button>
      </Link>
    </div>
  );
}