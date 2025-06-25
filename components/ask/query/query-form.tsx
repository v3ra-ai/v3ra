import { QueryFormInput } from "@/components/ask/query/query-form-input";
import { Dispatch, SetStateAction } from "react";
import { QueryMode } from "@/lib/types";

interface QueryFormProps {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
  placeholderText: string;
  queryMode: QueryMode;
  queriesRequested: number;
  handleSubmit: () => void;
  isSubmitting: boolean;
  isSubmitInteracted: boolean;
}

export function QueryForm({
  queryText,
  setQueryText,
  placeholderText,
  queryMode,
  queriesRequested,
  handleSubmit,
  isSubmitting,
  isSubmitInteracted,
}: QueryFormProps) {
  return (
    <QueryFormInput
      queryText={queryText}
      setQueryText={setQueryText}
      placeholderText={placeholderText}
      queryMode={queryMode}
      queriesRequested={queriesRequested}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isSubmitInteracted={isSubmitInteracted}
    />
  );
}