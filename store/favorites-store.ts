import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Favorite {
  id: string;
  user_id: string;
  vote_session_id: string;
  created_at: string;
}

interface FavoritesStore {
  favorites: Favorite[];
  isHydrated: boolean;
  setFavorites: (favorites: Favorite[]) => void;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (voteSessionId: string) => void;
  isFavorite: (voteSessionId: string) => boolean;
  setHydrated: (hydrated: boolean) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      isHydrated: false,
      setFavorites: (favorites) => set({ favorites }),
      addFavorite: (favorite) =>
        set((state) => ({ favorites: [...state.favorites, favorite] })),
      removeFavorite: (voteSessionId) =>
        set((state) => ({
          favorites: state.favorites.filter(
            (f) => f.vote_session_id !== voteSessionId
          ),
        })),
      isFavorite: (voteSessionId) =>
        get().favorites.some((f) => f.vote_session_id === voteSessionId),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "favorites-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);