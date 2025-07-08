import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { sessionCache } from "@/lib/utils/cache";

export function useUserPoints() {
  const [userPoints, setUserPoints] = useState<number>(1000);
  const [canClaimBonus, setCanClaimBonus] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchUserPoints();
  }, []);
  
  const fetchUserPoints = async () => {
    try {
      // Check cache first for user session
      const cachedSession = sessionCache.get('user-session');
      const user = cachedSession?.user;
      
      if (!user) {
        // Fetch from Supabase if not cached
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        if (freshUser) {
          const response = await fetch(`/api/user/points?userId=${freshUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setUserPoints(data.balance || 0);
            setCanClaimBonus(false); // TODO: Implement daily bonus check
          } else {
            // Fallback values
            setUserPoints(1000);
            setCanClaimBonus(true);
          }
        } else {
          // Not authenticated - use demo values
          setUserPoints(1000);
          setCanClaimBonus(true);
        }
      } else {
        // Use cached user
        const response = await fetch(`/api/user/points?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.balance || 0);
          setCanClaimBonus(false);
        } else {
          setUserPoints(1000);
          setCanClaimBonus(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch points:", error);
      // Set default values
      setUserPoints(1000);
      setCanClaimBonus(true);
    }
  };
  
  const claimDailyBonus = async () => {
    setClaiming(true);
    try {
      // Simulate claiming daily bonus (demo mode)
      setUserPoints(prev => prev + 50);
      setCanClaimBonus(false);
      alert('Claimed 50 V3RA points! (Demo mode)');
    } catch (error) {
      console.error("Failed to claim bonus:", error);
    } finally {
      setClaiming(false);
    }
  };

  return {
    userPoints,
    canClaimBonus,
    claiming,
    claimDailyBonus,
    refreshPoints: fetchUserPoints
  };
}