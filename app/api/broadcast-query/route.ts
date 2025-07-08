import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastAdaptiveQuery } from "@/app/actions-adaptive";
import { rateLimitStrict } from "@/lib/middleware/rate-limit";

const broadcastQuerySchema = z.object({
  queryText: z.string().min(1, "Query text is required"),
  queryMode: z.enum(["fact-check"]).optional(),
  queriesRequested: z.number().int().min(1).optional(),
  selectedLLMIds: z.array(z.string()).optional(),
  philosophyMode: z.boolean().optional(),
});

export const POST = rateLimitStrict(async (request: NextRequest) => {
  try {
    const body = await request.json();

    const parsedBody = broadcastQuerySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const { queryText, queryMode, queriesRequested, selectedLLMIds, philosophyMode } = parsedBody.data;

    if (selectedLLMIds && selectedLLMIds.length > 0 && queriesRequested && queriesRequested > selectedLLMIds.length) {
      return NextResponse.json(
        { error: `Cannot query ${queriesRequested} AIs when only ${selectedLLMIds.length} are selected.` },
        { status: 400 }
      );
    }

    const result = await broadcastAdaptiveQuery(queryText, queryMode, queriesRequested, selectedLLMIds, philosophyMode);


    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Convert AdaptiveResponse to VoteResult format for frontend compatibility
    const voteResult = {
      id: result.id,
      isConsensusReached: result.consensus.confidence > 0.6,
      consensusValue: result.consensus.value || null,
      queryText: result.query,
      validatorResponses: result.validatorResponses,
      votingResult: {
        yes: result.validatorResponses.filter(r => r.vote === "YES").length,
        no: result.validatorResponses.filter(r => r.vote === "NO").length,
        notVoted: result.validatorResponses.filter(r => r.vote === "ERROR").length,
        uncertain: result.validatorResponses.filter(r => r.vote === "UNKNOWN").length,
      },
      timestamp: result.metadata.timestamp,
      // Include adaptive data in a custom field
      _adaptive: {
        classification: result.classification,
        consensus: result.consensus,
        metadata: result.metadata,
      }
    };

    return NextResponse.json(voteResult, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});