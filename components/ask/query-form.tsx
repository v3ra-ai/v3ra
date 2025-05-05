import { QueryFormInput } from "@/components/ask/query-form-input";
import { Dispatch, SetStateAction } from "react";
import { QueryMode } from "@/lib/types";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";

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
  handleQueryAmountChange: (newAmount: number) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  payWithWallet: boolean;
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
  handleQueryAmountChange,
  handleSubmit,
  isSubmitting,
  payWithWallet,
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
      handleQueryAmountChange={handleQueryAmountChange}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      payWithWallet={payWithWallet}
      isSubmitInteracted={isSubmitInteracted}
      setIsSubmitInteracted={setIsSubmitInteracted}
      allowedAmountQueries={ALLOWED_AMOUNT_QUERIES}
    />
  );
}