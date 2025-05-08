import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryStore } from "@/store/query-store";

interface QueryFormModeSelectorProps {
  queryMode: "factCheck" | "predict" | "create" | "shop";
}

export function QueryFormModeSelector({ queryMode }: QueryFormModeSelectorProps) {
  const { setQueryMode } = useQueryStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="text-zinc-900 dark:text-white  bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-600 min-w-[100px] cursor-pointer">
          {queryMode === "predict"
            ? "Predict"
            : queryMode === "create"
              ? "Create"
              : queryMode === "shop"
                ? "Shop"
                : "Fact Check"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black border-gray-300">
      <DropdownMenuItem
          className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
          onSelect={() => setQueryMode("factCheck")}
        >
          Fact Check
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
          onSelect={() => setQueryMode("predict")}
        >
          Predict
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
          onSelect={() => setQueryMode("shop")}
        >
          Shop
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
          onSelect={() => setQueryMode("create")}
        >
          Create
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}