"use client"

import React, { useState, useEffect, useRef } from "react"
import { NetworkStats } from "@/components/network-stats"
import { ValidatorList } from "@/components/validator-list"
import { VoteHistory } from "@/components/vote-history"
import { VoteResults } from "@/components/vote-results"
import { NetworkVisualization } from "@/components/network-visualization"
import { ConsensusVisualization } from "@/components/consensus-visualization"
import { ValidatorDetail } from "@/components/validator-detail"
import { CustomQueryForm } from "@/components/custom-query-form"
import { ValidatorAdmin } from "@/components/validator-admin"
import { broadcastCustomQuery } from "@/app/actions"
import type { NetworkState, VoteResult, Validator } from "@/lib/types"

export default function Home() {
  const [networkState, setNetworkState] = useState<NetworkState | null>(null)
  const [lastVoteResult, setLastVoteResult] = useState<VoteResult | null>(null)
  const [voteHistory, setVoteHistory] = useState<VoteResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null)
  const [showCustomQuery, setShowCustomQuery] = useState(true)
  const [showValidatorAdmin, setShowValidatorAdmin] = useState(false)
  
  // Track if we've loaded vote history
  const voteHistoryLoaded = useRef(false)

  const fetchNetworkState = async () => {
    try {
      const response = await fetch("/api/network")
      const data = await response.json()
      setNetworkState(data)
    } catch (error) {
      console.error("Failed to fetch network state:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVoteHistory = async () => {
    try {
      const response = await fetch("/api/vote-history?limit=10")
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setVoteHistory(data)
        voteHistoryLoaded.current = true
      }
    } catch (error) {
      console.error("Failed to fetch vote history:", error)
    }
  }
  
  const handleCustomQuery = async (query: string) => {
    try {
      const result = await broadcastCustomQuery(query)
      if ('error' in result) {
        console.error("Failed to broadcast custom query:", result.error)
        return
      }
      
      setLastVoteResult(result as VoteResult)
      
      // Add the new vote to history and update state
      setVoteHistory((prevHistory: VoteResult[]) => [result as VoteResult, ...prevHistory].slice(0, 10))
      
      fetchNetworkState()
    } catch (error) {
      console.error("Failed to broadcast custom query:", error)
    }
  }

  React.useEffect(() => {
    fetchNetworkState()
    
    // Only fetch vote history once when component mounts
    if (!voteHistoryLoaded.current) {
      fetchVoteHistory()
    }

    // Set up auto-refresh if enabled
    let intervalId: NodeJS.Timeout | null = null

    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchNetworkState()
        fetchVoteHistory() // Also refresh vote history periodically
      }, 5000) // Refresh every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [autoRefresh])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading Verafy Testnet Explorer...</p>
        </div>
      </div>
    )
  }

  if (!networkState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500">Failed to load network state</p>
          <button
            onClick={fetchNetworkState}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header with logo and controls */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600 text-white rounded-lg p-2 w-10 h-10 flex items-center justify-center text-xl font-bold">V</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verafy Explorer</h1>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoRefresh(e.target.checked)}
                  className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="auto-refresh" className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-refresh (5s)
                </label>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Custom Query Form */}
        <CustomQueryForm 
          onSubmit={handleCustomQuery} 
          isOpen={showCustomQuery}
          onToggle={() => setShowCustomQuery(!showCustomQuery)}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Network visualization */}
          <div className="lg:col-span-2">
            <NetworkVisualization 
              validators={networkState.validators} 
              currentLeaderIndex={networkState.currentLeaderIndex} 
              onClick={(validator) => setSelectedValidator(validator)}
            />
          </div>
          
          {/* Right column - Consensus status */}
          <div className="lg:col-span-1">
            <ConsensusVisualization voteResult={lastVoteResult} isVoting={networkState.isVoting} />
          </div>
        </div>
        
        {/* Network stats and current state */}
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
                <NetworkStats networkState={networkState} />
                
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Validator Network
                  </h3>
                  <ValidatorList validators={networkState.validators} currentLeaderIndex={networkState.currentLeaderIndex} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Vote Results if available */}
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
          
          {/* Vote History Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Network Vote History
              </h2>
            </div>
            <div className="p-6">
              <VoteHistory voteHistory={voteHistory} />
            </div>
          </div>
        </div>
      </main>
      
      {/* Validator detail modal */}
      {selectedValidator && (
        <ValidatorDetail 
          validator={selectedValidator} 
          isLeader={networkState.validators.indexOf(selectedValidator) === networkState.currentLeaderIndex}
          onClose={() => setSelectedValidator(null)} 
        />
      )}
      
      {/* Validator Admin Modal */}
      <ValidatorAdmin
        isOpen={showValidatorAdmin}
        onClose={() => setShowValidatorAdmin(false)}
      />
    </div>
  )
}
