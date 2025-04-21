import { useQueryStore } from "@/store/query-store";
import { AppWindowMac, FlaskConical } from "lucide-react";

type Props = {
  viewMode: "viewStandard" | "viewExpert";
  variant?: "buttons" | "icons";
};

export default function ModeToggle({ viewMode, variant = "buttons" }: Props) {
  const { setViewMode } = useQueryStore();

  if (variant === "icons") {
    return (
      <div className="container mx-auto px-2 flex justify-end ">
        <div className="flex rounded-full bg-zinc-200 dark:bg-zinc-700 p-1">
          <button
            onClick={() => setViewMode("viewStandard")}
            className={`p-2 rounded-full cursor-pointer ${
              viewMode === "viewStandard"
                ? "bg-teal-700 text-zinc-100"
                : "bg-transparent text-zinc-500 dark:text-zinc-400"
            }`}
            aria-label="Standard mode"
          >
            <AppWindowMac className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("viewExpert")}
            className={`p-2 rounded-full cursor-pointer ${
              viewMode === "viewExpert"
                ? "bg-teal-500 text-white"
                : "bg-transparent text-zinc-500 dark:text-zinc-400"
            }`}
            aria-label="Expert mode"
          >
            <FlaskConical className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 flex justify-center mt-1 mb-2">
      <div className="flex rounded-full bg-zinc-200 dark:bg-zinc-700 p-1">
        <button
          onClick={() => setViewMode("viewStandard")}
          className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
            viewMode === "viewStandard"
              ? "bg-teal-500 text-white"
              : "bg-transparent text-zinc-500 dark:text-zinc-400"
          }`}
          aria-label="Standard mode"
        >
          Standard
        </button>
        <button
          onClick={() => setViewMode("viewExpert")}
          className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer ${
            viewMode === "viewExpert"
              ? "bg-teal-500 text-white"
              : "bg-transparent text-zinc-500 dark:text-zinc-400"
          }`}
          aria-label="Expert mode"
        >
          Expert
        </button>
      </div>
    </div>
  );
}
