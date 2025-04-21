"use client";

import React, { useState, useEffect } from "react";
import { NetworkStats } from "@/components/network-stats";
import { ValidatorList } from "@/components/explorer/validator-list";
import { VoteHistory } from "@/components/explorer/vote-history";
import { VoteResults } from "@/components/explorer/vote-results";
import { NetworkVisualization } from "@/components/explorer/network-visualization";
import { ConsensusVisualization } from "@/components/explorer/consensus-visualization";
import { ValidatorDetail } from "@/components/explorer/validator-detail";
import { CustomQueryForm } from "@/components/explorer/custom-query-form";
import { ValidatorAdmin } from "@/components/explorer/validator-admin";
import { ExplorerHeader } from "@/components/explorer/explorer-header";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorDisplay } from "@/components/error-display";
import { useNetworkState } from "@/hooks/useNetworkState";
import { useVoteHistory } from "@/hooks/useVoteHistory";
import { useBroadcastQuery } from "@/hooks/useBroadcastQuery";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import type { VoteResult, Validator } from "@/lib/types";

const Explorer: React.FC = () => {
  const {
    networkState,
    isLoading,
    error: networkError,
    refetch: refetchNetwork,
  } = useNetworkState();
  const {
    voteHistory: voteHistoryFromHook,
    error: voteHistoryError,
    refetch: refetchVoteHistory,
  } = useVoteHistory();
  const [voteHistory, setVoteHistory] = useState<VoteResult[]>([]);
  const [lastVoteResult, setLastVoteResult] = useState<VoteResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(
    null,
  );
  const [showCustomQuery, setShowCustomQuery] = useState(true);
  const [showValidatorAdmin, setShowValidatorAdmin] = useState(false);

  // Sync local voteHistory with useVoteHistory
  useEffect(() => {
    setVoteHistory(voteHistoryFromHook);
  }, [voteHistoryFromHook]);

  const { broadcastQuery } = useBroadcastQuery(
    setVoteHistory,
    setLastVoteResult,
    refetchNetwork,
    refetchVoteHistory,
  );

  useAutoRefresh({
    isEnabled: autoRefresh,
    intervalMs: 5000,
    fetchFunctions: [refetchNetwork, refetchVoteHistory],
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (networkError || !networkState) {
    return <ErrorDisplay onRetry={refetchNetwork} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ExplorerHeader
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        onManageValidators={() => setShowValidatorAdmin(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CustomQueryForm
          onSubmit={broadcastQuery}
          isOpen={showCustomQuery}
          onToggle={() => setShowCustomQuery(!showCustomQuery)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <NetworkVisualization
              validators={networkState.validators}
              currentLeaderIndex={networkState.currentLeaderIndex}
              onClick={(validator) => setSelectedValidator(validator)}
            />
          </div>

          <div className="lg:col-span-1">
            <ConsensusVisualization
              voteResult={lastVoteResult}
              isVoting={networkState.isVoting}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Network Status
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <NetworkStats networkState={networkState} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Validator Network
                  </h3>
                  <ValidatorList
                    validators={networkState.validators}
                    currentLeaderIndex={networkState.currentLeaderIndex}
                  />
                </div>
              </div>
            </div>
          </div>

          {lastVoteResult && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Latest Vote Results
                </h2>
              </div>
              <div className="p-6">
                <VoteResults voteResult={lastVoteResult} />
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Network Vote History
              </h2>
            </div>
            <div className="p-6">
              {voteHistoryError ? (
                <p className="text-red-500">Failed to load vote history</p>
              ) : (
                <VoteHistory voteHistory={voteHistory} />
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedValidator && (
        <ValidatorDetail
          validator={selectedValidator}
          isLeader={
            selectedValidator &&
            networkState.validators.indexOf(selectedValidator) ===
              networkState.currentLeaderIndex
          }
          onClose={() => setSelectedValidator(null)}
        />
      )}

      <ValidatorAdmin
        isOpen={showValidatorAdmin}
        onClose={() => setShowValidatorAdmin(false)}
      />
    </div>
  );
};

export default Explorer;