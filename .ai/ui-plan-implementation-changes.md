# UI Plan Implementation Changes

This document outlines the changes needed to align the codebase with the updated `ui-plan.md`.

## Summary of UI Plan Changes

1. **Removed `/review`** - Consolidated with `/generate` into a single "Generate & Review" view
2. **Removed `/flashcards/new`** - Changed to a modal-based approach on `/flashcards`

## Required Code Changes

### 1. Remove Separate Create Flashcard Route ✅ TODO

**Files to remove:**

- `/src/pages/flashcards/new.astro` - No longer needed
- `/src/components/flashcards/CreateFlashcardPage.tsx` - Functionality moved to modal

**Rationale:** Creating flashcards via modal on `/flashcards` provides:

- Consistent UX (edit also uses modal)
- Context preservation (user sees the list while creating)
- Simpler navigation flow

### 2. Enhance FlashcardEditorDialog for Create + Edit ✅ TODO

**File:** `/src/components/flashcards/FlashcardEditorDialog.tsx`

**Current state:**

- Only supports editing existing flashcards
- Requires a `flashcard` prop (not optional)
- onSave signature: `(id: string, command: UpdateFlashcardCommand) => Promise<void>`

**Changes needed:**

```typescript
interface FlashcardEditorDialogProps {
  mode: "create" | "edit";
  isOpen: boolean;
  flashcard?: FlashcardDto | null; // Optional for create mode
  onClose: () => void;
  onSave: mode === "create"
    ? (command: CreateFlashcardCommand) => Promise<void>
    : (id: string, command: UpdateFlashcardCommand) => Promise<void>;
}
```

**Implementation notes:**

- Add `mode` prop to distinguish create vs edit
- Make `flashcard` optional (only required for edit mode)
- Update validation: require non-empty fields for create mode
- Update dialog title based on mode ("Create Flashcard" vs "Edit Flashcard")
- Update submit button text ("Create" vs "Save Changes")
- Clear form after successful creation
- Handle different onSave signatures

### 3. Add "New Flashcard" Button to My Flashcards View ✅ TODO

**File:** `/src/components/flashcards/MyFlashcards.tsx`

**Changes needed:**

1. Add creation state management:

```typescript
const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
```

2. Add create handler:

```typescript
const handleCreate = async (command: CreateFlashcardCommand) => {
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
    // Refresh list or add optimistically
  } catch (error) {
    toast.error("Failed to create flashcard");
  }
};
```

3. Add FlashcardEditorDialog for creation:

```tsx
<FlashcardEditorDialog
  mode="create"
  isOpen={createDialogOpen}
  onClose={() => setCreateDialogOpen(false)}
  onSave={handleCreate}
/>
```

4. Pass button to PageHeader (see next section)

### 4. Update PageHeader to Accept Action Button ✅ TODO

**File:** `/src/components/flashcards/PageHeader.tsx`

**Changes needed:**

```tsx
interface PageHeaderProps {
  title: string;
  action?: React.ReactNode; // Optional action button/element
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {action && <div>{action}</div>}
    </header>
  );
}
```

**Usage in MyFlashcards:**

```tsx
<PageHeader
  title="My Flashcards"
  action={
    <Button onClick={() => setCreateDialogOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      New Flashcard
    </Button>
  }
/>
```

### 5. Update useFlashcards Hook (if needed) ✅ TODO

**File:** `/src/lib/hooks/flashcards.ts`

**Verify that:**

- `useCreateFlashcard` hook is available and working
- It accepts array of flashcards: `CreateFlashcardCommand[]`
- It properly invalidates/refetches the flashcard list after creation
- Consider adding optimistic updates for better UX

### 6. Future: Generate & Review View

**Note:** The `/review` removal primarily affects future implementation. Current codebase likely doesn't have this route yet since the focus has been on the My Flashcards CRUD functionality.

When implementing `/generate`:

- Show pending candidates from previous sessions at the top
- Show generation form in the middle
- Show newly generated candidates below
- Reuse the same `CandidateList` component for both sections

## Testing Checklist

After implementing the changes:

- [ ] `/flashcards/new` route returns 404
- [ ] "New Flashcard" button appears on `/flashcards`
- [ ] Clicking "New Flashcard" opens a modal with empty form
- [ ] Modal validates front (≤200 chars) and back (≤500 chars)
- [ ] Modal requires non-empty fields for creation
- [ ] Creating a flashcard shows success toast
- [ ] New flashcard appears in the list immediately
- [ ] Modal closes after successful creation
- [ ] Edit functionality still works (opens modal with pre-filled data)
- [ ] Edit modal shows "Edit Flashcard" title and "Save Changes" button
- [ ] Create modal shows "Create Flashcard" title and "Create" button
- [ ] Cancel/close buttons work in both modes
- [ ] Validation errors display correctly in both modes

## Benefits of These Changes

1. **Consistency:** Create and Edit use the same modal pattern
2. **Better UX:** Users maintain context of their flashcard list while creating
3. **Simpler codebase:** One less route and one less page component
4. **Mobile-friendly:** Modal approach works better on small screens than full-page navigation
5. **Faster interaction:** No page reload/navigation required
6. **Follows modern patterns:** Inline creation is standard in apps like Notion, Linear, Todoist

## Migration Notes

- The `CreateFlashcardPage.tsx` component logic can be largely reused in the modal
- The `FlashcardForm` component might still be useful if extracted into the dialog
- Or fold FlashcardForm directly into the FlashcardEditorDialog for simplicity
