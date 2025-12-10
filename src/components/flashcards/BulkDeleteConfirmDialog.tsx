// src/components/flashcards/BulkDeleteConfirmDialog.tsx

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

interface BulkDeleteConfirmDialogProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

/**
 * BulkDeleteConfirmDialog asks for confirmation before bulk deleting flashcards
 */
export function BulkDeleteConfirmDialog({
  isOpen,
  selectedCount,
  onClose,
  onConfirm,
  isDeleting,
}: BulkDeleteConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Multiple Flashcards</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p className="font-semibold text-destructive">
                Are you sure you want to delete {selectedCount} {selectedCount === 1 ? "flashcard" : "flashcards"}?
              </p>
              <p>
                This action cannot be undone. All selected flashcards will be permanently deleted from your collection.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <LoadingCards size={16} className="mr-2" />}
            Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
