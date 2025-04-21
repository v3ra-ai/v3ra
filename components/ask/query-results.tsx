import { useEffect } from "react";
import { useQueryStore } from "@/store/query-store";
import ConsensusStatus from "@/components/ask/consensus-status";
import AskResultsStandard from "@/components/ask/ask-results-standard";

export default function QueryResults() {
  const { viewMode, setViewMode } = useQueryStore();

  // Set default viewMode to viewStandard on mount
  useEffect(() => {
    setViewMode("viewStandard");
  }, [setViewMode]);

  return viewMode === "viewStandard" ? <AskResultsStandard /> : <ConsensusStatus />;
}