"use client";

import { useState, useEffect } from "react";
import { useQueryStore } from "@/store/query-store";
import { fetchVoteHistory } from "@/app/actions";
import VoteHistoryHeader from "./vote-history-header";
import VoteHistoryTable from "./vote-history-table";
import VoteHistoryLoading from "./vote-history-loading";
import VoteHistoryError from "./vote-history-error";
import VoteHistoryEmpty from "./vote-history-empty";

export default function VoteHistory() {
  const { voteHistory, setVoteHistory } = useQueryStore();
  const [voteHistoryError, setVoteHistoryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedVoteId, setExpandedVoteId] = useState<number | null>(null);

  useEffect(() => {
    async function loadVoteHistory() {
      try {
        setIsLoading(true);
        const result = await fetchVoteHistory();
        if ("error" in result) {
          console.error("Fetch vote history failed:", result.error);
          setVoteHistoryError(result.error);
          return;
        }
        setVoteHistory(result);
        setVoteHistoryError(null);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load vote history";
        console.error("Error in loadVoteHistory:", errorMessage);
        setVoteHistoryError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
    loadVoteHistory();
  }, [setVoteHistory]);

  const handleViewClick = (index: number) => {
    setExpandedVoteId(expandedVoteId === index ? null : index);
  };

  if (isLoading) {
    return <VoteHistoryLoading />;
  }

  if (voteHistoryError) {
    return <VoteHistoryError error={voteHistoryError} />;
  }

  if (!voteHistory || voteHistory.length === 0) {
    return <VoteHistoryEmpty />;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 shadow rounded-xl max-w-6xl mx-auto">
      <VoteHistoryHeader voteCount={voteHistory.length} />
      <VoteHistoryTable
        voteHistory={voteHistory}
        expandedVoteId={expandedVoteId}
        handleViewClick={handleViewClick}
      />
    </div>
  );
}