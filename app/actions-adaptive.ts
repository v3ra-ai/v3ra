"use server";

import type {
  VoteValidatorResponse,
  QueryMode,
} from "@/lib/types";
import { AdaptiveResponse, QueryCategory } from "@/lib/types/query-classifier";
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
import { PredictionTracker } from "@/lib/services/prediction-tracker";
import { getPromptForCategory } from "@/lib/validators/prompts/adaptive-prompts";

type DbValidatorWithKeys = Validator & { ValidatorKey: ValidatorKey[] };

export async function broadcastAdaptiveQuery(
  query: string,
  queryMode: QueryMode = "fact-check",
  queriesRequested?: number,
  selectedLLMIds?: string[],
  philosophyMode?: boolean
): Promise<AdaptiveResponse | { error: string }> {
  const startTime = Date.now();
  
  try {
    // Step 1: Classify the query
    const classifier = new QueryClassifier();
    let classification = classifier.classify(query);
    
    // Override classification if philosophy mode is enabled
    if (philosophyMode) {
      classification = {
        category: QueryCategory.IDENTITY_PHILOSOPHY,
        confidence: 1.0,
        reasoning: "User selected philosophical exploration mode"
      };
    }
    
    console.log("[Adaptive] Query classified as:", classification);

    // Step 2: Get validators
    let dbValidators: DbValidatorWithKeys[] =
      await validatorService.getActiveDbValidators();

    console.log("[Adaptive] Found validators:", dbValidators.length);
    console.log("[Adaptive] Selected LLM IDs:", selectedLLMIds);

    if (!dbValidators || dbValidators.length === 0) {
      return { error: "No active validators found" };
    }

    // Filter by selectedLLMIds if provided
    if (selectedLLMIds && selectedLLMIds.length > 0) {
      console.log("[Adaptive] Filtering validators by IDs...");
      const filtered = dbValidators.filter((v) => selectedLLMIds.includes(v.id));
      console.log("[Adaptive] After filtering:", filtered.length, "validators");
      dbValidators = filtered;
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
    await prisma.voteSession.create({
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
    console.log("[Adaptive] Using prompts for category:", classification.category, {
      systemMessage: promptConfig.systemMessage.slice(0, 100) + "...",
      userMessagePreview: promptConfig.userMessageTemplate(query).slice(0, 50) + "..."
    });

    // Step 5: Query validators with adaptive prompts
    const validatorResponsePromises: Promise<VoteValidatorResponse>[] = [];

    for (const dbValidator of selectedValidators) {
      console.log("[Adaptive] Processing validator:", dbValidator.profileName, dbValidator.provider);
      let validator;

      try {
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

          // Determine vote from rationale for adaptive responses
          let vote: "YES" | "NO" | "UNKNOWN" | "ERROR" = "NO";
          const upperRationale = response.rationale.toUpperCase();
          
          if (response.vote === true || upperRationale.startsWith("YES")) {
            vote = "YES";
          } else if (upperRationale.startsWith("UNKNOWN")) {
            vote = "UNKNOWN";
          } else if (upperRationale.startsWith("NO")) {
            vote = "NO";
          }
          
          return {
            id: dbValidator.id,
            provider: dbValidator.provider,
            profileName: dbValidator.profileName,
            vote,
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
      } catch (error) {
        console.error("[Adaptive] Error creating validator:", error);
        // Add error response for this validator
        validatorResponsePromises.push(
          Promise.resolve({
            id: dbValidator.id,
            provider: dbValidator.provider,
            profileName: dbValidator.profileName,
            vote: "ERROR" as const,
            rationale: `Failed to create validator: ${error instanceof Error ? error.message : 'Unknown error'}`,
          } as VoteValidatorResponse)
        );
      }
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
    
    // Add session ID to response
    adaptiveResponse.id = sessionId;

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

    // Save prediction data if this is a prediction query
    const predictionTracker = new PredictionTracker();
    await predictionTracker.savePrediction(adaptiveResponse, sessionId);

    return adaptiveResponse;
  } catch (error) {
    console.error("[Adaptive] Error in broadcastAdaptiveQuery:", error);
    return { error: (error as Error).message };
  }
}

