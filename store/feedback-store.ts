import { create } from 'zustand';

interface FeedbackState {
  isModalOpen: boolean;
  selectedOptions: string[];
  explanation: string;
  component: string;
  action: string;
  setModalOpen: (open: boolean) => void;
  setSelectedOptions: (options: string[]) => void;
  setExplanation: (explanation: string) => void;
  setContext: (component: string, action: string) => void;
  reset: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  isModalOpen: false,
  selectedOptions: [],
  explanation: '',
  component: '',
  action: '',
  setModalOpen: (open) => set({ isModalOpen: open }),
  setSelectedOptions: (options) => set({ selectedOptions: options }),
  setExplanation: (explanation) => set({ explanation }),
  setContext: (component, action) => set({ component, action }),
  reset: () => set({ isModalOpen: false, selectedOptions: [], explanation: '', component: '', action: '' }),
}));