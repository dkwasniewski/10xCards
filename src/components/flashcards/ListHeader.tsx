// src/components/flashcards/ListHeader.tsx

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface ListHeaderProps {
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * ListHeader displays the header row with "Select All" checkbox
 */
export function ListHeader({ isAllSelected, isIndeterminate, onSelectAll, disabled = false }: ListHeaderProps) {
  return (
    <div className="flex items-center gap-4 border-b pb-3 mb-4">
      <div className="flex items-center">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={(checked) => onSelectAll(checked === true)}
          disabled={disabled}
          aria-label="Select all flashcards on this page"
          className={isIndeterminate && !isAllSelected ? "data-[state=checked]:bg-primary" : ""}
        />
      </div>
      <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
        <div className="col-span-1">Source</div>
        <div className="col-span-4">Front</div>
        <div className="col-span-5">Back</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
    </div>
  );
}
