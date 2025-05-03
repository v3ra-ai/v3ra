import { QueryFormInput } from "@/components/ask/query-form-input";
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
  handleQueryAmountChange: (newAmount: number) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  payWithWallet: boolean;
  hasPaid: boolean;
  isSubmitInteracted: boolean;
  setIsSubmitInteracted: Dispatch<SetStateAction<boolean>>;
}

export default function QueryForm({
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
  hasPaid,
  isSubmitInteracted,
  setIsSubmitInteracted,
}: QueryFormProps) {
  const allowedAmountQueries = 20;

  return (
    <div>
      <QueryFormInput
        queryText={queryText}
        setQueryText={setQueryText}
        placeholderText={placeholderText}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        payWithWallet={payWithWallet}
        queriesUnpaid={queriesUnpaid}
        queriesCostTotal={queriesCostTotal}
        hasPaid={hasPaid}
        userCreditsTotal={userCreditsTotal}
        userFreeCredits={userFreeCredits}
        userPaidCredits={userPaidCredits}
        isSubmitInteracted={isSubmitInteracted}
        setIsSubmitInteracted={setIsSubmitInteracted}
        queryMode={queryMode}
        queriesRequested={queriesRequested}
        handleQueryAmountChange={handleQueryAmountChange}
        allowedAmountQueries={allowedAmountQueries}
      />
      {/* <div className="flex items-center gap-0">
        <QueryFormModeSelector queryMode={queryMode} />
        <QueryFormAISlider
          queriesRequested={queriesRequested}
          handleQueryAmountChange={handleQueryAmountChange}
          allowedAmountQueries={allowedAmountQueries}
        />
      </div> */}
    </div>
  );
}