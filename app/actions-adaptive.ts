"use server";

import type {
  VoteResult,
  VoteValidatorResponse,
  QueryMode,
} from "@/lib/types";
import { AdaptiveResponse } from "@/lib/types/query-classifier";
import { prisma } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";
import { OpenAIValidator } from "@/lib/validators/providers/openai";
import { AnthropicValidator } from "@/lib/validators/providers/anthropic";
import { GrokValidator } from "@/lib/validators/providers/grok";
import { GeminiValidator } from "@/lib/validators/providers/gemini";
import { OpenRouterValidator } from "@/lib/validators/providers/openrouter";
import { HuggingFaceValidator } from "@/lib/validators/providers/huggingface";
import { validatorService } from "@/lib/services/validatorService";
import { Validator, ValidatorKey } from "@prisma/client";
import { QueryClassifier } from "@/lib/services/query-classifier";
import { AdaptiveResponseProcessor } from "@/lib/services/adaptive-response-processor";
import { getPromptForCategory } from "@/lib/validators/prompts/adaptive-prompts";

type DbValidatorWithKeys = Validator & { ValidatorKey: ValidatorKey[] };

export async function broadcastAdaptiveQuery(
  query: string,
  queryMode: QueryMode = "fact-check",
  queriesRequested?: number,
  selectedLLMIds?: string[]
): Promise<AdaptiveResponse | { error: string }> {
  const startTime = Date.now();
  
  try {
    // Step 1: Classify the query
    const classifier = new QueryClassifier();
    const classification = classifier.classify(query);
    console.log("[Adaptive] Query classified as:", classification);

    // Step 2: Get validators
    let dbValidators: DbValidatorWithKeys[] =
      await validatorService.getActiveDbValidators();

    if (!dbValidators || dbValidators.length === 0) {
      return { error: "No active validators found" };
    }

    // Filter by selectedLLMIds if provided
    if (selectedLLMIds && selectedLLMIds.length > 0) {
      dbValidators = dbValidators.filter((v) => selectedLLMIds.includes(v.id));
      if (dbValidators.length === 0) {
        return { error: "No matching validators found for the selected LLMs" };
      }
    }

    // Apply queriesRequested limit
    const selectedValidators = queriesRequested
      ? dbValidators.slice(0, Math.min(queriesRequested, dbValidators.length))
      : dbValidators;

    if (selectedValidators.length === 0) {
      return { error: "No validators available after filtering" };
    }

    const sessionId = uuidv4();

    // Step 3: Create vote session
    const voteSession = await prisma.voteSession.create({
      data: {
        id: sessionId,
        queryText: query,
        isConsensusReached: false,
        timestamp: new Date(),
        votesYes: 0,
        votesNo: 0,
        notVoted: 0,
        updatedAt: new Date(),
      },
    });

    // Step 4: Get the appropriate prompt configuration
    const promptConfig = getPromptForCategory(classification.category);

    // Step 5: Query validators with adaptive prompts
    const validatorResponsePromises: Promise<VoteValidatorResponse>[] = [];

    for (const dbValidator of selectedValidators) {
      let validator;

      // Create validator instances (same as original)
      if (dbValidator.provider === "OpenAI") {
        const modelName =
          dbValidator.modelName === "gpt-40" ? "gpt-4o" : dbValidator.modelName;
        validator = new OpenAIValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName,
          keyId: dbValidator.ValidatorKey[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else if (dbValidator.provider === "Anthropic") {
        validator = new AnthropicValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          keyId: dbValidator.ValidatorKey[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else if (dbValidator.provider === "Grok") {
        validator = new GrokValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          keyId: dbValidator.ValidatorKey[0]?.apiKeyId,
          active: dbValidator.active,
        });
      } else if (dbValidator.provider === "Google") {
        validator = new GeminiValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          keyId: dbValidator.ValidatorKey[0]?.apiKeyId,
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
      } else if (dbValidator.provider === "HuggingFace") {
        validator = new HuggingFaceValidator({
          id: dbValidator.id,
          name: dbValidator.profileName,
          modelName: dbValidator.modelName,
          active: dbValidator.active,
          queryMode,
        });
      } else {
        continue;
      }

      if (
        dbValidator.provider !== "OpenRouter" &&
        dbValidator.provider !== "HuggingFace" &&
        !dbValidator.ValidatorKey[0]?.apiKeyId
      ) {
        continue;
      }

      // Use adaptive validation with category-specific prompts
      const validationPromise = validator
        .validate({
          statement: query,
          queryMode,
          systemMessage: promptConfig.systemMessage,
          userMessage: promptConfig.userMessageTemplate(query),
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

    // Step 6: Process responses adaptively
    const processor = new AdaptiveResponseProcessor();
    const processingTime = Date.now() - startTime;
    
    const adaptiveResponse = processor.processResponses(
      query,
      classification,
      validatorResponses,
      processingTime
    );

    // Update session with consensus info
    const consensus = adaptiveResponse.consensus;
    await prisma.voteSession.update({
      where: { id: sessionId },
      data: {
        isConsensusReached: consensus.confidence > 0.6,
        consensusValue: consensus.value,
        votesYes: validatorResponses.filter(r => r.vote === "YES").length,
        votesNo: validatorResponses.filter(r => r.vote === "NO").length,
        notVoted: validatorResponses.filter(r => r.vote === "ERROR").length,
        updatedAt: new Date(),
      },
    });

    return adaptiveResponse;
  } catch (error) {
    console.error("[Adaptive] Error in broadcastAdaptiveQuery:", error);
    return { error: (error as Error).message };
  }
}

