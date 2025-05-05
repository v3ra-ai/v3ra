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
      console.log("setHasPaid: Updated state:", { ...newState, previousHasPaid: state.hasPaid });
      return newState;
    }),

  fetchSavedCredits: async (publicKey) => {
    const currentState = get();
    if (!publicKey) {
      const newTotalCredits = currentState.userCreditsTotal;
      const newState = {
        savedCredits: null,
        totalCredits: newTotalCredits,
        displayUnpaid: currentState.hasPaid ? 0 : Math.max(0, currentState.queriesUnpaid),
      };
      console.log("fetchSavedCredits: No publicKey, updated state:", { ...newState, previousHasPaid: currentState.hasPaid });
      set(newState);
      return;
    }
    try {
      const response = await fetch("/api/credits/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletPublicKey: publicKey.toBase58() }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || response.statusText || "Unknown error";
        console.error("Failed to fetch saved credits:", errorMsg);
        const newTotalCredits = currentState.userCreditsTotal;
        const newState = {
          savedCredits: 0,
          totalCredits: newTotalCredits,
          displayUnpaid: currentState.hasPaid ? 0 : Math.max(0, currentState.queriesUnpaid),
        };
        console.log("fetchSavedCredits: API failure, updated state:", { ...newState, previousHasPaid: currentState.hasPaid });
        set(newState);
        return;
      }
      const data = await response.json();
      console.log("Fetched saved credits for store:", data);
      const newTotalCredits = (data.credits ?? 0) + currentState.userCreditsTotal;
      const newState = {
        savedCredits: data.credits ?? 0,
        totalCredits: newTotalCredits,
        displayUnpaid: currentState.hasPaid ? 0 : Math.max(0, currentState.queriesUnpaid),
      };
      console.log("fetchSavedCredits: Success, updated state:", { ...newState, previousHasPaid: currentState.hasPaid });
      set(newState);
    } catch (error) {
      console.error("Error fetching saved credits:", error);
      const newTotalCredits = currentState.userCreditsTotal;
      const newState = {
        savedCredits: 0,
        totalCredits: newTotalCredits,
        displayUnpaid: currentState.hasPaid ? 0 : Math.max(0, currentState.queriesUnpaid),
      };
      console.log("fetchSavedCredits: Error, updated state:", { ...newState, previousHasPaid: currentState.hasPaid });
      set(newState);
    }
  },
}));