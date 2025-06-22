import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Favorite } from "@/lib/types";
import { fetchUserFavorites } from "@/app/actions";

interface FavoritesState {
  favorites: Favorite[];
  isHydrated: boolean;
  setFavorites: (favorites: Favorite[]) => void;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (voteSessionId: string) => void;
  hydrateFavorites: () => Promise<void>;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      favorites: [],
      isHydrated: false,
      setFavorites: (favorites) => set({ favorites, isHydrated: true }),
      addFavorite: (favorite) =>
        set((state) => ({
          favorites: [...state.favorites, favorite],
        })),
      removeFavorite: (voteSessionId) =>
        set((state) => ({
          favorites: state.favorites.filter(
            (f) => f.vote_session_id !== voteSessionId
          ),
        })),
      hydrateFavorites: async () => {
        // Only hydrate on client side
        if (typeof window === "undefined") {
          set({ favorites: [], isHydrated: true });
          return;
        }
        
        try {
          const result = await fetchUserFavorites();
          if ("error" in result) {
            // Only log non-authentication errors to reduce console noise
            if (result.error !== "User not authenticated") {
              console.warn("[favorites-store] Unable to fetch favorites:", result.error);
            }
            set({ favorites: [], isHydrated: true });
            return;
          }
          set({ favorites: result, isHydrated: true });
        } catch (error) {
          const typedError = error as Error;
          console.warn("[favorites-store] Unable to fetch favorites:", typedError.message);
          set({ favorites: [], isHydrated: true });
        }
      },
      clearFavorites: () => set({ favorites: [], isHydrated: false }),
    }),
    {
      name: "favorites-storage",
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
);