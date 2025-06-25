"use client";

interface QueryInputProps {
  query: string;
  setQuery: (value: string) => void;
}

export function QueryInput({
  query,
  setQuery,
}: QueryInputProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label
          htmlFor="custom-query"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Ask the validator network a yes/no question
        </label>
      </div>
      <textarea
        id="custom-query"
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        placeholder="Is artificial intelligence beneficial for society?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}