// src/components/generate/CandidateEditorDialog.tsx

import * as React from "react";
import { Loader2 } from "lucide-react";
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
import type { CandidateViewModel } from "@/lib/hooks/ai-candidates";

interface ValidationErrors {
  front?: string;
  back?: string;
}

interface CandidateEditorDialogProps {
  isOpen: boolean;
  candidate: CandidateViewModel | null;
  onClose: () => void;
  onSave: (id: string, front: string, back: string) => Promise<void>;
}

/**
 * CandidateEditorDialog allows editing candidate flashcard front and back text
 */
export function CandidateEditorDialog({ isOpen, candidate, onClose, onSave }: CandidateEditorDialogProps) {
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form when candidate changes
  React.useEffect(() => {
    if (candidate) {
      setFront(candidate.front);
      setBack(candidate.back);
      setErrors({});
    }
  }, [candidate]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = candidate && (front !== candidate.front || back !== candidate.back);
  const isValid = front.trim().length > 0 && back.trim().length > 0 && front.length <= 200 && back.length <= 500;
  const canSave = hasChanges && isValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSave || !candidate) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onSave(candidate.id, front.trim(), back.trim());
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit & Accept Candidate</DialogTitle>
            <DialogDescription>
              Make changes to the candidate flashcard. Saving will accept this candidate and add it to your flashcard
              collection.
            </DialogDescription>
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
              />
              <div className="flex justify-between items-center">
                <p className={`text-xs ${getBackCharCountColor()}`}>{back.length}/500</p>
                {errors.back && <p className="text-xs text-destructive">{errors.back}</p>}
              </div>
            </div>

            {candidate?.prompt && (
              <div className="space-y-2">
                <label htmlFor="original-prompt" className="text-sm font-medium text-muted-foreground">
                  Original Prompt
                </label>
                <p id="original-prompt" className="text-sm text-muted-foreground italic">
                  {candidate.prompt}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Accept
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
