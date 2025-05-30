import { useEffect, useCallback } from "react";
import { useFavoritesStore } from "@/store/favorites-store";
import { Favorite } from "@/lib/types";

export function useFavorites() {
  const { favorites, isHydrated, hydrateFavorites, clearFavorites } =
    useFavoritesStore();

  useEffect(() => {
    if (!isHydrated) {
      hydrateFavorites();
    }
  }, [isHydrated, hydrateFavorites]);

  const syncFavorites = useCallback(async () => {
    try {
      await hydrateFavorites();
    } catch (error) {
      const typedError = error as Error;
      console.error("[useFavorites] Sync error:", typedError);
    }
  }, [hydrateFavorites]);

  const handleAccountSwitch = useCallback(async () => {
    try {
      clearFavorites();
      await hydrateFavorites();
    } catch (error) {
      const typedError = error as Error;
      console.error("[useFavorites] Account switch error:", typedError);
    }
  }, [clearFavorites, hydrateFavorites]);

  return {
    favorites: favorites as Favorite[],
    isHydrated,
    syncFavorites,
    handleAccountSwitch,
  };
}
