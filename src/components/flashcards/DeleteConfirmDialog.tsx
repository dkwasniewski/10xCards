// src/components/flashcards/DeleteConfirmDialog.tsx

import * as React from "react";
import { LoadingCards } from "@/components/ui/loading-cards";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { FlashcardDto } from "@/types";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isDeleting: boolean;
}

/**
 * Truncate text for preview
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * DeleteConfirmDialog asks for confirmation before deleting a flashcard
 */
export function DeleteConfirmDialog({ isOpen, flashcard, onClose, onConfirm, isDeleting }: DeleteConfirmDialogProps) {
  const handleConfirm = async () => {
    if (!flashcard) return;
    await onConfirm(flashcard.id);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>Are you sure you want to delete this flashcard? This action cannot be undone.</p>
              {flashcard && (
                <div className="mt-4 p-3 rounded-md bg-muted">
                  <p className="text-sm font-medium text-foreground">{truncateText(flashcard.front, 100)}</p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <LoadingCards size={16} className="mr-2" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
