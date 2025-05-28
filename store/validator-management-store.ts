import { create } from "zustand";
import { Validator } from "@/lib/types";

interface ValidatorSelectionStore {
  validators: Validator[]; // all validators
  selectedIds: string[]; // ids of selected validators
  available: Validator[]; // derived – unselected
  active: Validator[]; // derived – selected
  onboardingSeen?: boolean; // legacy
  initValidators: (validators: Validator[]) => void;
  toggleValidator: (id: string) => void;
  activateValidator: (id: string) => void; // legacy for compatibility
  deactivateValidator: (id: string) => void; // legacy
  selectAll: () => void;
  clearSelection: () => void;
}

export const useValidatorManagementStore = create<ValidatorSelectionStore>((set) => ({
  validators: [],
  selectedIds: [],
  available: [],
  active: [],
  onboardingSeen: true,

  // Initialize from backend list
  initValidators: (validators) =>
    set(() => {
      const selected = validators.filter((v) => v.active).map((v) => v.id);
      return {
        validators,
        selectedIds: selected,
        active: validators.filter((v) => selected.includes(v.id)),
        available: validators.filter((v) => !selected.includes(v.id)),
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
}));
