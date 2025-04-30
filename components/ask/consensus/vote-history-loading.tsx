import { BeatLoader } from "react-spinners";

export default function VoteHistoryLoading() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 max-w-6xl mx-auto">
      <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
        Validator Vote History
      </h3>
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl h-24 flex items-center justify-center">
        <BeatLoader color="#14b8a6" />
      </div>
    </div>
  );
}
