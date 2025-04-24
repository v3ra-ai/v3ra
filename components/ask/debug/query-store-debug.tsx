"use client";

import React from "react";
import { useQueryStore } from "@/store/query-store";

export default function QueryStoreDebugPanel() {
  const {
    userFreeCredits,
    userPaidCredits,
    userCreditsTotal,
    queriesRequested,
    queriesUnpaid,
    queriesCostEach,
    queriesCostTotal,
    userCreditConversion,
    queryMode,
    viewMode,
    voteHistory,
    lastVoteResult,
  } = useQueryStore();

  return (
    <div className="p-4 bg-gray-100 text-sm text-black rounded shadow max-w-2xl mx-auto my-8">
      <h2 className="text-lg font-bold mb-2">Query Store Diagnostics</h2>
      <ul className="space-y-1">
        <li><strong>User Free Credits:</strong> {userFreeCredits}</li>
        <li><strong>User Paid Credits:</strong> {userPaidCredits}</li>
        <li><strong>User Total Credits:</strong> {userCreditsTotal}</li>
        <li><strong>Queries Requested:</strong> {queriesRequested}</li>
        <li><strong>Queries Unpaid:</strong> {queriesUnpaid}</li>
        <li><strong>Cost per Query:</strong> {queriesCostEach}</li>
        <li><strong>Total Query Cost:</strong> {queriesCostTotal}</li>
        <li><strong>Credit Conversion Rate:</strong> {userCreditConversion}</li>
        <li><strong>Current Query Mode:</strong> {queryMode}</li>
        <li><strong>Current View Mode:</strong> {viewMode}</li>
        <li><strong>Vote History Count:</strong> {voteHistory.length}</li>
        <li><strong>Last Vote Result:</strong> {lastVoteResult ? JSON.stringify(lastVoteResult) : "None"}</li>
      </ul>
    </div>
  );
}
