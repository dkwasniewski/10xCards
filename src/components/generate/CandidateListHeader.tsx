// src/components/generate/CandidateListHeader.tsx

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface CandidateListHeaderProps {
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * CandidateListHeader displays the header row with "Select All" checkbox
 */
export function CandidateListHeader({
  isAllSelected,
  isIndeterminate,
  onSelectAll,
  disabled = false,
}: CandidateListHeaderProps) {
  return (
    <div className="flex items-center gap-4 border-b pb-3 mb-4">
      <div className="flex items-center">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={(checked) => onSelectAll(checked === true)}
          disabled={disabled}
          aria-label="Select all candidates on this page"
          className={isIndeterminate && !isAllSelected ? "data-[state=checked]:bg-primary" : ""}
        />
      </div>
      <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
        <div className="col-span-1">Status</div>
        <div className="col-span-4">Front</div>
        <div className="col-span-5">Back</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
    </div>
  );
}


