import { Button } from "@/components/ui/button";
import { QUERY_COST, QUERY_COST_FIXED_DECIMALS } from "@/lib/constants";

interface QueryFormInputProps {
  question: string;
  setQuestion: (value: string) => void;
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
  setIsSubmitInteracted: (value: boolean) => void;
}

export function QueryFormInput({
  question,
  setQuestion,
  placeholderText,
  handleSubmit,
  isSubmitting,
  payWithWallet,
  queriesUnpaid,
  queriesCostTotal,
  hasPaid,
  userCreditsTotal,
  userFreeCredits,
  userPaidCredits,
  isSubmitInteracted,
  setIsSubmitInteracted,
}: QueryFormInputProps) {
  const displayUnpaid = Math.max(0, queriesUnpaid); // Never show negative queriesUnpaid

  return (
    <>
      <div className="mb-2">
        <textarea
          className={`w-full p-4 border rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 text-lg ${
            isSubmitInteracted && !question.trim() ? "border-red-400" : "border-gray-200"
          }`}
          placeholder={placeholderText}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-end">
        {/* <div className="flex flex-col text-sm text-gray-600 dark:text-gray-400">
          <span>Free Credits: {userFreeCredits}</span>
          <span>Paid Credits: {userPaidCredits}</span>
          <span>Total Credits: {userCreditsTotal}</span>
          {displayUnpaid > 0 && <span>Unpaid Queries: {displayUnpaid} ({queriesCostTotal} credits)</span>}
        </div> */}
        <Button
          className={`bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-full px-8 py-2 cursor-pointer ${
            isSubmitInteracted && queriesUnpaid > 0 ? "ring-2 ring-red-400" : ""
          }`}
          onClick={handleSubmit}
          disabled={isSubmitting || (queriesUnpaid > 0 && !hasPaid)} // Disable if submitting or unpaid queries exist without payment
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