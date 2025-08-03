import { create } from "zustand";
import { supabase } from "@/lib/supabase-client";
import { sessionCache } from "@/lib/utils/cache";
import { createLogger } from "@/lib/logger";

const logger = createLogger('points-store');

interface PointsStore {
  userPoints: number;
  canClaimBonus: boolean;
  claiming: boolean;
  isLoading: boolean;
  setUserPoints: (points: number) => void;
  setCanClaimBonus: (canClaim: boolean) => void;
  setClaiming: (claiming: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  fetchUserPoints: () => Promise<void>;
  updatePoints: (newPoints: number) => void;
  claimDailyBonus: () => Promise<void>;
}

export const usePointsStore = create<PointsStore>((set, get) => ({
  userPoints: 1000,
  canClaimBonus: false,
  claiming: false,
  isLoading: false,

  setUserPoints: (points) => set({ userPoints: points }),
  setCanClaimBonus: (canClaim) => set({ canClaimBonus: canClaim }),
  setClaiming: (claiming) => set({ claiming }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  fetchUserPoints: async () => {
    const { isLoading } = get();
    if (isLoading) return; // Prevent duplicate fetches
    
    set({ isLoading: true });
    try {
      // Check cache first for user session
      const cachedSession = sessionCache.get('user-session');
      const user = cachedSession?.user;
      
      if (!user) {
        // Fetch from Supabase if not cached
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        if (freshUser) {
          const response = await fetch('/api/user/points');
          if (response.ok) {
            const data = await response.json();
            set({ 
              userPoints: data.balance || 0,
              canClaimBonus: false // TODO: Implement daily bonus check
            });
          } else {
            // Fallback values
            set({ userPoints: 1000, canClaimBonus: true });
          }
        } else {
          // Not authenticated - use demo values
          set({ userPoints: 1000, canClaimBonus: true });
        }
      } else {
        // Use cached user
        const response = await fetch('/api/user/points');
        if (response.ok) {
          const data = await response.json();
          set({ 
            userPoints: data.balance || 0,
            canClaimBonus: false 
          });
        } else {
          set({ userPoints: 1000, canClaimBonus: true });
        }
      }
    } catch (error) {
      logger.error('Failed to fetch points', error);
      // Set default values
      set({ userPoints: 1000, canClaimBonus: true });
    } finally {
      set({ isLoading: false });
    }
  },

  updatePoints: (newPoints) => {
    set({ userPoints: newPoints });
  },

  claimDailyBonus: async () => {
    set({ claiming: true });
    try {
      // Simulate claiming daily bonus (demo mode)
      const currentPoints = get().userPoints;
      set({ 
        userPoints: currentPoints + 50,
        canClaimBonus: false 
      });
      alert('Claimed 50 V3RA points! (Demo mode)');
    } catch (error) {
      logger.error('Failed to claim bonus', error);
    } finally {
      set({ claiming: false });
    }
  }
}));