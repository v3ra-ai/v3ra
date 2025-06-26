export function calculateRating(yesVotes: number, noVotes: number): number {
  const totalVotes = yesVotes + noVotes;
  if (totalVotes === 0) return 0;
  
  // Simple percentage calculation
  return Math.round((yesVotes / totalVotes) * 100);
}

export function calculateVotePercentages(yesVotes: number, noVotes: number) {
  const totalVotes = yesVotes + noVotes;
  
  if (totalVotes === 0) {
    return {
      yesPercentage: 0,
      noPercentage: 0,
      totalVotes: 0,
    };
  }
  
  return {
    yesPercentage: Math.round((yesVotes / totalVotes) * 100),
    noPercentage: Math.round((noVotes / totalVotes) * 100),
    totalVotes,
  };
}

export function areVoteHistoriesEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
  }
  
  return true;
}