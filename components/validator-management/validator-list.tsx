"use client";

import { useValidatorManagementStore } from "@/store/validator-management-store";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import ValidatorTile from "./validator-tile";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";

interface ValidatorListProps {
  initial: Array<Record<string, unknown>>;
  onDone?: () => void; // optional callback when user presses Done
}

export default function ValidatorList({ initial, onDone }: ValidatorListProps) {
  const {
    validators,
    initValidators,
    selectedIds,
    selectAll,
    clearSelection,
  } = useValidatorManagementStore();

  // Initialize store on mount
  useEffect(() => {
    // Cast is handled in the store implementation
    initValidators(initial);
  }, [initial, initValidators]);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("selected"); // selected | name
  
  // Debounce the search value
  const debouncedSearch = useDebouncedValue(search, 300);

  const displayed = useMemo(() => {
    const list = validators.filter((v) =>
      v.profileName.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    // Create a sorted copy based on the sort criteria
    const sortedList = [...list];
    if (sort === "name") {
      sortedList.sort((a, b) => a.profileName.localeCompare(b.profileName));
    } else {
      sortedList.sort((a, b) => {
        const aSel = selectedIds.includes(a.id) ? -1 : 1;
        const bSel = selectedIds.includes(b.id) ? -1 : 1;
        if (aSel !== bSel) return aSel - bSel;
        return a.profileName.localeCompare(b.profileName);
      });
    }
    return sortedList;
  }, [validators, debouncedSearch, sort, selectedIds]);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search validators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Select value={sort} onValueChange={(v) => setSort(v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selected">Selected Top</SelectItem>
              <SelectItem value="name">A → Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] py-2 pr-1">
        {displayed.map((v) => (
          <ValidatorTile key={v.id} validator={v} />
        ))}
      </div>

      {/* Done button */}
      {onDone && (
        <Button className="mt-2 w-full" onClick={onDone}>
          Done
          <CheckIcon className="size-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
