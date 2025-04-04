"use server"

import type { NetworkState, VoteResult } from "./types"
import { mockNetworkState, generateMockVoteResult } from "./mocks"

// Get the current network state using mock data
export async function getNetworkState(): Promise<NetworkState> {
  return { ...mockNetworkState }
}

// Broadcast a query to all validators and collect votes using mock data
export async function broadcastQuery(): Promise<VoteResult> {
  // Use a random query from our sample list
  const query = getRandomQuery()
  
  // Generate a mock vote result for the query
  const result = generateMockVoteResult(query)
  
  return result
}

// Sample queries that will be broadcast to the network
const SAMPLE_QUERIES = [
  "Should the network upgrade to version 2.0?",
  "Is the current transaction fee appropriate?",
  "Should we increase the validator count?",
  "Is the network performance satisfactory?",
  "Should we implement the new security protocol?",
  "Is the current block size optimal?",
  "Should we modify the staking requirements?",
  "Is the current reward distribution fair?",
  "Should we change the consensus algorithm?",
  "Is the network decentralized enough?",
]

// Get a random query from the sample list
function getRandomQuery(): string {
  const index = Math.floor(Math.random() * SAMPLE_QUERIES.length)
  return SAMPLE_QUERIES[index]
}
