import { QueryFormModeSelector } from "@/components/ask/query-form-mode-selector";
import { QueryFormAISlider } from "@/components/ask/query-form-ai-slider";
import { QueryFormInput } from "@/components/ask/query-form-input";

interface QueryFormProps {
  question: string;
  setQuestion: (value: string) => void;
  placeholderText: string;
  queryMode: "factCheck" | "predict" | "create" | "shop";
  userAiQueryAmountRequested: number;
  handleQueryAmountChange: (newAmount: number) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  payWithWallet: boolean;
  queriesNeeded: number;
  hasPaid: boolean;
  totalQueries: number;
  isSubmitInteracted: boolean;
  setIsSubmitInteracted: (value: boolean) => void;
}

export default function QueryForm({
  question,
  setQuestion,
  placeholderText,
  queryMode,
  userAiQueryAmountRequested,
  handleQueryAmountChange,
  handleSubmit,
  isSubmitting,
  payWithWallet,
  queriesNeeded,
  hasPaid,
  totalQueries,
  isSubmitInteracted,
  setIsSubmitInteracted,
}: QueryFormProps) {
  const allowedAmountQueries = 20;

  return (
    <div>
      <QueryFormInput
        question={question}
        setQuestion={setQuestion}
        placeholderText={placeholderText}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        payWithWallet={payWithWallet}
        queriesNeeded={queriesNeeded}
        hasPaid={hasPaid}
        totalQueries={totalQueries}
        isSubmitInteracted={isSubmitInteracted}
        setIsSubmitInteracted={setIsSubmitInteracted}
      />
      <div className="flex items-center gap-0">
        <QueryFormModeSelector queryMode={queryMode} />
        <QueryFormAISlider
          userAiQueryAmountRequested={userAiQueryAmountRequested}
          handleQueryAmountChange={handleQueryAmountChange}
          allowedAmountQueries={allowedAmountQueries}
        />
      </div>
    </div>
  );
}