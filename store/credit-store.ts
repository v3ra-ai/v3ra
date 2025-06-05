import { create } from "zustand";
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
  savedCreditsTimestamp: number | null;
  creditsLoading: boolean;
  decrementFreeCredits: (amount: number) => void;
  decrementPaidCredits: (amount: number) => void;
  incrementPaidCredits: (amount: number) => void;
  resetCreditsAfterPayment: () => void;
  setUserCreditsTotal: (credits: number) => void;
  setQueriesUnpaid: (queries: number) => void;
  setQueriesCostTotal: (cost: number) => void;
  setHasPaid: (paid: boolean) => void;
  fetchAllCredits: (
    publicKey: PublicKey | null,
    email?: string
  ) => Promise<void>;
}

const CACHE_DURATION = 60 * 1000; // 60 seconds

export const useCreditsStore = create<CreditsStore>((set, get) => ({
  userFreeCredits: 0,
  userPaidCredits: 0,
  userCreditsTotal: 0,
  savedCredits: null,
  queriesUnpaid: 0,
  queriesCostTotal: 0,
  totalCredits: 0,
  displayUnpaid: 0,
  hasPaid: false,
  savedCreditsTimestamp: null,
  creditsLoading: false,

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
      console.log("decrementFreeCredits: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
      });
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
      console.log("decrementPaidCredits: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
      });
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
      console.log("incrementPaidCredits: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
      });
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
      console.log("resetCreditsAfterPayment: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
      });
      return newState;
    }),

  setUserCreditsTotal: (credits) =>
    set((state) => {
      const newUserCreditsTotal = credits;
      const newPaidCredits = credits;
      const newTotalCredits = (state.savedCredits ?? 0) + newUserCreditsTotal;
      const newState = {
        userPaidCredits: newPaidCredits,
        userFreeCredits: 0,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("setUserCreditsTotal: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
      });
      return newState;
    }),

  setQueriesUnpaid: (queries) =>
    set((state) => {
      const newQueriesCostTotal = queries;
      const newState = {
        queriesUnpaid: queries,
        queriesCostTotal: newQueriesCostTotal,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, queries),
      };
      console.log("setQueriesUnpaid: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
      });
      return newState;
    }),

  setQueriesCostTotal: (cost) =>
    set((state) => {
      const newState = {
        queriesCostTotal: cost,
        queriesUnpaid: cost,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, cost),
      };
      console.log("setQueriesCostTotal: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
      });
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

  fetchAllCredits: async (publicKey: PublicKey | null, email?: string) => {
    const currentState = get();
    const now = Date.now();

    if (
      currentState.savedCreditsTimestamp &&
      now - currentState.savedCreditsTimestamp < CACHE_DURATION &&
      currentState.userFreeCredits !== null &&
      currentState.userPaidCredits !== null &&
      !currentState.creditsLoading
    ) {
      console.log("[credit-store] Using cached credits:", {
        userFreeCredits: currentState.userFreeCredits,
        userPaidCredits: currentState.userPaidCredits,
        timestamp: currentState.savedCreditsTimestamp,
      });
      return;
    }

    set({ creditsLoading: true });
    console.log("[credit-store] Fetching all credits:", {
      publicKey: publicKey?.toBase58(),
      email,
    });

    try {
      // Fetch both free and paid credits concurrently
      const [freeResponse, paidResponse] = await Promise.all([
        email
          ? fetch(`/api/user-credits?email=${encodeURIComponent(email)}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            })
          : Promise.resolve(null),
        publicKey
          ? fetch("/api/credits/balance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                walletPublicKey: publicKey.toBase58(),
              }),
            })
          : Promise.resolve(null),
      ]);

      let freeCredits = 0;
      if (freeResponse && freeResponse.ok) {
        const freeData = await freeResponse.json();
        console.log("[credit-store] Fetched free credits:", freeData);
        freeCredits = freeData.freeCredits ?? 0;
      } else if (freeResponse) {
        console.error(
          "[credit-store] Failed to fetch free credits:",
          freeResponse.statusText
        );
      }

      let paidCredits = 0;
      if (paidResponse && paidResponse.ok) {
        const paidData = await paidResponse.json();
        console.log("[credit-store] Fetched paid credits:", paidData);
        paidCredits = paidData.paidCredits ?? paidData.credits ?? 0;
      } else if (paidResponse) {
        console.error(
          "[credit-store] Failed to fetch paid credits:",
          paidResponse.statusText
        );
      }

      const newUserCreditsTotal = freeCredits + paidCredits;
      set({
        userFreeCredits: freeCredits,
        userPaidCredits: paidCredits,
        userCreditsTotal: newUserCreditsTotal,
        savedCredits: paidCredits,
        totalCredits: newUserCreditsTotal,
        savedCreditsTimestamp: now,
        creditsLoading: false,
      });
      console.log("[credit-store] Updated credits:", {
        userFreeCredits: freeCredits,
        userPaidCredits: paidCredits,
        userCreditsTotal: newUserCreditsTotal,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[credit-store] Error fetching credits:", errorMsg, {
        error,
      });
      set({
        userFreeCredits: 0,
        userPaidCredits: 0,
        userCreditsTotal: 0,
        savedCredits: 0,
        totalCredits: 0,
        savedCreditsTimestamp: now,
        creditsLoading: false,
      });
    }
  },
}));
