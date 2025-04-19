import ConsensusStatus from "@/components/ask/consensus-status";
import AskResultsStandard from "@/components/ask/ask-results-standard";

interface QueryResultsProps {
  viewMode: "viewStandard" | "viewExpert";
}

export default function QueryResults({ viewMode }: QueryResultsProps) {
  return (
    <div className="mt-8">
      {viewMode === "viewExpert" ? <ConsensusStatus /> : <AskResultsStandard />}
    </div>
  );
}