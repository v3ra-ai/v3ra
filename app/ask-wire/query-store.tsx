// app/ask/query-store.ts
import { create } from "zustand";

interface QueryStore {
  totalQueries: number;
  decrementQueries: (amount: number) => void;
}

export const useQueryStore = create<QueryStore>((set) => ({
  totalQueries: 10, // Initial total queries
  decrementQueries: (amount: number) =>
    set((state) => ({
      totalQueries: Math.max(0, state.totalQueries - amount), // Prevent negative
    })),
}));
