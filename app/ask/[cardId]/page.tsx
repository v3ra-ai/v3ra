import { prisma } from "@/lib/db/client";
import { VoteResult, VoteSession } from "@/lib/types"; // Update import
import CardViewer from "@/components/ask/card-client-wrapper";
import { CURRENT_DOMAIN } from "@/lib/constants";
import Navbar from "@/components/ask/navbar";
import AskFooter from "@/components/ask/ask-footer";
import { formatDateTimeCards } from "@/utils/date-utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const resolvedParams = await params;
  const cardId = resolvedParams.cardId;

  if (!cardId) {
    console.error("Invalid cardId in generateMetadata:", cardId);
    return { title: "Card Not Found" };
  }

  try {
    const data = await prisma.voteSession.findUnique({
      where: { id: cardId },
      include: {
        validatorResponses: {
          include: { validator: true },
        },
      },
    });

    if (!data) {
      console.error("Vote session not found for metadata:", { cardId });
      return { title: "Card Not Found" };
    }

    const typedData: VoteSession = {
      id: data.id,
      queryText: data.queryText,
      isConsensusReached: data.isConsensusReached,
      consensusValue: data.consensusValue,
      validatorResponses: data.validatorResponses.map((res) => ({
        id: res.validator?.id || res.validatorId || "unknown",
        provider: res.validator?.provider || "Unknown",
        profileName: res.validator?.profileName || "Unknown",
        vote: res.vote || "UNKNOWN",
        rationale: res.rationale || "",
      })),
      timestamp: data.timestamp.toISOString(),
      votesYes: data.votesYes,
      votesNo: data.votesNo,
      notVoted: data.notVoted,
    };

    // Validate required fields
    if (!typedData.id || !typedData.queryText) {
      console.error("Invalid vote session data for metadata:", {
        cardId,
        id: typedData.id,
        queryText: typedData.queryText,
      });
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
  } catch (error) {
    console.error("Error fetching vote session for metadata:", {
      cardId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { title: "Card Not Found" };
  }
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const resolvedParams = await params;
  const cardId = resolvedParams.cardId;

  if (!cardId) {
    console.error("Invalid cardId in CardPage:", cardId);
    return (
      <main
        className="min-h-screen bg-background flex flex-col"
        style={{
          backgroundImage: "url(/images/background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          width: "100vw",
          height: "100vh",
        }}
      >
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <p className="text-red-500">Error: Invalid card ID</p>
        </div>
        <AskFooter />
      </main>
    );
  }

  try {
    const data = await prisma.voteSession.findUnique({
      where: { id: cardId },
      include: {
        validatorResponses: {
          include: { validator: true },
        },
      },
    });

    if (!data) {
      console.error("Vote session not found:", { cardId });
      return (
        <main
          className="min-h-screen bg-background flex flex-col"
          style={{
            backgroundImage: "url(/images/background.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            backgroundRepeat: "no-repeat",
            width: "100vw",
            height: "100vh",
          }}
        >
          <Navbar />
          <div className="flex-grow flex items-center justify-center p-4">
            <p className="text-red-500">Error: Vote session not found for card ID {cardId}</p>
          </div>
          <AskFooter />
        </main>
      );
    }

    const typedData: VoteSession = {
      id: data.id,
      queryText: data.queryText,
      isConsensusReached: data.isConsensusReached,
      consensusValue: data.consensusValue,
      validatorResponses: data.validatorResponses.map((res) => ({
        id: res.validator?.id || res.validatorId || "unknown",
        provider: res.validator?.provider || "Unknown",
        profileName: res.validator?.profileName || "Unknown",
        vote: res.vote || "UNKNOWN",
        rationale: res.rationale || "",
      })),
      timestamp: data.timestamp.toISOString(),
      votesYes: data.votesYes,
      votesNo: data.votesNo,
      notVoted: data.notVoted,
    };

    // Validate required fields
    if (!typedData.id || !typedData.queryText) {
      console.error("Invalid vote session data:", {
        cardId,
        id: typedData.id,
        queryText: typedData.queryText,
      });
      return (
        <main
          className="min-h-screen bg-background flex flex-col"
          style={{
            backgroundImage: "url(/images/background.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            backgroundRepeat: "no-repeat",
            width: "100vw",
            height: "100vh",
          }}
        >
          <Navbar />
          <div className="flex-grow flex items-center justify-center p-4">
            <p className="text-red-500">Error: Invalid vote session data for card ID {cardId}</p>
          </div>
          <AskFooter />
        </main>
      );
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

    return (
      <main
        className="min-h-screen bg-background flex flex-col"
        style={{
          backgroundImage: "url(/images/background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          width: "100vw",
          height: "100vh",
        }}
      >
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <CardViewer query={card} layoutMode="row" />
        </div>
        <AskFooter />
      </main>
    );
  } catch (error) {
    console.error("Error fetching vote session:", {
      cardId,
      error: error instanceof Error ? error.message : String(error),
    });
    return (
      <main
        className="min-h-screen bg-background flex flex-col"
        style={{
          backgroundImage: "url(/images/background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          width: "100vw",
          height: "100vh",
        }}
      >
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-4">
          <p className="text-red-500">
            Error: Failed to load vote session for card ID {cardId}
          </p>
        </div>
        <AskFooter />
      </main>
    );
  }
}