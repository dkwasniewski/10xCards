// src/components/flashcards/FlashcardEditorDialog.tsx

import * as React from "react";
import { LoadingCards } from "@/components/ui/loading-cards";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardDto, UpdateFlashcardCommand, ValidationErrors, CreateFlashcardCommand } from "@/types";

interface FlashcardEditorDialogEditProps {
  mode: "edit";
  isOpen: boolean;
  flashcard: FlashcardDto;
  onClose: () => void;
  onSave: (id: string, command: UpdateFlashcardCommand) => Promise<void>;
}

interface FlashcardEditorDialogCreateProps {
  mode: "create";
  isOpen: boolean;
  flashcard?: null;
  onClose: () => void;
  onSave: (command: CreateFlashcardCommand) => Promise<void>;
}

type FlashcardEditorDialogProps = FlashcardEditorDialogEditProps | FlashcardEditorDialogCreateProps;

/**
 * FlashcardEditorDialog allows creating or editing flashcard front and back text
 */
export function FlashcardEditorDialog({ mode, isOpen, flashcard, onClose, onSave }: FlashcardEditorDialogProps) {
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form when flashcard changes or mode changes
  React.useEffect(() => {
    if (mode === "edit" && flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setErrors({});
    } else if (mode === "create") {
      setFront("");
      setBack("");
      setErrors({});
    }
  }, [mode, flashcard]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // For create mode, require non-empty fields
    if (mode === "create") {
      if (!front.trim()) {
        newErrors.front = "Front text is required";
      } else if (front.length > 200) {
        newErrors.front = "Front text must be 200 characters or less";
      }

      if (!back.trim()) {
        newErrors.back = "Back text is required";
      } else if (back.length > 500) {
        newErrors.back = "Back text must be 500 characters or less";
      }
    } else {
      // For edit mode, just validate length
      if (front.length > 200) {
        newErrors.front = "Front text must be 200 characters or less";
      }

      if (back.length > 500) {
        newErrors.back = "Back text must be 500 characters or less";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = mode === "create" ? true : flashcard && (front !== flashcard.front || back !== flashcard.back);
  const isValid =
    mode === "create"
      ? front.trim().length > 0 && back.trim().length > 0 && front.length <= 200 && back.length <= 500
      : front.length <= 200 && back.length <= 500;
  const canSave = hasChanges && isValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSave) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const command: CreateFlashcardCommand = {
          front: front.trim(),
          back: back.trim(),
          source: "manual",
        };
        await onSave(command);
        // Clear form after successful creation
        setFront("");
        setBack("");
      } else if (flashcard) {
        const command: UpdateFlashcardCommand = {};
        if (front !== flashcard.front) command.front = front;
        if (back !== flashcard.back) command.back = back;
        await onSave(flashcard.id, command);
      }
      onClose();
    } catch (error) {
      // Handle validation errors from API
      if (error instanceof Error) {
        setErrors({
          front: error.message.includes("front") ? error.message : undefined,
          back: error.message.includes("back") ? error.message : undefined,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFrontCharCountColor = () => {
    if (front.length > 200) return "text-destructive";
    if (front.length >= 180) return "text-amber-600 dark:text-amber-500";
    return "text-muted-foreground";
  };

  const getBackCharCountColor = () => {
    if (back.length > 500) return "text-destructive";
    if (back.length >= 450) return "text-amber-600 dark:text-amber-500";
    return "text-muted-foreground";
  };

  const dialogTitle = mode === "create" ? "Create Flashcard" : "Edit Flashcard";
  const dialogDescription =
    mode === "create"
      ? "Create a new flashcard by entering the front and back text."
      : "Make changes to your flashcard. Click save when you're done.";
  const submitButtonText = mode === "create" ? "Create" : "Save changes";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[600px]"
        data-testid={mode === "create" ? "create-flashcard-dialog" : "edit-flashcard-dialog"}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="front" className="text-sm font-medium">
                Front
              </label>
              <Textarea
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter the question or front of the card..."
                className="min-h-[100px]"
                disabled={isSubmitting}
                data-testid="flashcard-front-input"
                maxLength={200}
              />
              <div className="flex justify-between items-center">
                <p className={`text-xs ${getFrontCharCountColor()}`}>{front.length}/200</p>
                {errors.front && <p className="text-xs text-destructive">{errors.front}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="back" className="text-sm font-medium">
                Back
              </label>
              <Textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Enter the answer or back of the card..."
                className="min-h-[150px]"
                disabled={isSubmitting}
                data-testid="flashcard-back-input"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <p className={`text-xs ${getBackCharCountColor()}`}>{back.length}/500</p>
                {errors.back && <p className="text-xs text-destructive">{errors.back}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="dialog-cancel-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSave}
              data-testid={mode === "create" ? "create-flashcard-submit" : "edit-flashcard-submit"}
            >
              {isSubmitting && <LoadingCards size={16} className="mr-2" />}
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
