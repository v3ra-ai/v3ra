import { useEffect } from "react";
import { useQueryStore, ViewMode } from "@/store/query-store";
import AskResultsStandard from "@/components/ask/ask-results-standard";
import AskResultsExpert from "@/components/ask/ask-results-expert";

type Props = {
  viewMode: ViewMode;
};

export default function QueryResults({ viewMode }: Props) {
  const { setViewMode } = useQueryStore();

  // Set default viewMode to viewStandard on mount
  useEffect(() => {
    setViewMode("viewStandard");
  }, [setViewMode]);

  return viewMode === "viewStandard" ? <AskResultsStandard /> : <AskResultsExpert />;
}