// src/components/flashcards/EmptyState.tsx

import * as React from "react";
import { FileQuestion, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  isSearch: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
  onCreateClick?: () => void;
}

/**
 * EmptyState displays a message when no flashcards are found
 */
export function EmptyState({ isSearch, searchQuery, onClearSearch, onCreateClick }: EmptyStateProps) {
  if (isSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No flashcards found</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {searchQuery
            ? `No flashcards match "${searchQuery}". Try a different search term.`
            : "No flashcards match your search. Try a different search term."}
        </p>
        {onClearSearch && (
          <Button variant="outline" onClick={onClearSearch}>
            Clear search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You haven&apos;t created any flashcards yet. Create your first flashcard to get started.
      </p>
      {onCreateClick && (
        <Button onClick={onCreateClick}>Create your first flashcard</Button>
      )}
    </div>
  );
}
