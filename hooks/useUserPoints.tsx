import { useEffect } from "react";
import { usePointsStore } from "@/store/points-store";

export function useUserPoints() {
  const {
    userPoints,
    canClaimBonus,
    claiming,
    fetchUserPoints,
    updatePoints,
    claimDailyBonus
  } = usePointsStore();

  useEffect(() => {
    fetchUserPoints();
  }, [fetchUserPoints]);

  return {
    userPoints,
    canClaimBonus,
    claiming,
    claimDailyBonus,
    refreshPoints: fetchUserPoints,
    updatePoints
  };
}