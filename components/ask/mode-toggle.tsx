import { useQueryStore } from "@/store/query-store";

interface ModeToggleProps {
  viewMode: "viewStandard" | "viewExpert";
}

export default function ModeToggle({ viewMode }: ModeToggleProps) {
  const { setViewMode } = useQueryStore();

  return (
    <div className="container mx-auto px-4 flex justify-center mt-1 mb-2">
      <div className="inline-flex items-center bg-gray-100 rounded-full p-1 dark:bg-gray-700">
        <button
          onClick={() => setViewMode("viewStandard")}
          className={`px-4 py-1 rounded-full text-sm cursor-pointer ${
            viewMode === "viewStandard"
              ? "bg-white shadow-sm text-gray-500 dark:bg-gray-600 dark:text-gray-200"
              : "text-gray-500 dark:text-gray-300"
          }`}
        >
          Standard
        </button>
        <button
          onClick={() => setViewMode("viewExpert")}
          className={`px-4 py-1 rounded-full text-sm cursor-pointer ${
            viewMode === "viewExpert"
              ? "bg-white shadow-sm text-gray-500 dark:bg-gray-600 dark:text-gray-200"
              : "text-gray-500 dark:text-gray-300"
          }`}
        >
          Expert
        </button>
      </div>
    </div>
  );
}