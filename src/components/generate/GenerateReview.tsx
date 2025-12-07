// src/components/generate/GenerateReview.tsx

import * as React from "react";
import { toast, Toaster } from "sonner";
import {
  useCandidates,
  useGeneration,
  useCandidateActions,
  type CandidateViewModel,
} from "@/lib/hooks/ai-candidates";
import type { CandidateCreateDto, CandidateActionCommand, CandidateDto } from "@/types";
import { PageHeader } from "@/components/flashcards/PageHeader";
import { BulkActionBar } from "@/components/flashcards/BulkActionBar";
import { GenerationForm } from "./GenerationForm";
import { CandidateList } from "./CandidateList";
import { CandidateEditorDialog } from "./CandidateEditorDialog";

// Constants
const SESSION_STORAGE_KEY = "10xCards_lastSessionId";
const MAX_SELECTION = 100;

/**
 * GenerateReview is the main container for the Generate & Review view
 * It manages:
 * - Pending candidates from previous sessions
 * - New candidate generation
 * - Bulk actions on candidates (accept/reject)
 */
export default function GenerateReview() {
  // Get last session ID from localStorage
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SESSION_STORAGE_KEY);
    }
    return null;
  });

  // Hooks for data management
  const {
    data: pendingCandidates,
    isLoading: isPendingLoading,
    error: pendingError,
    refresh: refreshPending,
  } = useCandidates(currentSessionId);

  const { isGenerating, error: generationError, generate } = useGeneration();
  const { isProcessing, error: actionsError, processActions } = useCandidateActions();

  // Local state for new candidates (after generation)
  const [newCandidates, setNewCandidates] = React.useState<CandidateViewModel[]>([]);

  // Selection state
  const [pendingSelection, setPendingSelection] = React.useState<Set<string>>(new Set());
  const [newSelection, setNewSelection] = React.useState<Set<string>>(new Set());

  // Editor state
  const [editorState, setEditorState] = React.useState<{
    isOpen: boolean;
    candidate: CandidateViewModel | null;
  }>({
    isOpen: false,
    candidate: null,
  });

  // Combined selection count
  const totalSelected = pendingSelection.size + newSelection.size;
  const maxSelectionReached = totalSelected >= MAX_SELECTION;

  // Show error toasts
  React.useEffect(() => {
    if (pendingError) {
      toast.error(pendingError);
    }
  }, [pendingError]);

  React.useEffect(() => {
    if (generationError) {
      toast.error(generationError);
    }
  }, [generationError]);

  React.useEffect(() => {
    if (actionsError) {
      toast.error(actionsError);
    }
  }, [actionsError]);

  // Clear selections when session changes
  React.useEffect(() => {
    setPendingSelection(new Set());
    setNewSelection(new Set());
  }, [currentSessionId]);

  // Handler for generation form submission
  const handleGenerate = React.useCallback(
    async (inputText: string, model: string) => {
      try {
        const result = await generate({ input_text: inputText, model });

        // Update session ID and store in localStorage
        const newSessionId = result.sessionId;
        setCurrentSessionId(newSessionId);
        localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);

        toast.success(`Generated ${result.candidates.length} flashcard candidates!`);

        // The candidates are now stored in the database with proper IDs
        // We need to fetch them from the server to get the real UUIDs
        // Since we just changed the session ID, the useCandidates hook will automatically refetch
        // But we need to manually trigger it since the state update might not have propagated yet
        
        // Fetch the newly generated candidates with real IDs
        try {
          const response = await fetch(`/api/ai-sessions/${newSessionId}/candidates`);
          if (response.ok) {
            const candidates = await response.json();
            const viewModels: CandidateViewModel[] = candidates.map((c: any) => ({
              id: c.id,
              front: c.front,
              back: c.back,
              prompt: c.prompt,
              aiSessionId: newSessionId,
              created_at: new Date().toISOString(),
              status: "new" as const,
            }));
            setNewCandidates(viewModels);
          }
        } catch (fetchError) {
          console.error("Failed to fetch generated candidates:", fetchError);
          // Fallback: refresh pending which will show them there
          await refreshPending();
        }
      } catch (error) {
        console.error("Generation failed:", error);
        // Error toast is handled by the hook
      }
    },
    [generate, refreshPending]
  );

  // Selection handlers for pending candidates
  const handleTogglePendingSelection = React.useCallback((id: string, selected: boolean) => {
    setPendingSelection((prev) => {
      const next = new Set(prev);
      if (selected) {
        if (next.size >= MAX_SELECTION) {
          toast.error("Maximum of 100 candidates can be selected at once");
          return prev;
        }
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAllPending = React.useCallback(
    (selected: boolean) => {
      if (selected) {
        const remainingSlots = MAX_SELECTION - pendingSelection.size;
        const candidatesToSelect = pendingCandidates.slice(0, remainingSlots);

        if (candidatesToSelect.length < pendingCandidates.length) {
          toast.error("Maximum of 100 candidates can be selected at once");
        }

        setPendingSelection(new Set(candidatesToSelect.map((c) => c.id)));
      } else {
        setPendingSelection(new Set());
      }
    },
    [pendingCandidates, pendingSelection.size]
  );

  // Selection handlers for new candidates
  const handleToggleNewSelection = React.useCallback((id: string, selected: boolean) => {
    setNewSelection((prev) => {
      const next = new Set(prev);
      if (selected) {
        if (next.size >= MAX_SELECTION) {
          toast.error("Maximum of 100 candidates can be selected at once");
          return prev;
        }
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAllNew = React.useCallback(
    (selected: boolean) => {
      if (selected) {
        const remainingSlots = MAX_SELECTION - newSelection.size;
        const candidatesToSelect = newCandidates.slice(0, remainingSlots);

        if (candidatesToSelect.length < newCandidates.length) {
          toast.error("Maximum of 100 candidates can be selected at once");
        }

        setNewSelection(new Set(candidatesToSelect.map((c) => c.id)));
      } else {
        setNewSelection(new Set());
      }
    },
    [newCandidates, newSelection.size]
  );

  // Clear all selections
  const handleClearSelection = React.useCallback(() => {
    setPendingSelection(new Set());
    setNewSelection(new Set());
  }, []);

  // Bulk accept handler
  const handleBulkAccept = React.useCallback(async () => {
    if (!currentSessionId || totalSelected === 0) return;

    const allSelectedIds = [...Array.from(pendingSelection), ...Array.from(newSelection)];

    if (allSelectedIds.length > MAX_SELECTION) {
      toast.error("Maximum of 100 candidates can be accepted at once");
      return;
    }

    // Optimistic update: remove selected candidates from UI
    const selectedNewCandidates = newCandidates.filter((c) => allSelectedIds.includes(c.id));
    setNewCandidates((prev) => prev.filter((c) => !allSelectedIds.includes(c.id)));
    handleClearSelection();

    try {
      const command: CandidateActionCommand = {
        actions: allSelectedIds.map((id) => ({
          candidate_id: id,
          action: "accept",
        })),
      };

      const result = await processActions(currentSessionId, command);
      toast.success(`${result.accepted.length} candidate${result.accepted.length > 1 ? "s" : ""} added to your flashcards!`);

      // Refresh to get updated state from server
      await refreshPending();
    } catch (error) {
      console.error("Failed to accept candidates:", error);
      toast.error("Failed to accept candidates - rolled back");
      
      // Rollback: restore the candidates
      setNewCandidates((prev) => [...prev, ...selectedNewCandidates]);
      await refreshPending();
    }
  }, [currentSessionId, totalSelected, pendingSelection, newSelection, processActions, handleClearSelection, refreshPending, newCandidates]);

  // Bulk reject handler
  const handleBulkReject = React.useCallback(async () => {
    if (!currentSessionId || totalSelected === 0) return;

    const allSelectedIds = [...Array.from(pendingSelection), ...Array.from(newSelection)];

    if (allSelectedIds.length > MAX_SELECTION) {
      toast.error("Maximum of 100 candidates can be rejected at once");
      return;
    }

    // Optimistic update: remove selected candidates from UI
    const selectedNewCandidates = newCandidates.filter((c) => allSelectedIds.includes(c.id));
    setNewCandidates((prev) => prev.filter((c) => !allSelectedIds.includes(c.id)));
    handleClearSelection();

    try {
      const command: CandidateActionCommand = {
        actions: allSelectedIds.map((id) => ({
          candidate_id: id,
          action: "reject",
        })),
      };

      const result = await processActions(currentSessionId, command);
      toast.success(`${result.rejected.length} candidate${result.rejected.length > 1 ? "s" : ""} rejected!`);

      // Refresh to get updated state from server
      await refreshPending();
    } catch (error) {
      console.error("Failed to reject candidates:", error);
      toast.error("Failed to reject candidates - rolled back");
      
      // Rollback: restore the candidates
      setNewCandidates((prev) => [...prev, ...selectedNewCandidates]);
      await refreshPending();
    }
  }, [currentSessionId, totalSelected, pendingSelection, newSelection, processActions, handleClearSelection, refreshPending, newCandidates]);

  // Individual candidate action handlers
  const handleAcceptCandidate = React.useCallback(
    async (id: string) => {
      if (!currentSessionId) return;

      // Optimistic update: remove from UI immediately
      const removedFromPending = pendingCandidates.find((c) => c.id === id);
      const removedFromNew = newCandidates.find((c) => c.id === id);

      if (removedFromPending || removedFromNew) {
        // Remove from lists optimistically
        setNewCandidates((prev) => prev.filter((c) => c.id !== id));
        
        try {
          const command: CandidateActionCommand = {
            actions: [{ candidate_id: id, action: "accept" }],
          };

          await processActions(currentSessionId, command);
          toast.success("Candidate added to your flashcards!");

          // Refresh to get updated state from server
          await refreshPending();
        } catch (error) {
          console.error("Failed to accept candidate:", error);
          toast.error("Failed to accept candidate - rolled back");
          
          // Rollback: restore the candidate
          if (removedFromNew) {
            setNewCandidates((prev) => [...prev, removedFromNew]);
          }
          // For pending candidates, refresh will restore them
          await refreshPending();
        }
      }
    },
    [currentSessionId, processActions, refreshPending, pendingCandidates, newCandidates]
  );

  const handleEditCandidate = React.useCallback(
    (id: string) => {
      // Find candidate in either pending or new lists
      const candidate = [...pendingCandidates, ...newCandidates].find((c) => c.id === id);
      if (candidate) {
        setEditorState({
          isOpen: true,
          candidate,
        });
      }
    },
    [pendingCandidates, newCandidates]
  );

  const handleEditorClose = React.useCallback(() => {
    setEditorState({
      isOpen: false,
      candidate: null,
    });
  }, []);

  const handleEditorSave = React.useCallback(
    async (id: string, front: string, back: string) => {
      if (!currentSessionId) return;

      // Optimistic update: remove from lists immediately
      const removedFromNew = newCandidates.find((c) => c.id === id);
      setNewCandidates((prev) => prev.filter((c) => c.id !== id));

      try {
        const command: CandidateActionCommand = {
          actions: [
            {
              candidate_id: id,
              action: "edit",
              edited_front: front,
              edited_back: back,
            },
          ],
        };

        await processActions(currentSessionId, command);
        toast.success("Candidate edited and added to your flashcards!");

        // Refresh to get updated state from server
        await refreshPending();
      } catch (error) {
        console.error("Failed to update candidate:", error);
        toast.error("Failed to update candidate - rolled back");
        
        // Rollback: restore the candidate
        if (removedFromNew) {
          setNewCandidates((prev) => [...prev, removedFromNew]);
        }
        await refreshPending();
        
        throw error; // Re-throw to let dialog handle it
      }
    },
    [currentSessionId, processActions, refreshPending, newCandidates]
  );

  const handleRejectCandidate = React.useCallback(
    async (id: string) => {
      if (!currentSessionId) return;

      // Optimistic update: remove from UI immediately
      const removedFromPending = pendingCandidates.find((c) => c.id === id);
      const removedFromNew = newCandidates.find((c) => c.id === id);

      if (removedFromPending || removedFromNew) {
        // Remove from lists optimistically
        setNewCandidates((prev) => prev.filter((c) => c.id !== id));
        
        try {
          const command: CandidateActionCommand = {
            actions: [{ candidate_id: id, action: "reject" }],
          };

          await processActions(currentSessionId, command);
          toast.success("Candidate rejected!");

          // Refresh to get updated state from server
          await refreshPending();
        } catch (error) {
          console.error("Failed to reject candidate:", error);
          toast.error("Failed to reject candidate - rolled back");
          
          // Rollback: restore the candidate
          if (removedFromNew) {
            setNewCandidates((prev) => [...prev, removedFromNew]);
          }
          // For pending candidates, refresh will restore them
          await refreshPending();
        }
      }
    },
    [currentSessionId, processActions, refreshPending, pendingCandidates, newCandidates]
  );

  return (
    <div className="container mx-auto py-8 px-4 md:max-w-5xl" data-testid="generate-review-page">
      <PageHeader
        title="Generate & Review"
        description="Generate new flashcards from text or review pending candidates"
      />

      {/* Pending Candidates Section */}
      {pendingCandidates.length > 0 && (
        <section className="mb-12" data-testid="pending-candidates-section">
          <h2 className="text-2xl font-semibold mb-4">Pending Candidates</h2>
          <p className="text-muted-foreground mb-6" data-testid="pending-candidates-count">
            You have {pendingCandidates.length} pending candidate{pendingCandidates.length > 1 ? "s" : ""} from
            previous sessions.
          </p>
          <CandidateList
            candidates={pendingCandidates}
            isLoading={isPendingLoading}
            selectedIds={pendingSelection}
            onToggleSelection={handleTogglePendingSelection}
            onSelectAll={handleSelectAllPending}
            onAccept={handleAcceptCandidate}
            onEdit={handleEditCandidate}
            onReject={handleRejectCandidate}
            disabled={isProcessing}
            testIdPrefix="pending-candidate"
          />
        </section>
      )}

      {/* Generation Form Section */}
      <section className="mb-12" data-testid="generation-form-section">
        <h2 className="text-2xl font-semibold mb-4">Generate New Flashcards</h2>
        <div className="border rounded-lg p-6 bg-card">
          <GenerationForm onSubmit={handleGenerate} isLoading={isGenerating} />
        </div>
      </section>

      {/* New Candidates Section */}
      {newCandidates.length > 0 && (
        <section className="mb-12" data-testid="new-candidates-section">
          <h2 className="text-2xl font-semibold mb-4">Newly Generated Candidates</h2>
          <p className="text-muted-foreground mb-6" data-testid="new-candidates-count">
            Review and accept or reject the {newCandidates.length} newly generated candidate
            {newCandidates.length > 1 ? "s" : ""}.
          </p>
          <CandidateList
            candidates={newCandidates}
            isLoading={false}
            selectedIds={newSelection}
            onToggleSelection={handleToggleNewSelection}
            onSelectAll={handleSelectAllNew}
            onAccept={handleAcceptCandidate}
            onEdit={handleEditCandidate}
            onReject={handleRejectCandidate}
            disabled={isProcessing}
            testIdPrefix="new-candidate"
          />
        </section>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={totalSelected}
        onBulkAccept={handleBulkAccept}
        onBulkReject={handleBulkReject}
        onClearSelection={handleClearSelection}
        maxSelectionReached={maxSelectionReached}
        mode="candidates"
      />

      {/* Editor Dialog */}
      <CandidateEditorDialog
        isOpen={editorState.isOpen}
        candidate={editorState.candidate}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
      />

      <Toaster position="top-center" richColors />
    </div>
  );
}

