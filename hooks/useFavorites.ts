import { useEffect } from "react";
import { useFavoritesStore } from "@/store/favorites-store";
import { fetchUserFavorites } from "@/app/actions";

export function useFavorites() {
  const { favorites, isHydrated, setFavorites } = useFavoritesStore();

  useEffect(() => {
    if (isHydrated) {
      // Fetch user favorites from server
      fetchUserFavorites()
        .then((result) => {
          if (Array.isArray(result)) {
            setFavorites(result);
          } else if (result.error === "User not authenticated") {
            // Silently handle unauthenticated users - this is expected
            setFavorites([]);
          } else {
            console.error("Failed to fetch favorites:", result.error);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch favorites:", error);
        });
    }
  }, [isHydrated, setFavorites]);

  return {
    favorites,
    isHydrated,
  };
}