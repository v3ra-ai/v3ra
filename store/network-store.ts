import { create } from "zustand";
import { NetworkState } from "@/lib/types";

interface NetworkStore {
  networkStateCache: NetworkState | null;
  networkStateTimestamp: number | null;
  setNetworkStateCache: (data: NetworkState | null, timestamp: number | null) => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  networkStateCache: null,
  networkStateTimestamp: null,

  setNetworkStateCache: (data: NetworkState | null, timestamp: number | null) => set(() => ({
    networkStateCache: data,
    networkStateTimestamp: timestamp,
  })),
}));