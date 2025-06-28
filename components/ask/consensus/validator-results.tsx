"use client";

import { useVoteResult } from "@/hooks/useVoteResult";
import { VoteResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sanitizeValidatorResponse } from "@/utils/security-utils";
import { parseRationaleDetailed } from "@/lib/utils";
import { AskResultsValidatorSocialIcons } from "@/components/ask/results/ask-results-validator-social-icons";
import { AlertCircle } from "lucide-react";

const ValidatorResponseCard = ({
  response,
  queryId,
  queryText,
}: {
  response: VoteResult["validatorResponses"][number];
  queryId?: string;
  queryText?: string;
}) => {
  const sanitizedResponse = sanitizeValidatorResponse(response);
  return (
    <div className="bg-gradient-to-br from-zinc-900/80 via-black/80 to-zinc-950/80 backdrop-blur-xl rounded-xl p-5 border border-zinc-700/50 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,255,255,0.1)] group">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm text-cyan-400/80 font-medium">Provider:</span>
            <span className="text-sm text-zinc-300">{sanitizedResponse.provider}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-cyan-400/80 font-medium">Profile:</span>
            <span className="text-lg font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors">
              {sanitizedResponse.profileName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <AskResultsValidatorSocialIcons 
            response={sanitizedResponse} 
            queryId={queryId}
            queryText={queryText}
          />
          <div className="flex flex-col items-end">
            <span className="text-sm text-zinc-400 mb-1">Vote:</span>
            <span
            className={`
              px-4 py-2
              rounded-lg
              text-xl font-bold
              transition-all duration-300
              flex items-center gap-2
              ${
                sanitizedResponse.vote === "YES"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                  : sanitizedResponse.vote === "NO"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(251,113,133,0.3)]"
                    : sanitizedResponse.vote === "ERROR"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/50"
              }
            `}
          >
            {sanitizedResponse.vote === "ERROR" && <AlertCircle className="w-5 h-5" />}
            {sanitizedResponse.vote || "N/A"}
          </span>
          </div>
        </div>
      </div>
      {(() => {
  const { rationale, answer } = parseRationaleDetailed(sanitizedResponse.rationale);
  // Check for mismatch between displayed vote and answer in rationale
  let warning = null;
  if (answer && sanitizedResponse.vote && answer.toUpperCase() !== sanitizedResponse.vote.toUpperCase()) {
    warning = (
      <span className="text-xs text-yellow-600 dark:text-yellow-400 block mt-1">
        Warning: The answer in rationale (&quot;{answer}&quot;) does not match the displayed vote (&quot;{sanitizedResponse.vote}&quot;).
      </span>
    );
  }
  return (
    <>
      <div className={`mt-4 p-4 rounded-lg border ${
        sanitizedResponse.vote === "ERROR" 
          ? "bg-amber-900/20 border-amber-700/30" 
          : "bg-zinc-800/30 border-zinc-700/30"
      }`}>
        <span className={`text-sm font-medium block mb-2 ${
          sanitizedResponse.vote === "ERROR" 
            ? "text-amber-400/80" 
            : "text-cyan-400/80"
        }`}>
          {sanitizedResponse.vote === "ERROR" ? "Error Details:" : "Rationale:"}
        </span>
        <span className="text-sm text-zinc-300 block whitespace-pre-wrap leading-relaxed">
          {rationale.length > 600 ? `${rationale.slice(0, 600)}...` : rationale}
        </span>
      </div>
      {warning}
    </>
  );
})()}

    </div>
  );
};

export default function ValidatorResults() {
  const { voteResult } = useVoteResult();
  const validatorResponses = voteResult?.validatorResponses ?? [];
  const queryId = voteResult?.id;
  const queryText = voteResult?.queryText;

  return (
    <Card className="bg-gradient-to-b from-zinc-900/95 to-black/95 backdrop-blur-xl rounded-xl shadow-2xl px-6 py-6 w-full border border-zinc-700/30">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-2xl font-bold text-zinc-100 dark:text-zinc-50 flex items-center gap-2">
          <span className="text-cyan-400">A.I.</span> Responses
        </CardTitle>
        <div className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
          Analysis from multiple AI models
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {validatorResponses.length > 0 ? (
          <div className="space-y-4">
            {validatorResponses.map((response) => (
              <ValidatorResponseCard 
                key={response.id} 
                response={response} 
                queryId={queryId}
                queryText={queryText}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No validator responses available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
