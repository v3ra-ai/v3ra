import { create } from "zustand";
import { Validator } from "@/lib/types";

interface ValidatorSelectionStore {
  validators: Validator[]; // all validators
  selectedIds: string[]; // ids of selected validators
  available: Validator[]; // derived – unselected
  active: Validator[]; // derived – selected
  onboardingSeen?: boolean; // legacy
  initValidators: (validators: Array<Record<string, unknown> | Validator>) => void;
  toggleValidator: (id: string) => void;
  activateValidator: (id: string) => void; // legacy for compatibility
  deactivateValidator: (id: string) => void; // legacy
  selectAll: () => void;
  clearSelection: () => void;
  setOnboardingSeen: () => void; // Mark the onboarding as seen
}

export const useValidatorManagementStore = create<ValidatorSelectionStore>((set) => ({
  validators: [],
  selectedIds: [],
  available: [],
  active: [],
  onboardingSeen: true,

  // Initialize from backend list
  initValidators: (validators: Array<Record<string, unknown> | Validator>) =>
    set(() => {
      // Cast the validators to the expected Validator type
      const typedValidators = validators as Validator[];
      const selected = typedValidators.filter((v) => v.active).map((v) => v.id);
      return {
        validators: typedValidators,
        selectedIds: selected,
        active: typedValidators.filter((v) => selected.includes(v.id)),
        available: typedValidators.filter((v) => !selected.includes(v.id)),
      };
    }),

  // Toggle selection state
  toggleValidator: (id) =>
    set((state) => {
      const isSelected = state.selectedIds.includes(id);
      const newSelected = isSelected
        ? state.selectedIds.filter((vid) => vid !== id)
        : [...state.selectedIds, id];
      return {
        selectedIds: newSelected,
        active: state.validators.filter((v) => newSelected.includes(v.id)),
        available: state.validators.filter((v) => !newSelected.includes(v.id)),
      };
    }),

  // legacy wrappers
  activateValidator: (id) =>
    set((state) => {
      const newSelected = state.selectedIds.includes(id)
        ? state.selectedIds
        : [...state.selectedIds, id];
      return {
        selectedIds: newSelected,
        active: state.validators.filter((v) => newSelected.includes(v.id)),
        available: state.validators.filter((v) => !newSelected.includes(v.id)),
      };
    }),

  deactivateValidator: (id) =>
    set((state) => {
      const newSelected = state.selectedIds.filter((vid) => vid !== id);
      return {
        selectedIds: newSelected,
        active: state.validators.filter((v) => newSelected.includes(v.id)),
        available: state.validators.filter((v) => !newSelected.includes(v.id)),
      };
    }),

  // Bulk select all
  selectAll: () =>
    set((state) => ({
      selectedIds: state.validators.map((v) => v.id),
      active: state.validators,
      available: [],
    })),

  // Clear selection
  clearSelection: () =>
    set((state) => ({
      selectedIds: [],
      active: [],
      available: state.validators,
    })),

  // Mark the onboarding as seen
  setOnboardingSeen: () =>
    set({
      onboardingSeen: true,
    }),
}));
