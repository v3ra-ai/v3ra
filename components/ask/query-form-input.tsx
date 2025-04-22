import { Button } from "@/components/ui/button";

interface QueryFormInputProps {
  question: string;
  setQuestion: (value: string) => void;
  placeholderText: string;
  handleSubmit: () => void;
  isSubmitting: boolean;
  payWithWallet: boolean;
  queriesNeeded: number;
  hasPaid: boolean;
  totalQueries: number;
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
  queriesNeeded,
  hasPaid,
  totalQueries,
  isSubmitInteracted,
  setIsSubmitInteracted,
}: QueryFormInputProps) {
  return (
    <>
      <div className="mb-8">
        <textarea
          className={`w-full p-4 border rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 text-lg ${
            isSubmitInteracted && !question.trim() ? "border-red-400" : "border-gray-200"
          }`}
          placeholder={placeholderText}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0"></div>
        <Button
          className={`bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-full px-8 py-2 cursor-pointer ${
            isSubmitInteracted && totalQueries < 1 ? "ring-2 ring-red-400" : ""
          }`}
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            (payWithWallet && queriesNeeded > 0 && !hasPaid && totalQueries < 1)
          }
          onMouseEnter={() => totalQueries < 1 && setIsSubmitInteracted(true)}
          onMouseLeave={() => setIsSubmitInteracted(false)}
          onMouseDown={() => totalQueries < 1 && setIsSubmitInteracted(true)}
          onMouseUp={() => setIsSubmitInteracted(false)}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </>
  );
}