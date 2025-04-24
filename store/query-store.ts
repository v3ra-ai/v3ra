import { create } from "zustand";
import type { VoteResult } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";
import {
  USER_FREE_CREDITS_DEFAULT,
  USER_PAID_CREDITS_DEFAULT,
  QUERIES_REQUESTED_DEFAULT,
  USER_CREDIT_CONVERSION_DEFAULT,
  QUERIES_COST_EACH_DEFAULT,
} from "@/lib/constants";

export type QueryMode = "factCheck" | "predict" | "create" | "shop";
export type ViewMode = "viewStandard" | "viewExpert";

const DEFAULT_VIEW_MODE: ViewMode = "viewExpert";

export interface QueryStore {
  userFreeCredits: number;
  userPaidCredits: number;
  userCreditsTotal: number;
  queriesRequested: number;
  queriesUnpaid: number;
  queriesCostEach: number;
  queriesCostTotal: number;
  userCreditConversion: number;
  queryMode: QueryMode;
  viewMode: ViewMode;
  voteHistory: VoteResult[];
  lastVoteResult: VoteResult | null;
  decrementFreeCredits: (amount: number) => void;
  decrementPaidCredits: (amount: number) => void;
  incrementPaidCredits: (amount: number) => void;
  setQueriesRequested: (amount: number) => void;
  setQueryMode: (mode: QueryMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setVoteHistory: Dispatch<SetStateAction<VoteResult[]>>;
  setLastVoteResult: Dispatch<SetStateAction<VoteResult | null>>;
  resetAfterSubmission: () => void;
  decrementQueries: (amount: number) => void;
  incrementQueries: (amount: number) => void;
  setUserAiQueryAmountRequested: (amount: number) => void;
  resetCreditsAfterPayment: () => void;
}

export const useQueryStore = create<QueryStore>((set, get) => ({
  userFreeCredits: USER_FREE_CREDITS_DEFAULT,
  userPaidCredits: USER_PAID_CREDITS_DEFAULT,
  userCreditsTotal: USER_FREE_CREDITS_DEFAULT + USER_PAID_CREDITS_DEFAULT,
  queriesRequested: QUERIES_REQUESTED_DEFAULT,
  queriesUnpaid: QUERIES_REQUESTED_DEFAULT - (USER_FREE_CREDITS_DEFAULT + USER_PAID_CREDITS_DEFAULT),
  queriesCostEach: QUERIES_COST_EACH_DEFAULT,
  queriesCostTotal: Math.max(0, QUERIES_REQUESTED_DEFAULT - (USER_FREE_CREDITS_DEFAULT + USER_PAID_CREDITS_DEFAULT)) * QUERIES_COST_EACH_DEFAULT,
  userCreditConversion: USER_CREDIT_CONVERSION_DEFAULT,
  queryMode: "factCheck",
  viewMode: DEFAULT_VIEW_MODE,
  voteHistory: [],
  lastVoteResult: null,
  decrementFreeCredits: (amount: number) =>
    set((state) => ({
      userFreeCredits: Math.max(0, state.userFreeCredits - amount),
      userCreditsTotal: Math.max(0, state.userFreeCredits - amount + state.userPaidCredits),
      queriesUnpaid: state.queriesRequested - Math.max(0, state.userFreeCredits - amount + state.userPaidCredits),
      queriesCostTotal: Math.max(0, state.queriesRequested - Math.max(0, state.userFreeCredits - amount + state.userPaidCredits)) * state.queriesCostEach,
    })),
  decrementPaidCredits: (amount: number) =>
    set((state) => ({
      userPaidCredits: Math.max(0, state.userPaidCredits - amount),
      userCreditsTotal: Math.max(0, state.userFreeCredits + state.userPaidCredits - amount),
      queriesUnpaid: state.queriesRequested - Math.max(0, state.userFreeCredits + state.userPaidCredits - amount),
      queriesCostTotal: Math.max(0, state.queriesRequested - Math.max(0, state.userFreeCredits + state.userPaidCredits - amount)) * state.queriesCostEach,
    })),
  incrementPaidCredits: (amount: number) =>
    set((state) => ({
      userPaidCredits: state.userPaidCredits + amount,
      userCreditsTotal: state.userFreeCredits + state.userPaidCredits + amount,
      queriesUnpaid: state.queriesRequested - (state.userFreeCredits + state.userPaidCredits + amount),
      queriesCostTotal: Math.max(0, state.queriesRequested - (state.userFreeCredits + state.userPaidCredits + amount)) * state.queriesCostEach,
    })),
  setQueriesRequested: (amount: number) =>
    set((state) => ({
      queriesRequested: amount,
      queriesUnpaid: amount - state.userCreditsTotal,
      queriesCostTotal: Math.max(0, amount - state.userCreditsTotal) * state.queriesCostEach,
    })),
  setQueryMode: (mode: QueryMode) =>
    set(() => ({
      queryMode: mode,
    })),
  setViewMode: (mode: ViewMode) =>
    set(() => ({
      viewMode: mode,
    })),
  setVoteHistory: (history: VoteResult[] | ((prev: VoteResult[]) => VoteResult[])) =>
    set((state) => ({
      voteHistory: typeof history === "function" ? history(state.voteHistory) : history,
    })),
  setLastVoteResult: (result: VoteResult | null | ((prev: VoteResult | null) => VoteResult | null)) =>
    set((state) => ({
      lastVoteResult: typeof result === "function" ? result(state.lastVoteResult) : result,
    })),
  resetAfterSubmission: () =>
    set((state) => {
      const remainingCredits = Math.max(0, state.userCreditsTotal - state.queriesRequested);
      const freeCredits = Math.min(remainingCredits, state.userFreeCredits);
      const paidCredits = remainingCredits - freeCredits;
      return {
        userFreeCredits: freeCredits,
        userPaidCredits: paidCredits,
        userCreditsTotal: remainingCredits,
        queriesRequested: QUERIES_REQUESTED_DEFAULT,
        queriesUnpaid: QUERIES_REQUESTED_DEFAULT - remainingCredits,
        queriesCostTotal: Math.max(0, QUERIES_REQUESTED_DEFAULT - remainingCredits) * state.queriesCostEach,
      };
    }),
  decrementQueries: (amount: number) =>
    set((state) => {
      const freeAmount = Math.min(amount, state.userFreeCredits);
      const paidAmount = amount - freeAmount;
      return {
        userFreeCredits: Math.max(0, state.userFreeCredits - freeAmount),
        userPaidCredits: Math.max(0, state.userPaidCredits - paidAmount),
        userCreditsTotal: Math.max(0, state.userFreeCredits - freeAmount + state.userPaidCredits - paidAmount),
        queriesUnpaid: state.queriesRequested - Math.max(0, state.userFreeCredits - freeAmount + state.userPaidCredits - paidAmount),
        queriesCostTotal: Math.max(0, state.queriesRequested - Math.max(0, state.userFreeCredits - freeAmount + state.userPaidCredits - paidAmount)) * state.queriesCostEach,
      };
    }),
  incrementQueries: (amount: number) =>
    set((state) => ({
      userPaidCredits: state.userPaidCredits + amount,
      userCreditsTotal: state.userFreeCredits + state.userPaidCredits + amount,
      queriesUnpaid: state.queriesRequested - (state.userFreeCredits + state.userPaidCredits + amount),
      queriesCostTotal: Math.max(0, state.queriesRequested - (state.userFreeCredits + state.userPaidCredits + amount)) * state.queriesCostEach,
    })),
  setUserAiQueryAmountRequested: (amount: number) =>
    set((state) => ({
      queriesRequested: amount,
      queriesUnpaid: amount - state.userCreditsTotal,
      queriesCostTotal: Math.max(0, amount - state.userCreditsTotal) * state.queriesCostEach,
    })),
  resetCreditsAfterPayment: () =>
    set((state) => ({
      userFreeCredits: 0,
      userPaidCredits: 0,
      userCreditsTotal: 0,
      queriesUnpaid: state.queriesRequested, // All requested queries are unpaid since credits are 0
      queriesCostTotal: state.queriesRequested * state.queriesCostEach,
    })),
}));