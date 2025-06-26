import { useState, useEffect } from "react";
import { VoteResult } from "@/lib/types";
import { useVoteStore } from "@/store/vote-store";

export function useVoteResult() {
  const { lastVoteResult } = useVoteStore();
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lastVoteResult) {
      setVoteResult(lastVoteResult);
    }
  }, [lastVoteResult]);

  return {
    voteResult,
    isLoading,
    error,
  };
}