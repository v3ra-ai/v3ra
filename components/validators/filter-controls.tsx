import { Button } from "@/components/ui/button";

interface FilterControlsProps {
  isYesActive: boolean;
  isNoActive: boolean;
  isRecentActive: boolean;
  isAllActive: boolean;
  handleYesClick: () => void;
  handleNoClick: () => void;
  handleRecentClick: () => void;
  handleAllClick: () => void;
}

export default function FilterControls({
  isYesActive,
  isNoActive,
  isRecentActive,
  isAllActive,
  handleYesClick,
  handleNoClick,
  handleRecentClick,
  handleAllClick,
}: FilterControlsProps) {
  return (
    <div className="space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleYesClick}
        className="text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 cursor-pointer"
        aria-pressed={isYesActive}
      >
        {isYesActive && (
          <span className="inline-block w-2 h-2 bg-teal-500 mr-1"></span>
        )}
        Yes
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNoClick}
        className="text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 cursor-pointer"
        aria-pressed={isNoActive}
      >
        {isNoActive && (
          <span className="inline-block w-2 h-2 bg-teal-500 mr-1"></span>
        )}
        No
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRecentClick}
        className="text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 cursor-pointer"
        aria-pressed={isRecentActive}
      >
        {isRecentActive && (
          <span className="inline-block w-2 h-2 bg-teal-500 mr-1"></span>
        )}
        Recent
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleAllClick}
        className="text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 cursor-pointer"
        aria-pressed={isAllActive}
      >
        {isAllActive && (
          <span className="inline-block w-2 h-2 bg-teal-500 mr-1"></span>
        )}
        All
      </Button>
    </div>
  );
}