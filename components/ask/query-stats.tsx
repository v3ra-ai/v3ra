import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggeredOpen, setHasTriggeredOpen] = useState(false);
  const [hasTriggeredClose, setHasTriggeredClose] = useState(false);

  // Auto-trigger open/close based on availableQueries and costToQuery
  useEffect(() => {
    const cost = parseFloat(costToQuery);
    if (
      availableQueries < 1 &&
      !isNaN(cost) &&
      cost > 0 &&
      !hasTriggeredOpen
    ) {
      setIsOpen(true);
      setHasTriggeredOpen(true);
      setHasTriggeredClose(false); // Allow re-close if conditions change
    } else if (availableQueries > 0 && !hasTriggeredClose) {
      setIsOpen(false);
      setHasTriggeredClose(true);
      setHasTriggeredOpen(false); // Allow re-open if conditions change
    }
  }, [
    availableQueries,
    costToQuery,
    hasTriggeredOpen,
    hasTriggeredClose,
  ]);

  return (
    <div className="w-full mt-8">
      {/* Mobile: Collapsible; Desktop: Always visible */}
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="md:hidden" // Hidden on md and above
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center justify-between w-full bg-zinc-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 cursor-pointer truncate"
          >
            <span>Queries left: {availableQueries}</span>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-4 mt-4">
            <div className="md:flex items-center gap-2 hidden">
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
                className="rounded-md bg-zinc-100 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer w-full"
              >
                Stake to get more
              </Button>
            </Link>
            <Link href="/credits">
              <Button
                className="rounded-md bg-zinc-100 dark:bg-zinc-600 border border-gray-300 dark:border-gray-700 pl-2 py-1 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer w-full"
              >
                Buy Credits
              </Button>
            </Link>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop: Original layout */}
      <div className="hidden md:flex items-center gap-4">
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
    </div>
  );
}