"use client";

import React, { useState } from "react";
import { NetworkStats } from "@/components/network-stats";
import { ValidatorList } from "@/components/validator-list";
import { VoteHistory } from "@/components/vote-history";
import { VoteResults } from "@/components/vote-results";
import { NetworkVisualization } from "@/components/network-visualization";
import { ConsensusVisualization } from "@/components/consensus-visualization";
import { ValidatorDetail } from "@/components/validator-detail";
import { CustomQueryForm } from "@/components/custom-query-form";
import { ValidatorAdmin } from "@/components/validator-admin";
import { useNetworkState } from "@/hooks/useNetworkState";
import { useVoteHistory } from "@/hooks/useVoteHistory";
import { useBroadcastQuery } from "@/hooks/useBroadcastQuery";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import type { VoteResult, Validator } from "@/lib/types";

const Explorer: React.FC = () => {
  const { networkState, isLoading, error: networkError, refetch } = useNetworkState();
  const { voteHistory, setVoteHistory, error: voteHistoryError, fetchVoteHistory } = useVoteHistory();
  const [lastVoteResult, setLastVoteResult] = useState<VoteResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [showCustomQuery, setShowCustomQuery] = useState(true);
  const [showValidatorAdmin, setShowValidatorAdmin] = useState(false);

  const { broadcastQuery } = useBroadcastQuery(
    setVoteHistory,
    setLastVoteResult,
    refetch,
    fetchVoteHistory,
  );

  useAutoRefresh({
    isEnabled: autoRefresh,
    intervalMs: 5000,
    fetchFunctions: [refetch, fetchVoteHistory],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading Verafy Testnet Explorer...</p>
        </div>
      </div>
    );
  }

  if (networkError || !networkState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500">Failed to load network state</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600 text-white rounded-lg p-2 w-10 h-10 flex items-center justify-center text-xl font-bold">
                V
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Verafy Explorer
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setShowValidatorAdmin(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Manage Validators
              </button>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAutoRefresh(e.target.checked)
                  }
                  className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="auto-refresh"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Auto-refresh (5s)
                </label>
              </div>
            </div>
          </div>
        </div>
      </header>

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <NetworkStats networkState={networkState} />
                </div>

                <div className="col-span-2">
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