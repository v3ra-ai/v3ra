
"use server";

import type { VoteResult, VoteValidatorResponse, QueryMode } from "../lib/types";
import { prisma } from "../lib/db/client";
import { v4 as uuidv4 } from "uuid";
import { OpenAIValidator } from "@/lib/validators/providers/openai";
import { AnthropicValidator } from "@/lib/validators/providers/anthropic";
import { GrokValidator } from "@/lib/validators/providers/grok";
import { GeminiValidator } from "@/lib/validators/providers/gemini";
import { validatorService } from "@/lib/services/validatorService";
import { Validator, ValidatorKey } from "@prisma/client";

// Log to confirm file is loaded
console.log("[actions] File loaded");

type DbValidatorWithKeys = Validator & { apiKeys: ValidatorKey[] };

export async function broadcastCustomQuery(
  query: string,
  queryMode: QueryMode = "factCheck",
  queriesRequested?: number // Number of validators to query
): Promise<VoteResult | { error: string }> {
  try {
    console.log("[actions] Processing custom query:", {
      query,
      queryMode,
      queriesRequested,
    });

    const dbValidators: DbValidatorWithKeys[] =
      await validatorService.getActiveDbValidators();

    if (!dbValidators || dbValidators.length === 0) {
      console.warn("[actions] No active validators found in the database");
      return { error: "No active validators found" };
    }

    // Filter out OpenRouterValidator before selection
    const validValidators = dbValidators.filter(
      (validator) => validator.provider !== "OpenRouter"
    );
    console.log(
      `[actions] Found ${dbValidators.length} active validators, ${validValidators.length} valid after filtering:`,
      validValidators.map((v) => `${v.provider} (${v.profileName})`)
    );

    // Limit validators to queriesRequested (if provided and less than available)
    const selectedValidators = queriesRequested
      ? validValidators.slice(0, Math.min(queriesRequested, validValidators.length))
      : validValidators;
    console.log(
      `[actions] Selected ${selectedValidators.length} validators for query:`,
      selectedValidators.map((v) => `${v.provider} (${v.profileName})`)
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

    for (const dbValidator of selectedValidators) {
      let validator;

      console.log(
        `[actions] Initializing validator: ${dbValidator.provider} (${dbValidator.profileName})`
      );

      if (dbValidator.provider === "OpenAI") {
        const modelName =
          dbValidator.modelName === "gpt-40" ? "gpt-4o" : dbValidator.modelName;
        validator = new OpenAIValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName,
          keyId: dbValidator.apiKeys[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else if (dbValidator.provider === "Anthropic") {
        validator = new AnthropicValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          keyId: dbValidator.apiKeys[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else if (dbValidator.provider === "Grok") {
        validator = new GrokValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          keyId: dbValidator.apiKeys[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else if (dbValidator.provider === "Google") {
        validator = new GeminiValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          keyId: dbValidator.apiKeys[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else {
        console.warn(
          `[actions] Validator provider ${dbValidator.provider} not supported, skipping`
        );
        continue;
      }

      // Validate API key availability
      if (!dbValidator.apiKeys[0]?.apiKeyId) {
        console.warn(
          `[actions] No API key for validator ${dbValidator.provider} (${dbValidator.profileName}), skipping`
        );
        continue;
      }

      console.log(
        "[actions] Validating with validator:",
        dbValidator.provider,
        "queryMode:",
        queryMode,
        "validatorId:",
        dbValidator.id
      );

      const validationPromise = validator
        .validate({
          statement: query,
          queryMode,
        })
        .then(async (response) => {
          console.log(
            `[actions] Validation response for ${dbValidator.provider} (${dbValidator.profileName}):`,
            { vote: response.vote, confidence: response.confidence }
          );
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
          console.error(
            `[actions] Error processing validator ${dbValidator.provider} (${dbValidator.profileName}):`,
            error
          );
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
      validatorResponsePromises
    );
    console.log(
      `[actions] Collected ${validatorResponses.length} validator responses:`,
      validatorResponses.map((r) => `${r.provider} (${r.profileName}): ${r.vote}`)
    );

    // Log if fewer responses than requested
    if (queriesRequested && validatorResponses.length < queriesRequested) {
      console.warn(
        `[actions] Expected ${queriesRequested} responses, received ${validatorResponses.length}`
      );
    }

    const yesVotes = validatorResponses.filter((r) => r.vote === "YES").length;
    const noVotes = validatorResponses.filter((r) => r.vote === "NO").length;
    const notVoted = validatorResponses.filter((r) => r.vote === "ERROR").length;

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

    console.log(
      `[actions] Query result: ${result.validatorResponses.length} responses`,
      { yesVotes, noVotes, notVoted, isConsensusReached, consensusValue }
    );
    return result;
  } catch (error) {
    console.error("[actions] Error broadcasting custom query:", error);
    return { error: (error as Error).message };
  }
}

export async function fetchVoteHistory(): Promise<
  VoteResult[] | { error: string }
> {
  try {
    console.log("[actions] Starting fetchVoteHistory...");
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

    console.log("[actions] Fetched vote sessions:", voteSessions);

    if (!voteSessions || voteSessions.length === 0) {
      console.log("[actions] No vote sessions found in database");
      return [];
    }

    const voteHistory: VoteResult[] = voteSessions.map((session) => {
      console.log(`[actions] Mapping session ID: ${session.id}`);
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

    console.log("[actions] Returning vote history:", voteHistory);
    return voteHistory;
  } catch (error) {
    console.error("[actions] Error fetching vote history:", error);
    return { error: (error as Error).message };
  }
}