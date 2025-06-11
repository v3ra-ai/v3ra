"use server";

import type {
  VoteResult,
  VoteValidatorResponse,
  QueryMode,
  Favorite,
} from "@/lib/types";
import { prisma } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";
import { OpenAIValidator } from "@/lib/validators/providers/openai";
import { AnthropicValidator } from "@/lib/validators/providers/anthropic";
import { GrokValidator } from "@/lib/validators/providers/grok";
import { GeminiValidator } from "@/lib/validators/providers/gemini";
import { OpenRouterValidator } from "@/lib/validators/providers/openrouter";
import { validatorService } from "@/lib/services/validatorService";
import { Validator, ValidatorKey } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase-client";

// Log to confirm file is loaded
console.log("[actions] File loaded");

type DbValidatorWithKeys = Validator & { apiKeys: ValidatorKey[] };

export async function broadcastCustomQuery(
  query: string,
  queryMode: QueryMode = "fact-check",
  queriesRequested?: number,
  selectedLLMIds?: string[]
): Promise<VoteResult | { error: string }> {
  try {
    console.log("[actions] Processing custom query:", {
      query,
      queryMode,
      queriesRequested,
      selectedLLMIds: selectedLLMIds || "none",
    });

    let dbValidators: DbValidatorWithKeys[] =
      await validatorService.getActiveDbValidators();

    if (!dbValidators || dbValidators.length === 0) {
      console.warn("[actions] No active validators found in the database");
      return { error: "No active validators found" };
    }

    // Filter by selectedLLMIds if provided
    if (selectedLLMIds && selectedLLMIds.length > 0) {
      dbValidators = dbValidators.filter((v) => selectedLLMIds.includes(v.id));
      console.log("[actions] Filtered validators by selectedLLMIds:", {
        selectedCount: dbValidators.length,
        requestedIds: selectedLLMIds,
      });

      if (dbValidators.length === 0) {
        console.warn("[actions] No validators match the provided selectedLLMIds");
        return { error: "No matching validators found for the selected LLMs" };
      }
    }

    // Apply queriesRequested limit
    const selectedValidators = queriesRequested
      ? dbValidators.slice(0, Math.min(queriesRequested, dbValidators.length))
      : dbValidators;

    if (selectedValidators.length === 0) {
      console.warn("[actions] No validators selected after filtering");
      return { error: "No validators available after filtering" };
    }

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
      } else if (dbValidator.provider === "OpenRouter") {
        validator = new OpenRouterValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          active: dbValidator.active,
          queryMode,
        });
      } else {
        console.warn(
          `[actions] Validator provider ${dbValidator.provider} not supported, skipping`
        );
        continue;
      }

      if (
        dbValidator.provider !== "OpenRouter" &&
        !dbValidator.apiKeys[0]?.apiKeyId
      ) {
        console.warn(
          `[actions] No API key for validator ${dbValidator.provider} (${dbValidator.profileName}), skipping`
        );
        continue;
      }

      const validationPromise = validator
        .validate({
          statement: query,
          queryMode,
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

    if (queriesRequested && validatorResponses.length < queriesRequested) {
      console.warn(
        `[actions] Expected ${queriesRequested} responses, received ${validatorResponses.length}`
      );
    }

    const yesVotes = validatorResponses.filter((r) => r.vote === "YES").length;
    const noVotes = validatorResponses.filter((r) => r.vote === "NO").length;
    const notVoted = validatorResponses.filter(
      (r) => r.vote === "ERROR"
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

export async function toggleFavorite(
  voteSessionId: string
): Promise<{ success: boolean; message: string; favorite?: Favorite }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[actions] User not authenticated:", authError?.message);
      return { success: false, message: "User not authenticated" };
    }

    // Check if favorite already exists
    const { data: existingFavorite, error: fetchError } = await supabase
      .from("Favorite")
      .select("*")
      .eq("user_id", user.id)
      .eq("vote_session_id", voteSessionId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[actions] Error checking favorite:", fetchError);
      return { success: false, message: "Error checking favorite" };
    }

    if (existingFavorite) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from("Favorite")
        .delete()
        .eq("id", existingFavorite.id);

      if (deleteError) {
        console.error("[actions] Error removing favorite:", deleteError);
        return { success: false, message: "Error removing favorite" };
      }

      return { success: true, message: "Removed from favorites" };
    } else {
      // Add favorite, explicitly setting id
      const newId = uuidv4();
      const { data: newFavorite, error: insertError } = await supabase
        .from("Favorite")
        .insert({
          id: newId,
          user_id: user.id,
          vote_session_id: voteSessionId,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[actions] Error adding favorite:", insertError);
        return { success: false, message: "Error adding favorite" };
      }

      return {
        success: true,
        message: "Added to favorites",
        favorite: newFavorite as Favorite,
      };
    }
  } catch (error) {
    const typedError = error as Error;
    console.error("[actions] Error toggling favorite:", typedError);
    return { success: false, message: typedError.message };
  }
}

export async function fetchUserFavorites(): Promise<
  Favorite[] | { error: string }
> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Don't log authentication errors as they're expected for non-logged-in users
      return { error: "User not authenticated" };
    }

    const { data: favorites, error: fetchError } = await supabase
      .from("Favorite")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("[actions] Error fetching favorites:", fetchError);
      return { error: "Error fetching favorites" };
    }

    return favorites as Favorite[];
  } catch (error) {
    const typedError = error as Error;
    console.error("[actions] Error fetching favorites:", typedError);
    return { error: typedError.message };
  }
}