import { create } from "zustand";
import { QueryMode } from "@/lib/types";

interface NavStore {
  queryMode: QueryMode | null;
  setQueryMode: (mode: QueryMode | null) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  queryMode: null,
  setQueryMode: (mode) => {
    console.log("[useNavStore] Setting queryMode:", mode);
    set({ queryMode: mode });
  },
}));