import { VoteResult } from "@/lib/types";

/**
 * Compares two VoteResult arrays by checking if their id fields match.
 * @param a - First VoteResult array.
 * @param b - Second VoteResult array.
 * @returns True if arrays have the same length and matching ids in order, false otherwise.
 */
export function areVoteHistoriesEqual(
  a: VoteResult[],
  b: VoteResult[]
): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item.id === b[index].id);
}

/**
 * Calculates percentage distributions for yes, no, and notVoted votes from a VoteResult.
 * @param voteResult - The VoteResult object or null.
 * @returns An object with percentages for yes, no, and notVoted votes.
 */
export function calculateVotePercentages(voteResult: VoteResult | null): {
  yes: number;
  no: number;
  notVoted: number;
} {
  const totalVotes = voteResult?.votingResult
    ? (voteResult.votingResult.yes ?? 0) +
      (voteResult.votingResult.no ?? 0) +
      (voteResult.votingResult.notVoted ?? 0)
    : 0;
  return {
    yes: totalVotes
      ? ((voteResult?.votingResult?.yes ?? 0) / totalVotes) * 100
      : 0,
    no: totalVotes
      ? ((voteResult?.votingResult?.no ?? 0) / totalVotes) * 100
      : 0,
    notVoted: totalVotes
      ? ((voteResult?.votingResult?.notVoted ?? 0) / totalVotes) * 100
      : 0,
  };
}

/**
 * Computes the consensus rating percentage and color for a VoteResult.
 * @param voteResult - The VoteResult object.
 * @returns An object with percentage (e.g., "75%" or "N/A") and color (Tailwind class).
 */
export function calculateRating(voteResult: VoteResult): {
  percentage: string;
  color: string;
} {
  const percentage =
    !voteResult.isConsensusReached || !voteResult.validatorResponses?.length
      ? "N/A"
      : `${(
          (voteResult.validatorResponses.filter(
            (response) =>
              response.vote === (voteResult.consensusValue ? "YES" : "NO")
          ).length /
            voteResult.validatorResponses.length) *
          100
        ).toFixed(0)}%`;

  const color = voteResult.consensusValue
    ? "text-zinc-700 dark:text-zinc-300"
    : "text-zinc-700 dark:text-zinc-300";

  return { percentage, color };
}
