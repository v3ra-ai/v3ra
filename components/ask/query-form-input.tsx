import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";

interface QueryFormInputProps {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
  placeholderText: string;
  handleSubmit: () => void;
  isSubmitting: boolean;
  payWithWallet: boolean;
  queriesUnpaid: number;
  queriesCostTotal: number;
  hasPaid: boolean;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  isSubmitInteracted: boolean;
  setIsSubmitInteracted: Dispatch<SetStateAction<boolean>>;
}

export function QueryFormInput({
  queryText,
  setQueryText,
  placeholderText,
  handleSubmit,
  isSubmitting,
  queriesUnpaid,
  hasPaid,
  isSubmitInteracted,
  setIsSubmitInteracted,
}: QueryFormInputProps) {
  return (
    <>
      <div className="mb-2">
        <textarea
          className={`w-full p-4 border rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 text-lg ${
            isSubmitInteracted && !queryText.trim() ? "border-red-400" : "border-gray-200"
          }`}
          placeholder={placeholderText}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-end">
        <Button
          className={`bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-full px-8 py-2 cursor-pointer ${
            isSubmitInteracted && queriesUnpaid > 0 ? "ring-2 ring-red-400" : ""
          }`}
          onClick={handleSubmit}
          disabled={isSubmitting || (queriesUnpaid > 0 && !hasPaid)}
          onMouseEnter={() => queriesUnpaid > 0 && setIsSubmitInteracted(true)}
          onMouseLeave={() => setIsSubmitInteracted(false)}
          onMouseDown={() => queriesUnpaid > 0 && setIsSubmitInteracted(true)}
          onMouseUp={() => setIsSubmitInteracted(false)}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </>
  );
}