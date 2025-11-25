// src/components/flashcards/FlashcardRow.tsx

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { FlashcardDto } from "@/types";

interface FlashcardRowProps {
  flashcard: FlashcardDto;
  isSelected: boolean;
  onToggleSelection: (id: string, selected: boolean) => void;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * FlashcardRow displays a single flashcard with selection checkbox and action buttons
 */
export function FlashcardRow({ flashcard, isSelected, onToggleSelection, onEdit, onDelete }: FlashcardRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const frontText = isExpanded ? flashcard.front : truncateText(flashcard.front, 100);
  const backText = isExpanded ? flashcard.back : truncateText(flashcard.back, 200);
  const shouldTruncateFront = flashcard.front.length > 100;
  const shouldTruncateBack = flashcard.back.length > 200;
  const shouldShowExpand = shouldTruncateFront || shouldTruncateBack;

  const handleRowClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    // Don't expand if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest('[role="checkbox"]') || target.closest("input")) {
      return;
    }

    if (shouldShowExpand) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRowClick(e);
    }
  };

  const createdAt = new Date(flashcard.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  return (
    <div
      className={`flex items-start gap-4 border rounded-lg p-4 transition-colors ${
        isSelected ? "bg-accent border-primary" : "hover:bg-muted/50"
      } ${shouldShowExpand ? "cursor-pointer" : ""}`}
      onClick={handleRowClick}
      onKeyDown={shouldShowExpand ? handleKeyDown : undefined}
      role={shouldShowExpand ? "button" : undefined}
      tabIndex={shouldShowExpand ? 0 : undefined}
    >
      <div className="flex items-start pt-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onToggleSelection(flashcard.id, checked === true)}
          aria-label={`Select flashcard: ${flashcard.front}`}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-w-0">
        <div className="col-span-1 flex items-start pt-1">
          <Badge variant={flashcard.source === "ai" ? "default" : "secondary"}>
            {flashcard.source === "ai" ? "AI" : "Manual"}
          </Badge>
        </div>

        <div className="col-span-4 min-w-0">
          <p className="text-sm break-words">{frontText}</p>
        </div>

        <div className="col-span-5 min-w-0">
          <p className="text-sm text-muted-foreground break-words">{backText}</p>
          {shouldShowExpand && (
            <button
              className="text-xs text-primary hover:underline mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
          <p className="text-xs text-muted-foreground mt-2" title={format(createdAt, "PPpp")}>
            Created {timeAgo}
          </p>
        </div>

        <div className="col-span-2 flex items-start justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(flashcard);
            }}
            aria-label="Edit flashcard"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(flashcard);
            }}
            aria-label="Delete flashcard"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
