import { ParsedModelResponse } from "./responseParser";
import { AIValidationResponse } from "./types";
import type { QueryMode } from "@/lib/types";

/*
 * A lightweight, pluggable interpreter which transforms the generic
 * ParsedModelResponse (derived from the LLM's JSON) into an
 * AIValidationResponse that the rest of the system expects.
 * Each mode encapsulates its own business rules so providers stay thin.
 */

export interface ModeAdapter {
  /** Public identifier used by generatePrompt() etc. */
  type: QueryMode;
  /**
   * Convert the generic parsed JSON into a normalised AIValidationResponse.
   * - confidence **MUST** be 0‒1
   * - vote **MUST** be boolean (for modes that care)
   */
  interpret(parsed: ParsedModelResponse): Pick<AIValidationResponse, "vote" | "confidence" | "rationale">;
}

const percentToUnit = (pct: number) => Math.max(0, Math.min(100, pct)) / 100;

export const FactCheckAdapter: ModeAdapter = {
  type: "fact-check",
  interpret: (p) => ({
    vote: p.vote,
    confidence: percentToUnit(p.confidence),
    rationale: p.rationale,
  }),
};

export function getAdapter(_mode?: QueryMode): ModeAdapter {
  // Always return FactCheckAdapter since it's the only mode now
  return FactCheckAdapter;
}
