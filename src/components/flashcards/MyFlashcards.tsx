// src/components/flashcards/MyFlashcards.tsx

import * as React from "react";
import { Plus } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useFlashcards, useCreateFlashcard } from "@/lib/hooks/flashcards";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./PageHeader";
import { SearchBar } from "./SearchBar";
import { BulkActionBar } from "./BulkActionBar";
import { FlashcardList } from "./FlashcardList";
import { Pagination } from "./Pagination";
import { FlashcardEditorDialog } from "./FlashcardEditorDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { BulkDeleteConfirmDialog } from "./BulkDeleteConfirmDialog";
import type {
  FlashcardDto,
  UpdateFlashcardCommand,
  CreateFlashcardCommand,
  EditorState,
  DeleteConfirmState,
  BulkDeleteConfirmState,
} from "@/types";

/**
 * MyFlashcards is the main container component for the My Flashcards view
 */
export default function MyFlashcards() {
  // Flashcards data and operations from custom hook
  const {
    flashcards,
    pagination,
    searchParams,
    isLoading,
    error,
    updateSearch,
    updatePage,
    updateFlashcard,
    deleteFlashcard,
    bulkDeleteFlashcards,
    refetch,
  } = useFlashcards();

  // Create flashcard hook
  const { mutate: createFlashcard } = useCreateFlashcard();

  // Selection state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  // Editor dialog state
  const [editorState, setEditorState] = React.useState<EditorState>({
    isOpen: false,
    flashcard: null,
    front: "",
    back: "",
    errors: {},
    isSubmitting: false,
  });

  // Single delete confirmation state
  const [deleteState, setDeleteState] = React.useState<DeleteConfirmState>({
    isOpen: false,
    flashcard: null,
    isDeleting: false,
  });

  // Bulk delete confirmation state
  const [bulkDeleteState, setBulkDeleteState] = React.useState<BulkDeleteConfirmState>({
    isOpen: false,
    isDeleting: false,
  });

  // Clear selection when page changes
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [pagination.page]);

  // Clear selection when search changes
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [searchParams.search]);

  // Show error toast if error occurs
  React.useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Selection handlers
  const handleToggleSelection = React.useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        // Check if we've reached the limit
        if (next.size >= 100) {
          toast.error("Maximum of 100 flashcards can be selected at once");
          return prev;
        }
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = React.useCallback(
    (selected: boolean) => {
      if (selected) {
        // Calculate how many we can select
        const remainingSlots = 100 - selectedIds.size;
        const flashcardsToSelect = flashcards.slice(0, remainingSlots);

        if (flashcardsToSelect.length < flashcards.length) {
          toast.error("Maximum of 100 flashcards can be selected at once");
        }

        setSelectedIds(new Set(flashcardsToSelect.map((f) => f.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [flashcards, selectedIds.size]
  );

  const handleClearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Search handler
  const handleSearch = React.useCallback(
    (value: string) => {
      updateSearch(value);
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [updateSearch]
  );

  // Pagination handler
  const handlePageChange = React.useCallback(
    (page: number) => {
      updatePage(page);
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [updatePage]
  );

  // Edit handlers
  const handleEditClick = React.useCallback((flashcard: FlashcardDto) => {
    setEditorState({
      isOpen: true,
      flashcard,
      front: flashcard.front,
      back: flashcard.back,
      errors: {},
      isSubmitting: false,
    });
  }, []);

  const handleEditSave = React.useCallback(
    async (id: string, command: UpdateFlashcardCommand) => {
      try {
        await updateFlashcard(id, command);
        toast.success("Flashcard updated successfully");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to update flashcard:", error);
        toast.error("Failed to update flashcard");
        throw error; // Re-throw to let dialog handle it
      }
    },
    [updateFlashcard]
  );

  const handleEditCancel = React.useCallback(() => {
    setEditorState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Create handlers
  const handleCreateClick = React.useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCreateSave = React.useCallback(
    async (command: CreateFlashcardCommand) => {
      try {
        await createFlashcard([
          {
            front: command.front,
            back: command.back,
            source: "manual",
          },
        ]);
        toast.success("Flashcard created successfully!");
        setCreateDialogOpen(false);
        // Refetch to update the list
        await refetch();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to create flashcard:", error);
        toast.error("Failed to create flashcard");
        throw error; // Re-throw to let dialog handle it
      }
    },
    [createFlashcard, refetch]
  );

  const handleCreateCancel = React.useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  // Single delete handlers
  const handleDeleteClick = React.useCallback((flashcard: FlashcardDto) => {
    setDeleteState({
      isOpen: true,
      flashcard,
      isDeleting: false,
    });
  }, []);

  const handleDeleteConfirm = React.useCallback(
    async (id: string) => {
      setDeleteState((prev) => ({ ...prev, isDeleting: true }));

      try {
        await deleteFlashcard(id);
        toast.success("Flashcard deleted successfully");
        setDeleteState({ isOpen: false, flashcard: null, isDeleting: false });

        // If current page is empty after deletion and not page 1, go to previous page
        if (flashcards.length === 1 && pagination.page > 1) {
          updatePage(pagination.page - 1);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete flashcard:", error);
        toast.error("Failed to delete flashcard");
        setDeleteState((prev) => ({ ...prev, isDeleting: false }));
      }
    },
    [deleteFlashcard, flashcards.length, pagination.page, updatePage]
  );

  const handleDeleteCancel = React.useCallback(() => {
    setDeleteState({ isOpen: false, flashcard: null, isDeleting: false });
  }, []);

  // Bulk delete handlers
  const handleBulkDeleteClick = React.useCallback(() => {
    if (selectedIds.size === 0) return;
    if (selectedIds.size > 100) {
      toast.error("Maximum of 100 flashcards can be deleted at once");
      return;
    }

    setBulkDeleteState({ isOpen: true, isDeleting: false });
  }, [selectedIds.size]);

  const handleBulkDeleteConfirm = React.useCallback(async () => {
    setBulkDeleteState((prev) => ({ ...prev, isDeleting: true }));

    try {
      const idsArray = Array.from(selectedIds);
      const deletedCount = await bulkDeleteFlashcards(idsArray);

      // Handle case where no flashcards were actually deleted
      if (deletedCount === 0) {
        toast.warning("The selected flashcards were already deleted or not found");
        setBulkDeleteState({ isOpen: false, isDeleting: false });
        setSelectedIds(new Set());
        return;
      }

      toast.success(`${deletedCount} flashcard${deletedCount > 1 ? "s" : ""} deleted successfully`);
      setBulkDeleteState({ isOpen: false, isDeleting: false });
      setSelectedIds(new Set());

      // If current page is empty after deletion and not page 1, go to previous page
      if (flashcards.length <= selectedIds.size && pagination.page > 1) {
        updatePage(pagination.page - 1);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to bulk delete flashcards:", error);
      toast.error("Failed to delete flashcards");
      setBulkDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  }, [selectedIds, bulkDeleteFlashcards, flashcards.length, pagination.page, updatePage]);

  const handleBulkDeleteCancel = React.useCallback(() => {
    setBulkDeleteState({ isOpen: false, isDeleting: false });
  }, []);

  const handleClearSearch = React.useCallback(() => {
    updateSearch("");
  }, [updateSearch]);

  const maxSelectionReached = selectedIds.size >= 100;

  return (
    <div className="container mx-auto py-8 px-4 md:max-w-5xl">
      <PageHeader
        title="My Flashcards"
        action={
          <Button onClick={handleCreateClick} data-testid="new-flashcard-button" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Flashcard
          </Button>
        }
      />

      <div className="mb-6">
        <SearchBar value={searchParams.search} onChange={handleSearch} placeholder="Search flashcards..." />
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onBulkDelete={handleBulkDeleteClick}
        onClearSelection={handleClearSelection}
        maxSelectionReached={maxSelectionReached}
      />

      <FlashcardList
        flashcards={flashcards}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onToggleSelection={handleToggleSelection}
        onSelectAll={handleSelectAll}
        isSearch={searchParams.search.length > 0}
        searchQuery={searchParams.search}
        onClearSearch={handleClearSearch}
        data-testid="flashcards-list"
      />

      <Pagination pagination={pagination} onPageChange={handlePageChange} disabled={isLoading} />

      {editorState.flashcard && (
        <FlashcardEditorDialog
          mode="edit"
          isOpen={editorState.isOpen}
          flashcard={editorState.flashcard}
          onClose={handleEditCancel}
          onSave={handleEditSave}
        />
      )}

      <FlashcardEditorDialog
        mode="create"
        isOpen={createDialogOpen}
        onClose={handleCreateCancel}
        onSave={handleCreateSave}
      />

      <DeleteConfirmDialog
        isOpen={deleteState.isOpen}
        flashcard={deleteState.flashcard}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteState.isDeleting}
      />

      <BulkDeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        selectedCount={selectedIds.size}
        onClose={handleBulkDeleteCancel}
        onConfirm={handleBulkDeleteConfirm}
        isDeleting={bulkDeleteState.isDeleting}
      />

      <Toaster position="top-center" richColors />
    </div>
  );
}
