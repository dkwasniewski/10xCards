// src/components/generate/CandidateList.tsx

import * as React from "react";
import { LoadingCards } from "@/components/ui/loading-cards";
import { CandidateRow } from "./CandidateRow";
import { CandidateListHeader } from "./CandidateListHeader";
import type { CandidateViewModel } from "@/lib/hooks/ai-candidates";

interface CandidateListProps {
  candidates: CandidateViewModel[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onAccept: (id: string) => void;
  onEdit: (id: string) => void;
  onReject: (id: string) => void;
  disabled?: boolean;
  testIdPrefix?: string;
}

/**
 * CandidateList displays a list of candidate flashcards with selection and actions
 */
export function CandidateList({
  candidates,
  isLoading,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  onAccept,
  onEdit,
  onReject,
  disabled = false,
  testIdPrefix = "candidate",
}: CandidateListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" data-testid={`${testIdPrefix}-list-loading`}>
        <LoadingCards size={64} />
        <span className="ml-3 text-muted-foreground">Loading candidates...</span>
      </div>
    );
  }

  // Empty state
  if (candidates.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-testid={`${testIdPrefix}-list-empty`}
      >
        <p className="text-muted-foreground">No candidates found</p>
      </div>
    );
  }

  // Calculate selection states
  const isAllSelected = candidates.length > 0 && candidates.every((c) => selectedIds.has(c.id));
  const isIndeterminate = candidates.some((c) => selectedIds.has(c.id)) && !isAllSelected;

  return (
    <div className="space-y-4" data-testid={`${testIdPrefix}-list`}>
      <CandidateListHeader
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        onSelectAll={onSelectAll}
        disabled={disabled || isLoading}
        testIdPrefix={testIdPrefix}
      />

      <div className="space-y-3" data-testid={`${testIdPrefix}-rows-container`}>
        {candidates.map((candidate) => (
          <CandidateRow
            key={candidate.id}
            candidate={candidate}
            isSelected={selectedIds.has(candidate.id)}
            onToggleSelection={onToggleSelection}
            onAccept={onAccept}
            onEdit={onEdit}
            onReject={onReject}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
