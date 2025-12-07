// src/components/generate/CandidateRow.tsx

import * as React from "react";
import { Check, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CandidateViewModel } from "@/lib/hooks/ai-candidates";

interface CandidateRowProps {
  candidate: CandidateViewModel;
  isSelected: boolean;
  onToggleSelection: (id: string, selected: boolean) => void;
  onAccept: (id: string) => void;
  onEdit: (id: string) => void;
  onReject: (id: string) => void;
  disabled?: boolean;
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * CandidateRow displays a single candidate flashcard with selection and action buttons
 */
export function CandidateRow({
  candidate,
  isSelected,
  onToggleSelection,
  onAccept,
  onEdit,
  onReject,
  disabled = false,
}: CandidateRowProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const frontText = isExpanded ? candidate.front : truncateText(candidate.front, 100);
  const backText = isExpanded ? candidate.back : truncateText(candidate.back, 200);
  const shouldTruncateFront = candidate.front.length > 100;
  const shouldTruncateBack = candidate.back.length > 200;
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

  return (
    <div
      className={`flex items-start gap-3 lg:gap-4 border rounded-lg p-4 transition-colors ${
        isSelected ? "bg-accent border-primary" : "hover:bg-muted/50"
      } ${shouldShowExpand ? "cursor-pointer" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      onClick={handleRowClick}
      onKeyDown={shouldShowExpand ? handleKeyDown : undefined}
      role={shouldShowExpand ? "button" : undefined}
      tabIndex={shouldShowExpand ? 0 : undefined}
      data-testid="candidate-row"
    >
      <div className="flex items-start pt-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onToggleSelection(candidate.id, checked === true)}
          aria-label={`Select candidate: ${candidate.front}`}
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
          data-testid="candidate-checkbox"
        />
      </div>

      {/* Mobile Layout - Stacked */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 lg:hidden">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={candidate.status === "new" ? "default" : "secondary"}>
            {candidate.status === "new" ? "New" : "Pending"}
          </Badge>
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Front</div>
          <p className="text-sm break-words" data-testid="candidate-front">
            {frontText}
          </p>
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Back</div>
          <p className="text-sm text-muted-foreground break-words" data-testid="candidate-back">
            {backText}
          </p>
        </div>

        {shouldShowExpand && (
          <button
            className="text-xs text-primary hover:underline self-start"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}

        {candidate.prompt && (
          <p className="text-xs text-muted-foreground" title={candidate.prompt}>
            Prompt: {truncateText(candidate.prompt, 60)}
          </p>
        )}

        {/* Mobile Action Buttons - Grid with labels */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAccept(candidate.id);
            }}
            disabled={disabled}
            aria-label="Accept candidate"
            title="Accept and add to your flashcards"
            className="flex-col h-auto py-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-950"
            data-testid="candidate-accept-button"
          >
            <Check className="h-4 w-4 mb-1" />
            <span className="text-xs">Accept</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(candidate.id);
            }}
            disabled={disabled}
            aria-label="Edit and accept candidate"
            title="Edit and accept this candidate"
            className="flex-col h-auto py-2"
            data-testid="candidate-edit-button"
          >
            <Pencil className="h-4 w-4 mb-1" />
            <span className="text-xs">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onReject(candidate.id);
            }}
            disabled={disabled}
            aria-label="Reject candidate"
            title="Reject this candidate"
            className="flex-col h-auto py-2 text-destructive hover:bg-destructive/10"
            data-testid="candidate-reject-button"
          >
            <X className="h-4 w-4 mb-1" />
            <span className="text-xs">Reject</span>
          </Button>
        </div>
      </div>

      {/* Desktop Layout - Grid */}
      <div className="hidden lg:flex flex-1 lg:grid lg:grid-cols-12 gap-4 min-w-0">
        <div className="col-span-1 flex items-start pt-1">
          <Badge variant={candidate.status === "new" ? "default" : "secondary"}>
            {candidate.status === "new" ? "New" : "Pending"}
          </Badge>
        </div>

        <div className="col-span-4 min-w-0">
          <p className="text-sm break-words" data-testid="candidate-front">{frontText}</p>
        </div>

        <div className="col-span-5 min-w-0">
          <p className="text-sm text-muted-foreground break-words" data-testid="candidate-back">{backText}</p>
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
          {candidate.prompt && (
            <p className="text-xs text-muted-foreground mt-2" title={candidate.prompt}>
              Prompt: {truncateText(candidate.prompt, 60)}
            </p>
          )}
        </div>

        <div className="col-span-2 flex items-start justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onAccept(candidate.id);
            }}
            aria-label="Accept candidate"
            disabled={disabled}
            title="Accept and add to your flashcards"
            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-950"
            data-testid="candidate-accept-button"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(candidate.id);
            }}
            aria-label="Edit and accept candidate"
            disabled={disabled}
            title="Edit and accept this candidate"
            data-testid="candidate-edit-button"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onReject(candidate.id);
            }}
            aria-label="Reject candidate"
            disabled={disabled}
            title="Reject this candidate"
            className="text-destructive hover:bg-destructive/10"
            data-testid="candidate-reject-button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

