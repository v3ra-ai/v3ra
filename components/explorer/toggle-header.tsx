"use client";

interface ToggleHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ToggleHeader({ isOpen, onToggle }: ToggleHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 mb-2"
    >
      <span className="mr-1">{isOpen ? "Hide" : "Show"} validator query</span>
      <svg
        className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
}