// components/ask/consensus/validator-results.tsx
"use client";

import { useVoteResult } from "@/hooks/useVoteResult";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ValidatorResults() {
  const { voteResult } = useVoteResult();
  const validatorResponses = voteResult?.validatorResponses || [];

  return (
    <Card className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 w-full">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-md font-medium text-gray-800 dark:text-zinc-200">
          Validator Results
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {validatorResponses.length > 0 ? (
          <div className="space-y-4">
            {validatorResponses.map((response, index) => (
              <div
                key={index}
                className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 dark:text-zinc-200">
                      {response.profileName} ({response.provider})
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {response.id}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium mt-2 sm:mt-0 ${
                      response.vote === "YES"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : response.vote === "NO"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {response.vote || "N/A"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {response.rationale || "No rationale provided"}
                </p>
              </div>
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