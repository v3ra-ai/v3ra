"use client";

interface SubmitButtonProps {
  isSubmitting: boolean;
  query: string;
}

export function SubmitButton({
  isSubmitting,
  query,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting || !query.trim()}
      className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center justify-center ${
        isSubmitting || !query.trim()
          ? "bg-silver-400 cursor-not-allowed text-gray-600 dark:text-gray-400"
          : "bg-blue-600 hover:bg-purple-700"
      }`}
    >
      {isSubmitting ? (
        <>
          <span className="inline-block animate-spin mr-2">⏳</span>
          Broadcasting...
        </>
      ) : (
        "Ask Question"
      )}
    </button>
  );
}
