/**
 * Calculate Elo rating changes for winner and loser
 * @param winnerRating Current Elo rating of the winner
 * @param loserRating Current Elo rating of the loser
 * @param k K-factor (typically 16-32, higher means more volatile ratings)
 * @returns Object with new ratings for winner and loser
 */
export function calculateEloRating(
  winnerRating: number,
  loserRating: number,
  k = 32
): { winnerNew: number; loserNew: number; change: number } {
  // Calculate expected scores
  const expectedScoreWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedScoreLoser = 1 - expectedScoreWinner;
  
  // Calculate new ratings
  const winnerNew = Math.round(winnerRating + k * (1 - expectedScoreWinner));
  const loserNew = Math.round(loserRating + k * (0 - expectedScoreLoser));
  
  // Calculate the rating change (always positive)
  const change = winnerNew - winnerRating;
  
  return { winnerNew, loserNew, change };
}

/**
 * Get K-factor based on number of games played (adaptive K-factor)
 * @param gamesPlayed Number of games the player has played
 * @returns K-factor to use for rating calculation
 */
export function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < 10) return 40; // High volatility for new players
  if (gamesPlayed < 30) return 32; // Medium volatility
  return 24; // Lower volatility for experienced players/models
}

/**
 * Calculate win probability based on Elo ratings
 * @param ratingA Elo rating of player/model A
 * @param ratingB Elo rating of player/model B
 * @returns Probability that A beats B (0-1)
 */
export function calculateWinProbability(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Get rating tier/rank name based on Elo rating
 * @param rating Elo rating
 * @returns Tier name and color
 */
export function getRatingTier(rating: number): { name: string; color: string; icon: string } {
  if (rating >= 2400) return { name: 'Grandmaster', color: '#FFD700', icon: '👑' };
  if (rating >= 2200) return { name: 'Master', color: '#E5E4E2', icon: '💎' };
  if (rating >= 2000) return { name: 'Expert', color: '#CD7F32', icon: '🏆' };
  if (rating >= 1800) return { name: 'Advanced', color: '#9370DB', icon: '⭐' };
  if (rating >= 1600) return { name: 'Intermediate', color: '#4169E1', icon: '🔵' };
  if (rating >= 1400) return { name: 'Novice', color: '#32CD32', icon: '🟢' };
  return { name: 'Beginner', color: '#808080', icon: '⚪' };
}

/**
 * Calculate confidence interval for Elo rating
 * @param rating Current Elo rating
 * @param gamesPlayed Number of games played
 * @returns Confidence interval (± value)
 */
export function calculateConfidenceInterval(rating: number, gamesPlayed: number): number {
  // Confidence decreases as more games are played
  const baseConfidence = 100;
  const reduction = Math.min(gamesPlayed * 2, 80);
  return Math.max(baseConfidence - reduction, 20);
}