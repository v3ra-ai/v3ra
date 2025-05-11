import { create } from "zustand";
import { DEFAULTS } from "@/lib/types";
import { PublicKey } from "@solana/web3.js";

interface CreditsStore {
  userFreeCredits: number;
  userPaidCredits: number;
  userCreditsTotal: number;
  savedCredits: number | null;
  queriesUnpaid: number;
  queriesCostTotal: number;
  totalCredits: number;
  displayUnpaid: number;
  hasPaid: boolean;
  savedCreditsTimestamp: number | null; // New: Cache timestamp
  decrementFreeCredits: (amount: number) => void;
  decrementPaidCredits: (amount: number) => void;
  incrementPaidCredits: (amount: number) => void;
  resetCreditsAfterPayment: () => void;
  setUserCreditsTotal: (credits: number) => void;
  setQueriesUnpaid: (queries: number) => void;
  setQueriesCostTotal: (cost: number) => void;
  setHasPaid: (paid: boolean) => void;
  fetchSavedCredits: (publicKey: PublicKey | null) => Promise<void>;
}

const CACHE_DURATION = 60 * 1000; // 60 seconds in milliseconds

export const useCreditsStore = create<CreditsStore>((set, get) => ({
  userFreeCredits: DEFAULTS.USER_FREE_CREDITS,
  userPaidCredits: DEFAULTS.USER_PAID_CREDITS,
  userCreditsTotal: DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS,
  savedCredits: null,
  queriesUnpaid: 0,
  queriesCostTotal: 0,
  totalCredits: DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS,
  displayUnpaid: 0,
  hasPaid: false,
  savedCreditsTimestamp: null, // New: Initialize timestamp

  decrementFreeCredits: (amount: number) =>
    set((state) => {
      const newFreeCredits = Math.max(0, state.userFreeCredits - amount);
      const newUserCreditsTotal = newFreeCredits + state.userPaidCredits;
      const newTotalCredits = (state.savedCredits ?? 0) + newUserCreditsTotal;
      const newState = {
        userFreeCredits: newFreeCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("decrementFreeCredits: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  decrementPaidCredits: (amount: number) =>
    set((state) => {
      const newPaidCredits = Math.max(0, state.userPaidCredits - amount);
      const newUserCreditsTotal = state.userFreeCredits + newPaidCredits;
      const newTotalCredits = (state.savedCredits ?? 0) + newUserCreditsTotal;
      const newState = {
        userPaidCredits: newPaidCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("decrementPaidCredits: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  incrementPaidCredits: (amount: number) =>
    set((state) => {
      const newPaidCredits = state.userPaidCredits + amount;
      const newUserCreditsTotal = state.userFreeCredits + newPaidCredits;
      const newTotalCredits = (state.savedCredits ?? 0) + newUserCreditsTotal;
      const newState = {
        userPaidCredits: newPaidCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("incrementPaidCredits: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  resetCreditsAfterPayment: () =>
    set((state) => {
      const newTotalCredits = state.savedCredits ?? 0;
      const newState = {
        userFreeCredits: 0,
        userPaidCredits: 0,
        userCreditsTotal: 0,
        queriesUnpaid: 0,
        queriesCostTotal: 0,
        totalCredits: newTotalCredits,
        displayUnpaid: 0,
        hasPaid: true,
      };
      console.log("resetCreditsAfterPayment: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  setUserCreditsTotal: (credits) =>
    set((state) => {
      const newUserCreditsTotal = credits;
      const newTotalCredits = (state.savedCredits ?? 0) + newUserCreditsTotal;
      const newState = {
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("setUserCreditsTotal: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  setQueriesUnpaid: (queries) =>
    set((state) => {
      const newQueriesCostTotal = queries; // 1 credit per query
      const newState = {
        queriesUnpaid: queries,
        queriesCostTotal: newQueriesCostTotal,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, queries),
      };
      console.log("setQueriesUnpaid: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  setQueriesCostTotal: (cost) =>
    set((state) => {
      const newState = {
        queriesCostTotal: cost,
        queriesUnpaid: cost, // 1 credit per query
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, cost),
      };
      console.log("setQueriesCostTotal: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  setHasPaid: (paid) =>
    set((state) => {
      const newState = {
        hasPaid: paid,
        displayUnpaid: paid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("setHasPaid:", newState);
      return newState;
    }),

  fetchSavedCredits: async (publicKey) => {
    const currentState = get();
    const now = Date.now();

    // Check cache validity
    if (
      currentState.savedCreditsTimestamp &&
      now - currentState.savedCreditsTimestamp < CACHE_DURATION &&
      currentState.savedCredits !== null
    ) {
      console.log("[credit-store] Using cached savedCredits:", {
        savedCredits: currentState.savedCredits,
        timestamp: currentState.savedCreditsTimestamp,
      });
      return;
    }

    console.log("[credit-store] Fetching savedCredits:", {
      publicKey: publicKey ? publicKey.toBase58() : null,
    });

    if (!publicKey) {
      set({
        savedCredits: null,
        totalCredits: currentState.userCreditsTotal,
        savedCreditsTimestamp: now,
      });
      return;
    }

    try {
      const response = await fetch("/api/credits/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletPublicKey: publicKey.toBase58() }),
      });
      const data = await response.json();
      console.log("[credit-store] fetchSavedCredits response:", data);
      set({
        savedCredits: data.credits ?? 0,
        totalCredits: (data.credits ?? 0) + currentState.userCreditsTotal,
        savedCreditsTimestamp: now,
      });
    } catch (error) {
      console.error("[credit-store] Error fetching saved credits:", error);
      set({
        savedCredits: 0,
        totalCredits: currentState.userCreditsTotal,
        savedCreditsTimestamp: now,
      });
    }
  },
}));