// src/components/flashcards/FlashcardList.tsx

import * as React from "react";
import { Loader2 } from "lucide-react";
import { FlashcardRow } from "./FlashcardRow";
import { ListHeader } from "./ListHeader";
import { EmptyState } from "./EmptyState";
import type { FlashcardDto } from "@/types";

interface FlashcardListProps {
  flashcards: FlashcardDto[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
  onToggleSelection: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  isSearch?: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
}

/**
 * FlashcardList displays a list of flashcards with selection and actions
 */
export function FlashcardList({
  flashcards,
  isLoading,
  selectedIds,
  onEdit,
  onDelete,
  onToggleSelection,
  onSelectAll,
  isSearch = false,
  searchQuery,
  onClearSearch,
}: FlashcardListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading flashcards...</span>
      </div>
    );
  }

  // Empty state
  if (flashcards.length === 0) {
    return <EmptyState isSearch={isSearch} searchQuery={searchQuery} onClearSearch={onClearSearch} />;
  }

  // Calculate selection states
  const isAllSelected = flashcards.length > 0 && flashcards.every((f) => selectedIds.has(f.id));
  const isIndeterminate = flashcards.some((f) => selectedIds.has(f.id)) && !isAllSelected;

  return (
    <div className="space-y-4">
      <ListHeader
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        onSelectAll={onSelectAll}
        disabled={isLoading}
      />

      <div className="space-y-3">
        {flashcards.map((flashcard) => (
          <FlashcardRow
            key={flashcard.id}
            flashcard={flashcard}
            isSelected={selectedIds.has(flashcard.id)}
            onToggleSelection={onToggleSelection}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
