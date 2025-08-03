import { VoteResult } from "@/lib/types";
import { useVoteStore } from "@/store/vote-store";

interface UseVoteHistoryResult {
  voteHistory: VoteResult[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVoteHistory(): UseVoteHistoryResult {
  // Get vote history directly from the store
  const { voteHistory } = useVoteStore();

  // Since we're using the store, we don't need loading/error states
  // The store is updated when queries are made
  return {
    voteHistory,
    isLoading: false,
    error: null,
    refetch: async () => {
      // No-op since history is managed by the store
    },
  };
}