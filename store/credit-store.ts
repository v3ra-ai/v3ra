import { create } from "zustand";
import { DEFAULTS } from "@/lib/types";

export interface CreditsStore {
  userFreeCredits: number;
  userPaidCredits: number;
  userCreditsTotal: number;
  decrementFreeCredits: (amount: number) => void;
  decrementPaidCredits: (amount: number) => void;
  incrementPaidCredits: (amount: number) => void;
  resetCreditsAfterPayment: () => void;
}

export const useCreditsStore = create<CreditsStore>((set) => ({
  userFreeCredits: DEFAULTS.USER_FREE_CREDITS,
  userPaidCredits: DEFAULTS.USER_PAID_CREDITS,
  userCreditsTotal: DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS,

  decrementFreeCredits: (amount: number) => set((state) => {
    const newFreeCredits = Math.max(0, state.userFreeCredits - amount);
    return {
      userFreeCredits: newFreeCredits,
      userCreditsTotal: newFreeCredits + state.userPaidCredits,
    };
  }),

  decrementPaidCredits: (amount: number) => set((state) => {
    const newPaidCredits = Math.max(0, state.userPaidCredits - amount);
    return {
      userPaidCredits: newPaidCredits,
      userCreditsTotal: state.userFreeCredits + newPaidCredits,
    };
  }),

  incrementPaidCredits: (amount: number) => set((state) => {
    const newPaidCredits = state.userPaidCredits + amount;
    return {
      userPaidCredits: newPaidCredits,
      userCreditsTotal: state.userFreeCredits + newPaidCredits,
    };
  }),

  resetCreditsAfterPayment: () => set(() => ({
    userFreeCredits: 0,
    userPaidCredits: 0,
    userCreditsTotal: 0,
  })),
}));