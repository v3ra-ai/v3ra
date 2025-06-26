import { createContext } from "react";
import { VoteResult } from "@/lib/types";

export const VoteResultContext = createContext<VoteResult | null>(null);

export default function AskResultsExpert() {
  // Minimal implementation - expert view not yet implemented
  return (
    <div className="text-center p-8">
      <p className="text-zinc-500 dark:text-zinc-400">
        Expert view coming soon...
      </p>
    </div>
  );
}