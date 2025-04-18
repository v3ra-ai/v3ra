"use server";

import type { VoteResult, VoteValidatorResponse } from "../lib/types";
import { prisma } from "../lib/db/client";
import { v4 as uuidv4 } from "uuid";
import { OpenAIValidator } from "@/lib/validators/providers/openai";
import { AnthropicValidator } from "@/lib/validators/providers/anthropic";
import { GrokValidator } from "@/lib/validators/providers/grok";
import { GeminiValidator } from "@/lib/validators/providers/gemini";
import { validatorService } from "@/lib/services/validatorService";
import { Validator, ValidatorKey } from "@prisma/client";

type DbValidatorWithKeys = Validator & { apiKeys: ValidatorKey[] };

export async function broadcastCustomQuery(
  query: string,
): Promise<VoteResult | { error: string }> {
  try {
    console.log("Processing custom query:", query);

    const dbValidators: DbValidatorWithKeys[] =
      await validatorService.getActiveDbValidators();

    if (!dbValidators || dbValidators.length === 0) {
      console.warn("No active validators found in the database");
      return { error: "No active validators found" };
    }

    console.log(
      `Found ${dbValidators.length} active validators in the registry`,
    );

    const sessionId = uuidv4();

    const voteSession = await prisma.voteSession.create({
      data: {
        id: sessionId,
        queryText: query,
        isConsensusReached: false,
        timestamp: new Date(),
        votesYes: 0,
        votesNo: 0,
        notVoted: 0,
      },
    });

    const validatorResponsePromises: Promise<VoteValidatorResponse>[] = [];

    for (const dbValidator of dbValidators) {
      let validator;

      if (dbValidator.provider === "OpenAI") {
        validator = new OpenAIValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          keyId: dbValidator.apiKeys[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else if (dbValidator.provider === "Anthropic") {
        console.log(
          `Creating Anthropic validator instance for ${dbValidator.id} (${dbValidator.profileName})`,
        );
        validator = new AnthropicValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          keyId: dbValidator.apiKeys[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else if (dbValidator.provider === "Grok") {
        console.log(
          `Creating Grok validator instance for ${dbValidator.id} (${dbValidator.profileName})`,
        );
        validator = new GrokValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          keyId: dbValidator.apiKeys[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else if (dbValidator.provider === "Google") {
        console.log(
          `Creating Google Gemini validator instance for ${dbValidator.id} (${dbValidator.profileName})`,
        );
        validator = new GeminiValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          keyId: dbValidator.apiKeys[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else {
        console.warn(
          `Validator provider ${dbValidator.provider} not supported yet`,
        );
        continue;
      }

      const validationPromise = validator
        .validate({
          statement: query,
        })
        .then(async (response) => {
          await validatorService.recordValidatorResponse({
            validatorId: dbValidator.id,
            voteSessionId: sessionId,
            vote: response.vote,
            rationale: response.rationale,
            confidence: response.confidence,
            latency: response.latency,
            error: response.error,
          });

          return {
            id: dbValidator.id,
            provider: dbValidator.provider,
            profileName: dbValidator.profileName,
            vote: response.vote ? "YES" : "NO",
            rationale: response.rationale,
          } as VoteValidatorResponse;
        })
        .catch((error) => {
          console.error(`Error processing validator ${dbValidator.id}:`, error);
          return {
            id: dbValidator.id,
            provider: dbValidator.provider,
            profileName: dbValidator.profileName,
            vote: "ERROR" as const,
            rationale: `Error: ${error.message}`,
          } as VoteValidatorResponse;
        });

      validatorResponsePromises.push(validationPromise);
    }

    const validatorResponses: VoteValidatorResponse[] = await Promise.all(
      validatorResponsePromises,
    );

    const yesVotes = validatorResponses.filter((r) => r.vote === "YES").length;
    const noVotes = validatorResponses.filter((r) => r.vote === "NO").length;
    const notVoted = validatorResponses.filter(
      (r) => r.vote === "ERROR",
    ).length;

    const totalValidVotes = yesVotes + noVotes;
    const isConsensusReached = totalValidVotes > 0;
    const consensusValue = totalValidVotes > 0 ? yesVotes > noVotes : null;

    await prisma.voteSession.update({
      where: { id: sessionId },
      data: {
        isConsensusReached,
        consensusValue,
        votesYes: yesVotes,
        votesNo: noVotes,
        notVoted,
        updatedAt: new Date(),
      },
    });

    const result: VoteResult = {
      id: sessionId,
      isConsensusReached,
      consensusValue,
      queryText: voteSession.queryText,
      validatorResponses,
      votingResult: {
        yes: yesVotes,
        no: noVotes,
        notVoted,
      },
      timestamp: new Date().toISOString(),
    };

    return result;
  } catch (error) {
    console.error("Error broadcasting custom query:", error);
    return { error: (error as Error).message };
  }
}

export async function fetchVoteHistory(): Promise<VoteResult[] | { error: string }> {
  try {
    console.log("Starting fetchVoteHistory...");
    const voteSessions = await prisma.voteSession.findMany({
      orderBy: { timestamp: "desc" },
      take: 10,
      include: {
        validatorResponses: {
          select: {
            id: true,
            validatorId: true,
            vote: true,
            rationale: true,
            validator: {
              select: {
                provider: true,
                profileName: true,
              },
            },
          },
        },
      },
    });

    console.log("Fetched vote sessions:", voteSessions);

    if (!voteSessions || voteSessions.length === 0) {
      console.log("No vote sessions found in database");
      return [];
    }

    const voteHistory: VoteResult[] = voteSessions.map((session) => {
      console.log(`Mapping session ID: ${session.id}`);
      return {
        id: session.id,
        isConsensusReached: session.isConsensusReached,
        consensusValue: session.consensusValue,
        queryText: session.queryText,
        validatorResponses: session.validatorResponses.map((response) => ({
          id: response.validatorId,
          provider: response.validator.provider,
          profileName: response.validator.profileName,
          vote: response.vote as "YES" | "NO" | "ERROR",
          rationale: response.rationale || "No rationale provided",
        })),
        votingResult: {
          yes: session.votesYes,
          no: session.votesNo,
          notVoted: session.notVoted,
        },
        timestamp: session.timestamp.toISOString(),
      };
    });

    console.log("Returning vote history:", voteHistory);
    return voteHistory;
  } catch (error) {
    console.error("Error fetching vote history:", error);
    return { error: (error as Error).message };
  }
}