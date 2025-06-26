import { NetworkState } from "@/lib/types";

export function getNetworkStateDefaults(): NetworkState {
  return {
    validators: [],
    currentLeaderIndex: 0,
    isVoting: false,
    lastQuery: null,
    lastNetworkResponse: null,
    lastConsensusValue: null,
    lastConsensusThreshold: 0.6,
    lastConsensusAchieved: null,
    lastVoteTimestamp: null,
  };
}