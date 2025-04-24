import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";

interface QueryStatsProps {
  userCreditsTotal: number;
  queriesUnpaid: number;
  queriesCostTotal: number;
  queriesRequested: number;
}

export default function QueryStats({
  userCreditsTotal,
  queriesUnpaid,
  queriesCostTotal,
  queriesRequested,
}: QueryStatsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggeredOpen, setHasTriggeredOpen] = useState(false);
  const [hasTriggeredClose, setHasTriggeredClose] = useState(false);

  // Auto-trigger open/close based on queriesUnpaid
  useEffect(() => {
    if (queriesUnpaid > 0 && !hasTriggeredOpen) {
      setIsOpen(true);
      setHasTriggeredOpen(true);
      setHasTriggeredClose(false);
    } else if (queriesUnpaid <= 0 && !hasTriggeredClose) {
      setIsOpen(false);
      setHasTriggeredClose(true);
      setHasTriggeredOpen(false);
    }
  }, [queriesUnpaid, hasTriggeredOpen, hasTriggeredClose]);

  const creditsLeft = Math.max(0, userCreditsTotal - queriesRequested); // Credits left after reserving queriesRequested
  const displayUnpaid = Math.max(0, queriesUnpaid); // Never show negative queriesUnpaid

  return (
    <div className="w-full mt-8">
      {/* Mobile: Collapsible; Desktop: Always visible */}
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="md:hidden"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center justify-between w-full bg-zinc-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 cursor-pointer truncate"
          >
            <span>Credits left: {creditsLeft}</span>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-4 mt-4">
            <div className="md:flex items-center gap-2 hidden">
              <span className="text-gray-700 dark:text-zinc-400">Credits left</span>
              <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
                {creditsLeft}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 dark:text-zinc-400">
                Cost to query: ({displayUnpaid})
              </span>
              <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
                {queriesCostTotal} credits ({(queriesCostTotal * QUERY_COST).toFixed(QUERY_COST_FIXED_DECIMALS)} SOL)
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

      {/* Desktop: Always visible */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-700 dark:text-zinc-400">Credits left</span>
          <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
            {creditsLeft}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 dark:text-zinc-400">
            Cost to query: ({displayUnpaid})
          </span>
          <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
            {queriesCostTotal} credits ({(queriesCostTotal * QUERY_COST).toFixed(QUERY_COST_FIXED_DECIMALS)} SOL)
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