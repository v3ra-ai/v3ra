import { prisma } from "@/lib/db/client";
import { VoteResult, VoteSession } from "@/lib/types";
import { CURRENT_DOMAIN } from "@/lib/constants";
import { formatDateTimeCards } from "@/utils/date-utils";
import CardPageClient from "./card-page-client"; // New client component

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const resolvedParams = await params;
  const cardId = resolvedParams.cardId;

  if (!cardId) {
    return { title: "Card Not Found" };
  }

  try {
    const data = await prisma.voteSession.findUnique({
      where: { id: cardId },
      include: {
        ValidatorResponse: {
          include: { Validator: true },
        },
      },
    });

    if (!data) {
      return { title: "Card Not Found" };
    }

    const typedData: VoteSession = {
      id: data.id,
      queryText: data.queryText,
      isConsensusReached: data.isConsensusReached,
      consensusValue: data.consensusValue,
      validatorResponses: data.ValidatorResponse.map((res) => ({
        id: res.Validator?.id || res.validatorId || "unknown",
        provider: res.Validator?.provider || "Unknown",
        profileName: res.Validator?.profileName || "Unknown",
        vote: res.vote || "UNKNOWN",
        rationale: res.rationale || "",
      })),
      timestamp: data.timestamp.toISOString(),
      votesYes: data.votesYes,
      votesNo: data.votesNo,
      notVoted: data.notVoted,
    };

    if (!typedData.id || !typedData.queryText) {
      return { title: "Card Not Found" };
    }

    const card: VoteResult = {
      id: typedData.id,
      queryText: typedData.queryText,
      isConsensusReached: typedData.isConsensusReached,
      consensusValue: typedData.consensusValue,
      validatorResponses: (typedData.validatorResponses || []).map((res) => ({
        id: res.id,
        provider: res.provider,
        profileName: res.profileName,
        vote: res.vote,
        rationale: res.rationale,
      })),
      votingResult: {
        yes: typedData.votesYes || 0,
        no: typedData.votesNo || 0,
        notVoted: typedData.notVoted || 0,
      },
      timestamp: formatDateTimeCards(data.timestamp),
    };

    const ogImageUrl = `https://${CURRENT_DOMAIN}/api/og?cardId=${cardId}`;
    const description = `Truth Report Card: ${
      card.isConsensusReached
        ? card.consensusValue
          ? "True"
          : "False"
        : "No Consensus"
    }`;

    return {
      title: card.queryText,
      openGraph: {
        title: card.queryText,
        description,
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        url: `https://${CURRENT_DOMAIN}/ask/${cardId}`,
      },
      twitter: {
        card: "summary_large_image",
        title: card.queryText,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return { title: "Card Not Found" };
  }
}

async function fetchVoteSession(cardId: string): Promise<VoteResult | { error: string }> {
  if (!cardId) {
    return { error: "Invalid card ID" };
  }

  try {
    const data = await prisma.voteSession.findUnique({
      where: { id: cardId },
      include: {
        ValidatorResponse: {
          include: { Validator: true },
        },
      },
    });

    if (!data) {
      return { error: `Vote session not found for card ID ${cardId}` };
    }

    const typedData: VoteSession = {
      id: data.id,
      queryText: data.queryText,
      isConsensusReached: data.isConsensusReached,
      consensusValue: data.consensusValue,
      validatorResponses: data.ValidatorResponse.map((res) => ({
        id: res.Validator?.id || res.validatorId || "unknown",
        provider: res.Validator?.provider || "Unknown",
        profileName: res.Validator?.profileName || "Unknown",
        vote: res.vote || "UNKNOWN",
        rationale: res.rationale || "",
      })),
      timestamp: data.timestamp.toISOString(),
      votesYes: data.votesYes,
      votesNo: data.votesNo,
      notVoted: data.notVoted,
    };

    if (!typedData.id || !typedData.queryText) {
      return { error: `Invalid vote session data for card ID ${cardId}` };
    }

    const card: VoteResult = {
      id: typedData.id,
      queryText: typedData.queryText,
      isConsensusReached: typedData.isConsensusReached,
      consensusValue: typedData.consensusValue,
      validatorResponses: (typedData.validatorResponses || []).map((res) => ({
        id: res.id,
        provider: res.provider,
        profileName: res.profileName,
        vote: res.vote,
        rationale: res.rationale,
      })),
      votingResult: {
        yes: typedData.votesYes || 0,
        no: typedData.votesNo || 0,
        notVoted: typedData.notVoted || 0,
      },
      timestamp: formatDateTimeCards(data.timestamp),
    };

    return card;
  } catch {
    return { error: `Failed to load vote session for card ID ${cardId}` };
  }
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const resolvedParams = await params;
  const cardId = resolvedParams.cardId;
  const result = await fetchVoteSession(cardId);

  return <CardPageClient cardId={cardId} result={result} />;
}