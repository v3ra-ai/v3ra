import { QueryFormSimplified } from "@/components/ask/query/query-form-simplified";
import { Dispatch, SetStateAction } from "react";
import { QueryMode } from "@/lib/types";

interface QueryFormProps {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
  placeholderText: string;
  queryMode: QueryMode;
  queriesRequested: number;
  userFreeCredits: number;
  userPaidCredits: number;
  userCreditsTotal: number;
  queriesUnpaid: number;
  queriesCostTotal: number;
  handleSubmit: () => void;
  isSubmitting: boolean;
  isSubmitInteracted: boolean;
  setIsSubmitInteracted: Dispatch<SetStateAction<boolean>>;
}

export function QueryForm({
  queryText,
  setQueryText,
  placeholderText,
  queryMode: _queryMode,
  queriesRequested: _queriesRequested,
  userFreeCredits: _userFreeCredits,
  userPaidCredits: _userPaidCredits,
  userCreditsTotal,
  queriesUnpaid: _queriesUnpaid,
  queriesCostTotal,
  handleSubmit,
  isSubmitting,
  isSubmitInteracted: _isSubmitInteracted,
  setIsSubmitInteracted: _setIsSubmitInteracted,
}: QueryFormProps) {
  return (
    <QueryFormSimplified
      queryText={queryText}
      setQueryText={setQueryText}
      placeholderText={placeholderText}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      queriesCostTotal={queriesCostTotal}
      userCreditsTotal={userCreditsTotal}
    />
  );
}