import { QueryFormInput } from "@/components/ask/query/query-form-input";
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
  queryMode,
  queriesRequested,
  userFreeCredits,
  userPaidCredits,
  userCreditsTotal,
  queriesUnpaid,
  queriesCostTotal,
  handleSubmit,
  isSubmitting,
  isSubmitInteracted,
  setIsSubmitInteracted,
}: QueryFormProps) {
  return (
    <QueryFormInput
      queryText={queryText}
      setQueryText={setQueryText}
      placeholderText={placeholderText}
      queryMode={queryMode}
      queriesRequested={queriesRequested}
      userFreeCredits={userFreeCredits}
      userPaidCredits={userPaidCredits}
      userCreditsTotal={userCreditsTotal}
      queriesUnpaid={queriesUnpaid}
      queriesCostTotal={queriesCostTotal}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isSubmitInteracted={isSubmitInteracted}
      setIsSubmitInteracted={setIsSubmitInteracted}
    />
  );
}