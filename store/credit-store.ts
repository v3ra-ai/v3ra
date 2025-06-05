import { create } from "zustand";
import { PublicKey } from "@solana/web3.js";

interface CreditsState {
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
  fetchAllCredits: (publicKey: PublicKey | null, email?: string, forceFetch?: boolean) => Promise<void>;
  decrementCreditsForQuery: (amount: number, publicKey: PublicKey | null, email?: string) => Promise<void>;
  resetCredits: () => void; // Added
}

const CACHE_DURATION = 60 * 1000; // 60 seconds

export const useCreditsStore = create<CreditsState>((set, get) => ({
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
      const newTotalCredits = newFreeCredits + state.userPaidCredits;
      const newState = {
        userFreeCredits: newFreeCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("[credit-store] decrementFreeCredits: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
        timestamp: new Date().toISOString(),
      });
      return newState;
    }),

  decrementPaidCredits: (amount: number) =>
    set((state) => {
      const newPaidCredits = Math.max(0, state.userPaidCredits - amount);
      const newUserCreditsTotal = state.userFreeCredits + newPaidCredits;
      const newTotalCredits = state.userFreeCredits + newPaidCredits;
      const newState = {
        userPaidCredits: newPaidCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("[credit-store] decrementPaidCredits: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
        timestamp: new Date().toISOString(),
      });
      return newState;
    }),

  incrementPaidCredits: (amount: number) =>
    set((state) => {
      const newPaidCredits = state.userPaidCredits + amount;
      const newUserCreditsTotal = state.userFreeCredits + newPaidCredits;
      const newTotalCredits = state.userFreeCredits + newPaidCredits;
      const newState = {
        userPaidCredits: newPaidCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("[credit-store] incrementPaidCredits: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
        timestamp: new Date().toISOString(),
      });
      return newState;
    }),

  resetCreditsAfterPayment: () =>
    set((state) => {
      const newTotalCredits = state.userFreeCredits + state.userPaidCredits;
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
      console.log("[credit-store] resetCreditsAfterPayment: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
        timestamp: new Date().toISOString(),
      });
      return newState;
    }),

  setUserCreditsTotal: (credits) =>
    set((state) => {
      const newUserCreditsTotal = credits;
      const newPaidCredits = credits;
      const newTotalCredits = state.userFreeCredits + newPaidCredits;
      const newState = {
        userPaidCredits: newPaidCredits,
        userFreeCredits: state.userFreeCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        displayUnpaid: state.hasPaid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("[credit-store] setUserCreditsTotal: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
        timestamp: new Date().toISOString(),
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
      console.log("[credit-store] setQueriesUnpaid: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
        timestamp: new Date().toISOString(),
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
      console.log("[credit-store] setQueriesCostTotal: Updated state:", {
        ...newState,
        previousHasPaid: state.hasPaid,
        timestamp: new Date().toISOString(),
      });
      return newState;
    }),

  setHasPaid: (paid) =>
    set((state) => {
      const newState = {
        hasPaid: paid,
        displayUnpaid: paid ? 0 : Math.max(0, state.queriesUnpaid),
      };
      console.log("[credit-store] setHasPaid:", newState);
      return newState;
    }),

  resetCredits: () =>
    set(() => {
      const newState = {
        userFreeCredits: 0,
        userPaidCredits: 0,
        userCreditsTotal: 0,
        savedCredits: null,
        totalCredits: 0,
        savedCreditsTimestamp: null,
        creditsLoading: false,
      };
      console.log("[credit-store] resetCredits: Cleared state:", {
        ...newState,
        timestamp: new Date().toISOString(),
      });
      return newState;
    }),

  fetchAllCredits: async (publicKey: PublicKey | null, email?: string, forceFetch: boolean = false) => {
    const currentState = get();
    const now = Date.now();

    // Reset state before fetch to clear stale data
    if (forceFetch) {
      get().resetCredits();
      console.log("[credit-store] Reset credits state before force fetch:", {
        publicKey: publicKey?.toBase58(),
        email,
        timestamp: new Date().toISOString(),
      });
    }

    // Force fetch if requested or totalCredits is inconsistent
    const expectedTotal = currentState.userFreeCredits + currentState.userPaidCredits;
    const isTotalInvalid = currentState.totalCredits !== expectedTotal;

    if (
      !forceFetch &&
      !isTotalInvalid &&
      currentState.savedCreditsTimestamp &&
      now - currentState.savedCreditsTimestamp < CACHE_DURATION &&
      currentState.userFreeCredits !== null &&
      currentState.userPaidCredits !== null &&
      !currentState.creditsLoading
    ) {
      console.log("[credit-store] Using cached credits:", {
        userFreeCredits: currentState.userFreeCredits,
        userPaidCredits: currentState.userPaidCredits,
        totalCredits: currentState.totalCredits,
        timestamp: new Date(currentState.savedCreditsTimestamp).toISOString(),
        context: { publicKey: publicKey?.toBase58(), email },
      });
      return;
    }

    set({ creditsLoading: true });
    console.log("[credit-store] Fetching all credits:", {
      publicKey: publicKey?.toBase58(),
      email,
      forceFetch,
      isTotalInvalid,
      timestamp: new Date(now).toISOString(),
    });

    try {
      // Fetch both free and paid credits concurrently
      const [freeResponse, paidResponse] = await Promise.all([
        email
          ? fetch(`/api/user-credits?email=${encodeURIComponent(email)}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            }).catch((err) => {
              console.error("[credit-store] Free credits fetch error:", err, {
                email,
                timestamp: new Date().toISOString(),
              });
              return null;
            })
          : Promise.resolve(null),
        publicKey
          ? fetch("/api/credits/balance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                walletPublicKey: publicKey.toBase58(),
              }),
            }).catch((err) => {
              console.error("[credit-store] Paid credits fetch error:", err, {
                publicKey: publicKey?.toBase58(),
                timestamp: new Date().toISOString(),
              });
              return null;
            })
          : Promise.resolve(null),
      ]);

      let freeCredits = 0;
      if (freeResponse && freeResponse.ok) {
        const freeData = await freeResponse.json();
        console.log("[credit-store] Fetched free credits response:", {
          status: freeResponse.status,
          data: freeData,
          email,
          timestamp: new Date().toISOString(),
        });
        freeCredits = freeData.freeCredits ?? 0;
      } else {
        console.warn(
          "[credit-store] Failed to fetch free credits:",
          freeResponse ? freeResponse.statusText : "No response",
          { email, timestamp: new Date().toISOString() }
        );
        freeCredits = 0;
      }

      let paidCredits = 0;
      if (paidResponse && paidResponse.ok) {
        const paidData = await paidResponse.json();
        console.log("[credit-store] Fetched paid credits response:", {
          status: paidResponse.status,
          data: paidData,
          publicKey: publicKey?.toBase58(),
          timestamp: new Date().toISOString(),
        });
        paidCredits = paidData.paidCredits ?? paidData.credits ?? 0;
      } else {
        console.warn(
          "[credit-store] Failed to fetch paid credits:",
          paidResponse ? paidResponse.statusText : "No response",
          { publicKey: publicKey?.toBase58(), timestamp: new Date().toISOString() }
        );
        paidCredits = 0;
      }

      const newUserCreditsTotal = freeCredits + paidCredits;
      const newTotalCredits = freeCredits + paidCredits;
      set({
        userFreeCredits: freeCredits,
        userPaidCredits: paidCredits,
        userCreditsTotal: newUserCreditsTotal,
        savedCredits: paidCredits,
        totalCredits: newTotalCredits,
        savedCreditsTimestamp: now,
        creditsLoading: false,
      });
      console.log("[credit-store] Updated credits:", {
        userFreeCredits: freeCredits,
        userPaidCredits: paidCredits,
        userCreditsTotal: newUserCreditsTotal,
        totalCredits: newTotalCredits,
        context: { publicKey: publicKey?.toBase58(), email },
        timestamp: new Date(now).toISOString(),
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("[credit-store] Error fetching credits:", errorMsg, {
        error,
        publicKey: publicKey?.toBase58(),
        email,
        timestamp: new Date().toISOString(),
      });
      // Reset state on error to prevent stale data
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

  decrementCreditsForQuery: async (amount: number, publicKey: PublicKey | null, email?: string) => {
    const state = get();
    console.log("[credit-store] decrementCreditsForQuery:", {
      amount,
      userFreeCredits: state.userFreeCredits,
      userPaidCredits: state.userPaidCredits,
      publicKey: publicKey?.toBase58(),
      email,
      timestamp: new Date().toISOString(),
    });

    if (state.userFreeCredits >= amount && email) {
      // Prefer free credits
      try {
        const response = await fetch('/api/credits/decrement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'free',
            creditAmount: amount,
            email,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        console.log("[credit-store] Free credits decremented:", {
          amount,
          remainingCredits: data.credits,
          timestamp: new Date().toISOString(),
        });

        set((state) => ({
          ...state,
          userFreeCredits: Math.max(0, state.userFreeCredits - amount),
          userCreditsTotal: state.userCreditsTotal - amount,
          totalCredits: state.totalCredits - amount,
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("[credit-store] Error decrementing free credits:", errorMsg);
        throw error;
      }
    } else if (state.userPaidCredits >= amount && publicKey && email) {
      // Fallback to paid credits
      try {
        const response = await fetch('/api/credits/decrement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'paid',
            creditAmount: amount,
            walletPublicKey: publicKey.toBase58(),
            email,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        console.log("[credit-store] Paid credits decremented:", {
          amount,
          remainingCredits: data.credits,
          timestamp: new Date().toISOString(),
        });

        set((state) => ({
          ...state,
          userPaidCredits: Math.max(0, state.userPaidCredits - amount),
          userCreditsTotal: state.userCreditsTotal - amount,
          totalCredits: state.totalCredits - amount,
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("[credit-store] Error decrementing paid credits:", errorMsg);
        throw error;
      }
    } else {
      const errorMsg = `Insufficient credits: Need ${amount}, have ${state.userFreeCredits} free, ${state.userPaidCredits} paid`;
      console.error("[credit-store] Insufficient credits for query:", errorMsg);
      throw new Error(errorMsg);
    }
  },
}));