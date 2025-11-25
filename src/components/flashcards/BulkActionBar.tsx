// src/components/flashcards/BulkActionBar.tsx

import * as React from "react";
import { Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  onBulkDelete?: () => void;
  onBulkAccept?: () => void;
  onBulkReject?: () => void;
  onClearSelection: () => void;
  maxSelectionReached?: boolean;
  mode?: "flashcards" | "candidates";
}

/**
 * BulkActionBar appears when items are selected and provides bulk operations
 * Supports two modes: flashcards (delete) and candidates (accept/reject)
 */
export function BulkActionBar({
  selectedCount,
  onBulkDelete,
  onBulkAccept,
  onBulkReject,
  onClearSelection,
  maxSelectionReached = false,
  mode = "flashcards",
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  const itemLabel = mode === "flashcards" ? "flashcard" : "candidate";
  const itemLabelPlural = mode === "flashcards" ? "flashcards" : "candidates";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in slide-in-from-bottom-5">
      <div className="container flex items-center justify-between gap-4 py-4 md:max-w-5xl">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? itemLabel : itemLabelPlural} selected
          </p>
          {maxSelectionReached && (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Maximum of 100 {itemLabelPlural} can be selected
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClearSelection}>
            <X className="h-4 w-4 mr-2" />
            Clear selection
          </Button>
          {mode === "candidates" ? (
            <>
              {onBulkAccept && (
                <Button variant="default" size="sm" onClick={onBulkAccept} className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Accept selected
                </Button>
              )}
              {onBulkReject && (
                <Button variant="destructive" size="sm" onClick={onBulkReject}>
                  <X className="h-4 w-4 mr-2" />
                  Reject selected
                </Button>
              )}
            </>
          ) : (
            onBulkDelete && (
              <Button variant="destructive" size="sm" onClick={onBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete selected
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
