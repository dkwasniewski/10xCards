# View Implementation Plan: My Flashcards

## 1. Overview

The My Flashcards view is a CRUD interface that enables authenticated users to browse, search, edit, and delete their saved flashcards. The view displays a paginated list of flashcards with a debounced search input, supports inline editing with validation, bulk selection, and bulk delete operations with confirmation dialogs. Users can filter flashcards by text content in both front and back fields, sort by creation date or alphabetically by front text, and navigate through pages of results. Each flashcard displays a badge indicating its source (manual or AI-generated). Users can select multiple flashcards using checkboxes and delete up to 100 flashcards at once using the bulk delete action.

## 2. View Routing

**Path:** `/flashcards`

**File Location:** `src/pages/flashcards/index.astro`

The route should be protected and require authentication. If the user is not authenticated, they should be redirected to the login page.

## 3. Component Structure

The view follows a hierarchical component structure:

```
MyFlashcardsPage (Astro page with React island)
└── MyFlashcards (React Component)
    ├── PageHeader
    │   └── Title
    ├── SearchBar
    │   └── Input (shadcn/ui)
    ├── BulkActionBar (conditional - shown when items selected)
    │   ├── SelectionCounter (e.g., "3 selected")
    │   ├── BulkDeleteButton
    │   └── ClearSelectionButton
    ├── FlashcardList
    │   ├── ListHeader (conditional - shown when flashcards exist)
    │   │   ├── SelectAllCheckbox
    │   │   └── ColumnHeaders (optional)
    │   ├── EmptyState (conditional)
    │   └── FlashcardRow[] (multiple)
    │       ├── Checkbox (for bulk selection)
    │       ├── Badge (shadcn/ui - source indicator)
    │       ├── FlashcardContent
    │       ├── EditButton (icon)
    │       └── DeleteButton (icon)
    ├── Pagination
    │   └── PaginationControls (shadcn/ui)
    ├── FlashcardEditorDialog (shadcn/ui Dialog)
    │   ├── DialogHeader
    │   ├── FlashcardEditorForm
    │   │   ├── Textarea (front field)
    │   │   ├── CharacterCounter (front)
    │   │   ├── Textarea (back field)
    │   │   └── CharacterCounter (back)
    │   └── DialogFooter (Cancel/Save buttons)
    ├── DeleteConfirmDialog (shadcn/ui AlertDialog)
    │   ├── AlertDialogHeader
    │   ├── AlertDialogDescription
    │   └── AlertDialogFooter (Cancel/Delete buttons)
    └── BulkDeleteConfirmDialog (shadcn/ui AlertDialog)
        ├── AlertDialogHeader
        ├── AlertDialogDescription (shows count)
        └── AlertDialogFooter (Cancel/Delete All buttons)
```

## 4. Component Details

### MyFlashcardsPage (Astro)

**Description:** The main Astro page component that serves as the entry point for the view. It handles server-side authentication checks and renders the React component.

**Main elements:**

- Layout wrapper
- MyFlashcards React component (client:load directive)

**Handled interactions:** None (delegates to React component)

**Handled validation:** Server-side authentication check

**Types:**

- None directly (Astro component)

**Props:** None

**Implementation notes:**

- Check authentication status in Astro component
- Redirect to login if not authenticated
- Pass initial auth state to React component if needed

---

### MyFlashcards (React)

**Description:** The main React container component that manages the state and orchestrates all child components. It uses a custom hook (useFlashcards) to handle data fetching, mutations, and state management. Manages bulk selection state and coordinates bulk delete operations.

**Main elements:**

- `<div>` container with Tailwind classes
- PageHeader component
- SearchBar component
- BulkActionBar component (conditionally rendered when items selected)
- FlashcardList component
- Pagination component
- FlashcardEditorDialog component (conditionally rendered)
- DeleteConfirmDialog component (conditionally rendered)
- BulkDeleteConfirmDialog component (conditionally rendered)
- Toaster (from shadcn/ui sonner) for notifications

**Handled interactions:**

- Triggers search when SearchBar value changes
- Handles selection of individual flashcards (checkbox)
- Handles "Select All" on current page
- Opens editor dialog when edit is clicked
- Opens delete confirmation when delete is clicked (single)
- Opens bulk delete confirmation when bulk delete is clicked
- Handles page changes from Pagination
- Submits edit form
- Confirms deletion (single or bulk)
- Clears selection

**Handled validation:**

- None directly (delegates to child components)
- Enforces bulk delete limit (max 100 items)

**Types:**

- `ListFlashcardsResponseDto`
- `FlashcardDto`
- `EditorState`
- `DeleteConfirmState`
- `BulkDeleteConfirmState`
- `SelectionState`

**Props:** None (root component)

---

### PageHeader

**Description:** Displays the page title and optional action buttons.

**Main elements:**

- `<header>` element
- `<h1>` with page title "My Flashcards"
- Optional action buttons area (for future extensions)

**Handled interactions:** None

**Handled validation:** None

**Types:** None

**Props:**

```typescript
interface PageHeaderProps {
  title: string;
}
```

---

### SearchBar

**Description:** A controlled input component that allows users to search flashcards by text content. Implements debouncing to avoid excessive API calls.

**Main elements:**

- `<div>` container
- `<Input>` component from shadcn/ui
- Search icon
- Clear button (when search has value)

**Handled interactions:**

- `onChange`: Updates local state and triggers debounced callback
- `onClear`: Clears search value

**Handled validation:**

- Maximum length: 100 characters (display warning if approaching limit)

**Types:**

- `search: string`

**Props:**

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number; // default 300
  placeholder?: string;
}
```

**Implementation notes:**

- Use `useDebounce` hook or `useDebouncedCallback` from 'use-debounce' library
- Show character count when approaching 100 characters
- Include visual loading indicator during search

---

### BulkActionBar

**Description:** A floating or fixed action bar that appears when one or more flashcards are selected. Provides bulk operations and displays selection count.

**Main elements:**

- `<div>` container with prominent styling (e.g., fixed bottom bar or floating card)
- Selection counter text (e.g., "3 flashcards selected")
- Bulk delete button (destructive styling)
- Clear selection button or link
- Optional: Select all across pages button (for advanced use)

**Handled interactions:**

- `onBulkDelete`: Opens bulk delete confirmation dialog
- `onClearSelection`: Deselects all items

**Handled validation:**

- None (validation happens at confirmation dialog level)

**Types:**

- `selectedIds: string[]`

**Props:**

```typescript
interface BulkActionBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  maxSelectionReached?: boolean; // true if 100 items selected
}
```

**Implementation notes:**

- Only render when `selectedCount > 0`
- Use fixed positioning at bottom of viewport on mobile
- Use floating card style on desktop
- Show warning if 100 items selected: "Maximum of 100 items can be deleted at once"
- Animate in/out when selection changes
- Use destructive button styling (red) for bulk delete

---

### ListHeader

**Description:** Header row for the flashcard list that includes a "Select All" checkbox and optional column labels.

**Main elements:**

- `<div>` container styled as table header
- Checkbox for "Select All" on current page
- Optional column headers (Source, Front, Back, Actions)

**Handled interactions:**

- `onSelectAll`: Toggles selection of all flashcards on current page

**Handled validation:**

- None

**Types:**

- None specific

**Props:**

```typescript
interface ListHeaderProps {
  isAllSelected: boolean; // true if all items on current page are selected
  isIndeterminate: boolean; // true if some (but not all) are selected
  onSelectAll: (checked: boolean) => void;
  disabled?: boolean; // disable during loading
}
```

**Implementation notes:**

- Only render when flashcards exist
- Checkbox should show indeterminate state when some items selected
- Use semantic HTML (can use `<thead>` if table, or styled div)
- Ensure checkbox is accessible with proper ARIA labels

---

### FlashcardList

**Description:** Container component that renders the list of flashcards or an empty state message when no flashcards are available. Includes list header with "Select All" checkbox when flashcards exist.

**Main elements:**

- `<div>` container
- ListHeader component (conditional, when flashcards exist)
- Loading spinner (conditional)
- EmptyState component (conditional)
- Array of FlashcardRow components

**Handled interactions:**

- Passes through onEdit and onDelete callbacks to rows
- Passes through onToggleSelection callback to rows
- Handles "Select All" from ListHeader

**Handled validation:** None

**Types:**

- `FlashcardDto[]`
- `Set<string>` (selectedIds)

**Props:**

```typescript
interface FlashcardListProps {
  flashcards: FlashcardDto[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
  onToggleSelection: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}
```

**Implementation notes:**

- Derive `isAllSelected` and `isIndeterminate` states from selectedIds and flashcards
- `isAllSelected = flashcards.length > 0 && flashcards.every(f => selectedIds.has(f.id))`
- `isIndeterminate = flashcards.some(f => selectedIds.has(f.id)) && !isAllSelected`

---

### EmptyState

**Description:** Displays a message when no flashcards are found, either because the user has no flashcards or the search returned no results.

**Main elements:**

- `<div>` container with centered content
- Icon (e.g., empty box icon)
- Heading text
- Description text
- Optional action button (e.g., "Create your first flashcard")

**Handled interactions:**

- Optional: Navigate to create flashcard page

**Handled validation:** None

**Types:** None

**Props:**

```typescript
interface EmptyStateProps {
  isSearch: boolean; // true if empty due to search, false if truly empty
  searchQuery?: string;
}
```

---

### FlashcardRow

**Description:** Displays a single flashcard with its content, source badge, and action buttons. Includes a checkbox for bulk selection. Can be expanded to show full content if truncated.

**Main elements:**

- `<div>` container with border and hover effects
- Checkbox (for bulk selection)
- `<Badge>` component showing source (AI/Manual)
- `<div>` for front text
- `<div>` for back text (truncated or expandable)
- `<div>` for action buttons
  - Edit button (icon button)
  - Delete button (icon button)
- Timestamp display (created_at or updated_at)

**Handled interactions:**

- `onCheckboxChange`: Triggered when checkbox is toggled
- `onClick` (on row, excluding checkbox/buttons): Expand/collapse if content is long
- `onEdit`: Triggered when edit button is clicked
- `onDelete`: Triggered when delete button is clicked

**Handled validation:** None

**Types:**

- `FlashcardDto`

**Props:**

```typescript
interface FlashcardRowProps {
  flashcard: FlashcardDto;
  isSelected: boolean;
  onToggleSelection: (id: string, selected: boolean) => void;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}
```

**Implementation notes:**

- Checkbox appears at the start of the row
- Visual highlight when flashcard is selected (e.g., background color change)
- Prevent row expansion when clicking checkbox or action buttons
- Truncate front text at 100 characters with ellipsis
- Truncate back text at 200 characters with ellipsis
- Show "Show more" if content is truncated
- Use different badge colors for AI vs Manual (e.g., blue for AI, gray for Manual)
- Format timestamps relative to current time (e.g., "2 hours ago")
- Checkbox should be accessible with proper ARIA labels

---

### Pagination

**Description:** Displays pagination controls to navigate between pages of flashcards.

**Main elements:**

- `<div>` container
- Previous button
- Page numbers (current page and surrounding pages)
- Next button
- Optional: Page size selector
- Results summary (e.g., "Showing 1-10 of 45")

**Handled interactions:**

- `onPageChange`: Triggered when user clicks page number or prev/next
- `onPageSizeChange`: Triggered when user changes page size (optional)

**Handled validation:**

- Disable Previous button on page 1
- Disable Next button on last page
- Validate page number is within valid range

**Types:**

- `PaginationDto`

**Props:**

```typescript
interface PaginationProps {
  pagination: PaginationDto;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}
```

**Implementation notes:**

- Fixed page size of 10 for this view (as per requirements)
- Calculate total pages from pagination.total
- Show page numbers with ellipsis for large page counts (e.g., 1 ... 5 6 7 ... 20)

---

### FlashcardEditorDialog

**Description:** A modal dialog that allows users to edit the front and back text of a flashcard. Includes validation and character counters.

**Main elements:**

- `<Dialog>` component from shadcn/ui
- `<DialogHeader>` with title "Edit Flashcard"
- `<form>` element
- `<Textarea>` for front field with label and character counter
- `<Textarea>` for back field with label and character counter
- Error messages (conditional, displayed below fields)
- `<DialogFooter>` with Cancel and Save buttons

**Handled interactions:**

- `onChange` for front and back fields: Update local state
- `onSubmit`: Validate and submit form
- `onCancel`: Close dialog without saving

**Handled validation:**

- **Front field:**
  - Maximum 200 characters
  - Display error if exceeded
  - Show character counter (e.g., "150/200")
- **Back field:**
  - Maximum 500 characters
  - Display error if exceeded
  - Show character counter (e.g., "350/500")
- **Form level:**
  - At least one field must be changed from original
  - Display API validation errors if returned

**Types:**

- `FlashcardDto` (original flashcard)
- `UpdateFlashcardCommand` (form data)
- `ValidationErrors` (error state)

**Props:**

```typescript
interface FlashcardEditorDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onClose: () => void;
  onSave: (id: string, command: UpdateFlashcardCommand) => Promise<void>;
}
```

**Implementation notes:**

- Initialize form fields with flashcard values when opened
- Disable Save button when:
  - No changes made
  - Validation errors present
  - Submission in progress
- Show loading spinner on Save button during submission
- Reset form state when dialog closes
- Map API errors to specific fields

---

### DeleteConfirmDialog

**Description:** An alert dialog that asks the user to confirm deletion of a flashcard.

**Main elements:**

- `<AlertDialog>` component from shadcn/ui
- `<AlertDialogHeader>` with title "Delete Flashcard"
- `<AlertDialogDescription>` with warning message and flashcard front text preview
- `<AlertDialogFooter>` with Cancel and Delete buttons

**Handled interactions:**

- `onCancel`: Close dialog without deleting
- `onConfirm`: Proceed with deletion

**Handled validation:** None

**Types:**

- `FlashcardDto` (flashcard to delete)

**Props:**

```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDto | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isDeleting: boolean;
}
```

**Implementation notes:**

- Show flashcard front text in description (truncated if long)
- Disable buttons during deletion
- Show loading spinner on Delete button during deletion
- Use destructive variant for Delete button (red color)

---

### BulkDeleteConfirmDialog

**Description:** An alert dialog that asks the user to confirm bulk deletion of multiple flashcards.

**Main elements:**

- `<AlertDialog>` component from shadcn/ui
- `<AlertDialogHeader>` with title "Delete Multiple Flashcards"
- `<AlertDialogDescription>` with warning message, count, and optional preview of items
- `<AlertDialogFooter>` with Cancel and Delete All buttons

**Handled interactions:**

- `onCancel`: Close dialog without deleting
- `onConfirm`: Proceed with bulk deletion

**Handled validation:**

- None (validation happens before dialog opens)

**Types:**

- `selectedIds: string[]`
- Number count

**Props:**

```typescript
interface BulkDeleteConfirmDialogProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}
```

**Implementation notes:**

- Show count in description (e.g., "Are you sure you want to delete 15 flashcards?")
- Emphasize irreversibility of action
- Optionally show preview of first few flashcard fronts being deleted
- Disable buttons during deletion
- Show loading spinner on Delete All button during deletion
- Use destructive variant for Delete button (red color)
- Use stronger warning language than single delete

---

## 5. Types

### Existing Types (from src/types.ts)

**FlashcardDto**

```typescript
type FlashcardDto = Tables<"flashcards">;
// Fields:
// - id: string (UUID)
// - user_id: string (UUID)
// - front: string (max 200 chars)
// - back: string (max 500 chars)
// - source: 'manual' | 'ai'
// - ai_session_id: string | null (UUID)
// - prompt: string | null
// - created_at: string (ISO timestamp)
// - updated_at: string (ISO timestamp)
// - deleted_at: string | null (ISO timestamp)
```

**ListFlashcardsResponseDto**

```typescript
interface ListFlashcardsResponseDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}
```

**PaginationDto**

```typescript
interface PaginationDto {
  page: number; // Current page number (1-indexed)
  limit: number; // Number of items per page
  total: number; // Total number of items across all pages
}
```

**UpdateFlashcardCommand**

```typescript
type UpdateFlashcardCommand = Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">>;
// Equivalent to:
// interface UpdateFlashcardCommand {
//   front?: string;
//   back?: string;
// }
```

**ValidationErrors** (from src/types.ts)

```typescript
interface ValidationErrors {
  front?: string; // Error message for front field
  back?: string; // Error message for back field
}
```

### New Types (to be added)

**SearchParams** (State management type)

```typescript
interface SearchParams {
  search: string; // Search query (max 100 chars)
  page: number; // Current page (1-indexed)
  limit: number; // Items per page (10 for this view)
  sort: "created_at" | "front"; // Sort field
}
```

**EditorState** (State management type)

```typescript
interface EditorState {
  isOpen: boolean; // Whether dialog is open
  flashcard: FlashcardDto | null; // Flashcard being edited
  front: string; // Current front value in form
  back: string; // Current back value in form
  errors: ValidationErrors; // Field-specific errors
  isSubmitting: boolean; // Whether form is being submitted
}
```

**DeleteConfirmState** (State management type)

```typescript
interface DeleteConfirmState {
  isOpen: boolean; // Whether dialog is open
  flashcard: FlashcardDto | null; // Flashcard to delete
  isDeleting: boolean; // Whether deletion is in progress
}
```

**BulkDeleteConfirmState** (State management type)

```typescript
interface BulkDeleteConfirmState {
  isOpen: boolean; // Whether dialog is open
  isDeleting: boolean; // Whether bulk deletion is in progress
}
```

**SelectionState** (State management type)

```typescript
interface SelectionState {
  selectedIds: Set<string>; // Set of selected flashcard IDs
}
```

**FlashcardsState** (State management type)

```typescript
interface FlashcardsState {
  flashcards: FlashcardDto[]; // Current page of flashcards
  pagination: PaginationDto; // Pagination metadata
  searchParams: SearchParams; // Current search and pagination params
  isLoading: boolean; // Whether data is being fetched
  error: string | null; // Error message if fetch failed
}
```

## 6. State Management

### Custom Hook: useFlashcards

The view uses a custom React hook `useFlashcards` to manage all flashcard-related state and operations. This hook encapsulates the complexity of data fetching, mutations, and state synchronization.

**Location:** `src/lib/hooks/flashcards.ts`

**Purpose:**

- Fetch flashcards with search and pagination
- Handle search query updates with automatic refetch
- Handle pagination with automatic refetch
- Update flashcards
- Delete single flashcard
- Delete multiple flashcards in bulk
- Manage loading and error states

**Hook Interface:**

```typescript
interface UseFlashcardsResult {
  // Data state
  flashcards: FlashcardDto[];
  pagination: PaginationDto;
  isLoading: boolean;
  error: string | null;

  // Search and pagination
  searchParams: SearchParams;
  updateSearch: (search: string) => void;
  updatePage: (page: number) => void;

  // Mutations
  updateFlashcard: (id: string, command: UpdateFlashcardCommand) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  bulkDeleteFlashcards: (ids: string[]) => Promise<void>;

  // Utility
  refetch: () => Promise<void>;
}

function useFlashcards(): UseFlashcardsResult;
```

**Internal State:**

```typescript
const [state, setState] = useState<FlashcardsState>({
  flashcards: [],
  pagination: { page: 1, limit: 10, total: 0 },
  searchParams: {
    search: "",
    page: 1,
    limit: 10,
    sort: "created_at",
  },
  isLoading: false,
  error: null,
});
```

**Key Behaviors:**

1. **Initial Load:** Fetch flashcards on mount
2. **Search Updates:** When search changes, reset to page 1 and refetch
3. **Page Updates:** When page changes, refetch with new page
4. **Mutations:** After successful update/delete, refetch the current page
5. **Error Handling:** Set error state on API failures
6. **Debouncing:** Search is debounced externally by SearchBar component

**Implementation Notes:**

- Use `useEffect` to fetch data when searchParams change
- Use `useCallback` for mutation functions to prevent unnecessary re-renders
- Consider using React Query or SWR for more advanced caching and revalidation (optional enhancement)

### Component-Level State

**MyFlashcards Component:**

```typescript
// Selection state
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// Editor state
const [editorState, setEditorState] = useState<EditorState>({
  isOpen: false,
  flashcard: null,
  front: "",
  back: "",
  errors: {},
  isSubmitting: false,
});

// Single delete confirmation state
const [deleteState, setDeleteState] = useState<DeleteConfirmState>({
  isOpen: false,
  flashcard: null,
  isDeleting: false,
});

// Bulk delete confirmation state
const [bulkDeleteState, setBulkDeleteState] = useState<BulkDeleteConfirmState>({
  isOpen: false,
  isDeleting: false,
});

// Flashcards data (from hook)
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
```

**Selection Management:**

```typescript
// Clear selection when page changes
useEffect(() => {
  setSelectedIds(new Set());
}, [pagination.page]);

// Toggle single flashcard selection
const handleToggleSelection = (id: string, selected: boolean) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (selected) {
      next.add(id);
    } else {
      next.delete(id);
    }
    return next;
  });
};

// Select/deselect all on current page
const handleSelectAll = (selected: boolean) => {
  if (selected) {
    setSelectedIds(new Set(flashcards.map((f) => f.id)));
  } else {
    setSelectedIds(new Set());
  }
};

// Clear selection
const handleClearSelection = () => {
  setSelectedIds(new Set());
};
```

**SearchBar Component:**

```typescript
// Local input value (not debounced)
const [localValue, setLocalValue] = useState(value);

// Debounced callback
const debouncedOnChange = useDebouncedCallback((value: string) => onChange(value), debounceMs);
```

## 7. API Integration

### Endpoint: GET /api/flashcards

**Purpose:** Fetch paginated list of flashcards with optional search

**Request:**

```typescript
// URL: /api/flashcards?search={search}&page={page}&limit={limit}&sort={sort}
// Method: GET
// Headers: None required (session in cookie)
// Query Parameters:
interface QueryParams {
  search?: string; // Optional search query
  page?: number; // Page number (default 1)
  limit?: number; // Items per page (default 20, use 10)
  sort?: "created_at" | "front"; // Sort field (default 'created_at')
}
```

**Response:**

```typescript
// Status: 200 OK
// Body: ListFlashcardsResponseDto
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "front": "Question text",
      "back": "Answer text",
      "source": "ai",
      "ai_session_id": "uuid",
      "prompt": "Original prompt",
      "created_at": "2025-11-18T12:00:00Z",
      "updated_at": "2025-11-18T12:00:00Z",
      "deleted_at": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}
```

**Error Responses:**

- 400: Invalid query parameters
- 401: Unauthorized (not authenticated)
- 500: Server error

**Implementation:**

```typescript
async function fetchFlashcards(params: SearchParams): Promise<ListFlashcardsResponseDto> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    sort: params.sort,
  });

  if (params.search) {
    queryParams.append("search", params.search);
  }

  const response = await fetch(`/api/flashcards?${queryParams.toString()}`);

  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch flashcards");
  }

  return await response.json();
}
```

---

### Endpoint: PATCH /api/flashcards/{id}

**Purpose:** Update flashcard front and/or back text

**Request:**

```typescript
// URL: /api/flashcards/{id}
// Method: PATCH
// Headers: Content-Type: application/json
// Body: UpdateFlashcardCommand
{
  "front": "Updated front text",  // Optional
  "back": "Updated back text"     // Optional
}
```

**Response:**

```typescript
// Status: 200 OK
// Body: FlashcardDto (updated flashcard)
{
  "id": "uuid",
  "user_id": "uuid",
  "front": "Updated front text",
  "back": "Updated back text",
  "source": "manual",
  "ai_session_id": null,
  "prompt": null,
  "created_at": "2025-11-18T12:00:00Z",
  "updated_at": "2025-11-18T12:30:00Z",
  "deleted_at": null
}
```

**Error Responses:**

- 400: Validation error (e.g., character limits exceeded)
- 404: Flashcard not found
- 401: Unauthorized

**Implementation:**

```typescript
async function updateFlashcard(id: string, command: UpdateFlashcardCommand): Promise<FlashcardDto> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json();
      throw new ValidationError(error.message, error.errors);
    }
    if (response.status === 404) {
      throw new Error("Flashcard not found");
    }
    throw new Error("Failed to update flashcard");
  }

  return await response.json();
}
```

---

### Endpoint: DELETE /api/flashcards/{id}

**Purpose:** Soft-delete a single flashcard

**Request:**

```typescript
// URL: /api/flashcards/{id}
// Method: DELETE
// Headers: None required
// Body: None
```

**Response:**

```typescript
// Status: 204 No Content
// Body: None
```

**Error Responses:**

- 404: Flashcard not found
- 401: Unauthorized

**Implementation:**

```typescript
async function deleteFlashcard(id: string): Promise<void> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Flashcard not found");
    }
    throw new Error("Failed to delete flashcard");
  }
}
```

---

### Endpoint: DELETE /api/flashcards (Bulk)

**Purpose:** Soft-delete multiple flashcards in bulk (up to 100 at once)

**Request:**

```typescript
// URL: /api/flashcards
// Method: DELETE
// Headers: Content-Type: application/json
// Body: BulkDeleteFlashcardsCommand
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]  // Array of flashcard UUIDs (1-100)
}
```

**Response:**

```typescript
// Status: 204 No Content
// Body: None
```

**Error Responses:**

- 400: Validation error (e.g., empty array, more than 100 IDs, invalid UUIDs)
- 404: No flashcards found to delete (all IDs invalid or already deleted)
- 401: Unauthorized

**Implementation:**

```typescript
async function bulkDeleteFlashcards(ids: string[]): Promise<void> {
  const response = await fetch("/api/flashcards", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json();
      throw new ValidationError(error.message, error.errors);
    }
    if (response.status === 404) {
      throw new Error("No flashcards found to delete");
    }
    throw new Error("Failed to delete flashcards");
  }
}
```

**Validation Rules:**

- Minimum 1 ID required
- Maximum 100 IDs allowed
- All IDs must be valid UUIDs
- Only flashcards belonging to the user will be deleted
- Already deleted flashcards are silently skipped

## 8. User Interactions

### 1. Searching Flashcards

**User Action:** Types text into search input

**Flow:**

1. User focuses search input
2. User types search query
3. SearchBar updates local state immediately (for instant feedback)
4. After 300ms of no typing (debounce), SearchBar calls `onChange` callback
5. MyFlashcards receives search update via `updateSearch` from hook
6. Hook resets page to 1 and updates searchParams
7. useEffect detects searchParams change and triggers API call
8. Loading state is set to true
9. API returns results
10. Flashcards list is updated
11. Loading state is set to false
12. If results are empty, EmptyState is shown

**Edge Cases:**

- Empty search: Show all flashcards
- No results: Show "No flashcards found" empty state
- API error: Show error toast, maintain current flashcards

**Visual Feedback:**

- Show loading spinner or skeleton during fetch
- Highlight search terms in results (optional enhancement)
- Show result count (e.g., "45 flashcards")

---

### 2. Editing a Flashcard

**User Action:** Clicks edit button on flashcard row

**Flow:**

1. User clicks edit icon button on FlashcardRow
2. Row calls `onEdit(flashcard)` callback
3. MyFlashcards opens editor dialog:
   - Sets `editorState.isOpen = true`
   - Sets `editorState.flashcard = flashcard`
   - Initializes form fields with flashcard values
4. Dialog appears with pre-filled form
5. User modifies front and/or back text
6. Character counters update in real-time
7. Validation errors appear if limits exceeded
8. User clicks Save button
9. Form validation runs:
   - Check character limits
   - Check at least one field changed
10. If validation passes:
    - Disable form and show loading
    - Call `updateFlashcard` from hook
    - Hook calls PATCH API endpoint
11. On success:
    - Close dialog
    - Show success toast
    - Refetch flashcards to get updated data
12. On error:
    - Show error message in dialog
    - Keep dialog open for retry
    - Enable form again

**Edge Cases:**

- No changes made: Disable Save button
- Character limit exceeded: Show error, disable Save
- API validation error: Map to specific fields
- Flashcard deleted by another session: Show 404 error
- Network error: Show error toast, allow retry

**Visual Feedback:**

- Disable Save button when invalid or unchanged
- Show loading spinner on Save button
- Show character counter (e.g., "150/200")
- Character counter turns red when approaching/exceeding limit
- Show success toast with message "Flashcard updated"

---

### 3. Deleting a Flashcard

**User Action:** Clicks delete button on flashcard row

**Flow:**

1. User clicks delete icon button on FlashcardRow
2. Row calls `onDelete(flashcard)` callback
3. MyFlashcards opens confirmation dialog:
   - Sets `deleteState.isOpen = true`
   - Sets `deleteState.flashcard = flashcard`
4. Dialog appears with warning message and flashcard preview
5. User reviews and clicks Delete button (or Cancel)
6. If Delete clicked:
   - Disable buttons and show loading
   - Call `deleteFlashcard` from hook
   - Hook calls DELETE API endpoint
7. On success:
   - Close dialog
   - Show success toast
   - Refetch flashcards
   - If current page becomes empty and not page 1, go to previous page
8. On error:
   - Show error toast
   - Close dialog

**Edge Cases:**

- Flashcard already deleted: Show 404 error
- Last item on page > 1: Navigate to previous page after deletion
- Network error: Show error toast, keep flashcard visible

**Visual Feedback:**

- Show loading spinner on Delete button
- Use destructive/danger styling (red) for Delete button
- Show success toast with message "Flashcard deleted"
- Optionally show undo option in toast (advanced feature)

---

### 4. Paginating Through Flashcards

**User Action:** Clicks page number or next/previous button

**Flow:**

1. User clicks pagination control (e.g., "Next" or page number "2")
2. Pagination component calls `onPageChange(newPage)` callback
3. MyFlashcards receives page update via `updatePage` from hook
4. Hook updates searchParams.page
5. useEffect detects change and triggers API call
6. Loading state is set to true
7. Scroll to top of list (smooth scroll)
8. API returns new page of results
9. Flashcards list is updated
10. Loading state is set to false
11. Pagination controls update (disable/enable buttons, highlight current page)

**Edge Cases:**

- Page 1: Disable Previous button
- Last page: Disable Next button
- Invalid page number: Clamp to valid range
- Empty page (after deletion): Navigate to previous page

**Visual Feedback:**

- Highlight current page number
- Disable Previous/Next when at boundaries
- Show loading indicator during fetch
- Smooth scroll to top of list

---

### 5. Viewing Empty States

**Scenarios:**

**A. No Flashcards Created Yet**

- Show: "You haven't created any flashcards yet"
- Action button: "Create your first flashcard" (opens creation modal)

**B. Search Returns No Results**

- Show: "No flashcards found for '{search query}'"
- Suggestion: "Try a different search term"
- Action button: "Clear search"

**C. Loading State**

- Show: Skeleton loaders or spinner
- Message: "Loading flashcards..."

**D. Error State**

- Show: Error message
- Action button: "Try again" (triggers refetch)

---

### 6. Selecting Flashcards

**User Action:** Clicks checkbox on flashcard row or "Select All"

**Flow (Individual Selection):**

1. User clicks checkbox on FlashcardRow
2. Row calls `onToggleSelection(id, checked)` callback
3. MyFlashcards updates selectedIds Set
4. Row visual appearance changes (highlight background)
5. BulkActionBar appears at bottom with selection count
6. User can continue selecting more items

**Flow (Select All):**

1. User clicks "Select All" checkbox in ListHeader
2. If unchecked, all flashcards on current page are selected
3. If checked, all selections are cleared
4. BulkActionBar updates with new count
5. ListHeader checkbox shows indeterminate state if some (but not all) selected

**Edge Cases:**

- Changing pages automatically clears selection
- Maximum 100 items can be selected (show warning if user tries to exceed)
- Search or filter changes clear selection
- Empty list has no checkboxes

**Visual Feedback:**

- Selected rows have highlighted background (e.g., light blue)
- Selection count shown in BulkActionBar (e.g., "15 selected")
- "Select All" checkbox shows indeterminate state when partial selection
- Smooth animation when BulkActionBar appears/disappears

---

### 7. Bulk Deleting Flashcards

**User Action:** Clicks "Delete Selected" button in BulkActionBar

**Flow:**

1. User selects multiple flashcards (1-100)
2. BulkActionBar appears with "Delete Selected" button
3. User clicks "Delete Selected"
4. BulkDeleteConfirmDialog opens showing:
   - Count of items to delete
   - Warning message
   - Optional preview of first few items
5. User reviews and clicks "Delete All" (or Cancel)
6. If Delete All clicked:
   - Disable buttons and show loading
   - Call `bulkDeleteFlashcards` from hook with array of selected IDs
   - Hook calls DELETE /api/flashcards endpoint
7. On success:
   - Close dialog
   - Clear selection (setSelectedIds to empty Set)
   - Show success toast (e.g., "15 flashcards deleted")
   - Refetch flashcards
   - If current page becomes empty and not page 1, navigate to previous page
   - BulkActionBar disappears
8. On error:
   - Show error toast
   - Close dialog
   - Keep selection intact for retry

**Edge Cases:**

- Some IDs invalid or already deleted: API returns count of actually deleted
- All IDs invalid: Show 404 error
- More than 100 selected: Prevent submission, show error
- Network error: Show error toast, keep selection
- Last items on page deleted: Navigate to previous page if page > 1

**Visual Feedback:**

- Confirmation dialog uses destructive styling (red)
- Loading spinner on "Delete All" button
- Success toast with count (e.g., "15 flashcards deleted")
- Error toast if operation fails
- Smooth transition when BulkActionBar disappears
- Show warning if trying to select more than 100 items

**Validation:**

- Client-side: Ensure 1-100 IDs before API call
- Show error if no items selected (button should be disabled)
- Show warning if attempting to select more than 100

---

### 8. Clearing Selection

**User Action:** Clicks "Clear Selection" in BulkActionBar or changes page

**Flow:**

1. User clicks "Clear Selection" button/link
2. OR user navigates to different page
3. OR user performs a new search
4. selectedIds Set is cleared
5. All row highlights are removed
6. BulkActionBar disappears with animation
7. ListHeader "Select All" checkbox becomes unchecked

**Visual Feedback:**

- Smooth fade-out of BulkActionBar
- Instant removal of row highlights
- No loading state needed (immediate action)

## 9. Conditions and Validation

### Frontend Validation

#### SearchBar Component

**Condition:** Search query length

- **Rule:** Maximum 100 characters
- **Validation:** Show warning when approaching limit (e.g., at 90 chars)
- **Effect:** Don't prevent input, but warn user
- **Error Message:** "Search is limited to 100 characters"

---

#### FlashcardEditorDialog Component

**Condition 1:** Front field length

- **Rule:** Maximum 200 characters
- **Validation:** Check on every keystroke
- **Effect:**
  - Show character counter (e.g., "150/200")
  - Counter turns orange at 180 characters
  - Counter turns red at 200+ characters
  - Show error message if exceeded
  - Disable Save button if exceeded
- **Error Message:** "Front text must be 200 characters or less"

**Condition 2:** Back field length

- **Rule:** Maximum 500 characters
- **Validation:** Check on every keystroke
- **Effect:**
  - Show character counter (e.g., "350/500")
  - Counter turns orange at 450 characters
  - Counter turns red at 500+ characters
  - Show error message if exceeded
  - Disable Save button if exceeded
- **Error Message:** "Back text must be 500 characters or less"

**Condition 3:** Form changes

- **Rule:** At least one field must be different from original
- **Validation:** Compare current values with original flashcard
- **Effect:** Disable Save button if no changes made
- **Error Message:** None (implicit through disabled button)

**Condition 4:** Form completeness

- **Rule:** At least one of front or back must be provided (per API)
- **Validation:** Not applicable in edit mode (both always have values)
- **Effect:** N/A
- **Error Message:** N/A

---

#### Pagination Component

**Condition 1:** Previous button

- **Rule:** Disabled on page 1
- **Validation:** Check if `pagination.page === 1`
- **Effect:** Disable button, gray out, no cursor pointer
- **Error Message:** None

**Condition 2:** Next button

- **Rule:** Disabled on last page
- **Validation:** Check if `pagination.page >= Math.ceil(pagination.total / pagination.limit)`
- **Effect:** Disable button, gray out, no cursor pointer
- **Error Message:** None

**Condition 3:** Page number validity

- **Rule:** Page must be between 1 and last page
- **Validation:** Clamp value before API call
- **Effect:** Prevent invalid API calls
- **Error Message:** None (automatic correction)

---

#### BulkActionBar Component

**Condition 1:** Maximum selection limit

- **Rule:** Maximum 100 flashcards can be selected
- **Validation:** Check selectedIds.size before allowing additional selections
- **Effect:**
  - Disable checkboxes when limit reached
  - Show warning message in BulkActionBar
  - Prevent "Select All" if it would exceed 100
- **Error Message:** "Maximum of 100 flashcards can be selected at once"

**Condition 2:** Minimum selection for bulk delete

- **Rule:** At least 1 flashcard must be selected
- **Validation:** Check selectedIds.size > 0
- **Effect:** Disable "Delete Selected" button if no selection
- **Error Message:** None (button disabled)

**Condition 3:** Valid UUID format

- **Rule:** All selected IDs must be valid UUIDs (enforced by backend)
- **Validation:** Client trusts IDs from API response
- **Effect:** N/A (guaranteed by data source)
- **Error Message:** N/A

---

#### BulkDeleteConfirmDialog Component

**Condition 1:** Selection count display

- **Rule:** Show accurate count of items to be deleted
- **Validation:** Count selectedIds.size
- **Effect:** Display in dialog description
- **Error Message:** None

**Condition 2:** Deletion limit

- **Rule:** Cannot delete more than 100 at once
- **Validation:** Check before opening dialog
- **Effect:** Should never reach dialog if > 100 (prevented earlier)
- **Error Message:** "Cannot delete more than 100 flashcards at once"

---

### API Validation

The API will also validate requests and may return errors that need to be handled:

**400 Bad Request:**

- Invalid query parameters (GET)
- Validation errors (PATCH)
- Map errors to specific fields if possible
- Show generic error message if field mapping fails

**404 Not Found:**

- Flashcard doesn't exist or was deleted
- Show error toast: "Flashcard not found"
- Refresh list to sync state

**401 Unauthorized:**

- Session expired
- Redirect to login page
- Optionally show message: "Your session has expired. Please log in again."

**500 Server Error:**

- Unexpected server error
- Show error toast: "Something went wrong. Please try again."
- Log error for debugging

## 10. Error Handling

### Network Errors

**Scenario:** API request fails due to network issues

**Handling:**

1. Catch error in hook or component
2. Set error state
3. Show error toast with message: "Failed to connect. Please check your internet connection."
4. Provide retry button
5. Maintain current state (don't clear flashcards)

**Implementation:**

```typescript
try {
  const result = await fetchFlashcards(searchParams);
  setState((prev) => ({ ...prev, flashcards: result.data, pagination: result.pagination }));
} catch (error) {
  console.error("Failed to fetch flashcards:", error);
  toast.error("Failed to load flashcards. Please try again.");
  setState((prev) => ({ ...prev, error: error.message }));
}
```

---

### Validation Errors

**Scenario:** API returns 400 with validation errors

**Handling:**

1. Parse error response
2. Map errors to form fields
3. Display field-specific error messages
4. Keep form open for correction
5. Enable retry

**Implementation:**

```typescript
catch (error) {
  if (error instanceof ValidationError) {
    // Map API errors to form fields
    setEditorState(prev => ({
      ...prev,
      errors: {
        front: error.errors.find(e => e.path === 'front')?.message,
        back: error.errors.find(e => e.path === 'back')?.message
      },
      isSubmitting: false
    }));
  } else {
    toast.error('Failed to update flashcard');
  }
}
```

---

### 404 Errors (Not Found)

**Scenario:** Flashcard was deleted or doesn't exist

**Handling:**

1. Show error toast: "Flashcard not found. It may have been deleted."
2. Close any open dialogs
3. Refresh flashcard list
4. Remove stale item from local state

---

### Empty Results

**Scenario:** No flashcards match search or user has no flashcards

**Handling:**

1. Check if empty due to search or genuinely empty
2. Show appropriate EmptyState component
3. Provide clear next action

---

### Deletion of Last Item on Page

**Scenario:** User deletes the last flashcard on a page > 1

**Handling:**

1. After successful deletion, check if page is now empty
2. If current page > 1 and flashcards array is empty after refetch
3. Automatically navigate to previous page
4. Show success toast

**Implementation:**

```typescript
async function handleDeleteConfirm(id: string) {
  await deleteFlashcard(id);
  await refetch();

  // Check if page is now empty and we're not on page 1
  if (flashcards.length === 0 && pagination.page > 1) {
    updatePage(pagination.page - 1);
  }

  toast.success("Flashcard deleted");
}
```

---

### Session Expiration

**Scenario:** User's authentication session expires

**Handling:**

1. Detect 401 response from API
2. Clear local session data
3. Show toast: "Your session has expired. Please log in again."
4. Redirect to login page with return URL

---

### Concurrent Modifications

**Scenario:** Flashcard is modified or deleted by another session/tab

**Handling:**

1. On 404 error, assume flashcard was deleted elsewhere
2. Show message: "This flashcard was modified or deleted in another session"
3. Refresh list to sync state
4. Don't show stale data

---

### Form Abandonment

**Scenario:** User closes editor dialog with unsaved changes

**Handling:**

1. Track if form is dirty (has changes)
2. If dirty and user clicks Cancel or close, show confirmation
3. Confirmation: "You have unsaved changes. Discard them?"
4. Options: "Discard" or "Keep Editing"

## 11. Implementation Steps

### Step 1: Set Up Project Structure

1. Create directory structure:

   ```
   src/pages/flashcards/index.astro
   src/components/flashcards/MyFlashcards.tsx
   src/components/flashcards/PageHeader.tsx
   src/components/flashcards/SearchBar.tsx
   src/components/flashcards/BulkActionBar.tsx
   src/components/flashcards/ListHeader.tsx
   src/components/flashcards/FlashcardList.tsx
   src/components/flashcards/FlashcardRow.tsx
   src/components/flashcards/EmptyState.tsx
   src/components/flashcards/Pagination.tsx
   src/components/flashcards/FlashcardEditorDialog.tsx
   src/components/flashcards/DeleteConfirmDialog.tsx
   src/components/flashcards/BulkDeleteConfirmDialog.tsx
   ```

2. Create custom hook file:

   ```
   src/lib/hooks/flashcards.ts
   ```

3. Add types to existing type files (or create new ones if needed)

---

### Step 2: Define Types

1. Open `src/types.ts`
2. Add new types as defined in section 5:
   - `SearchParams`
   - `EditorState`
   - `DeleteConfirmState`
   - `BulkDeleteConfirmState`
   - `SelectionState`
   - `FlashcardsState`

---

### Step 3: Create Custom Hook (useFlashcards)

1. Implement `src/lib/hooks/flashcards.ts`
2. Set up state management with `useState`
3. Implement fetch function using GET /api/flashcards
4. Implement update function using PATCH /api/flashcards/{id}
5. Implement single delete function using DELETE /api/flashcards/{id}
6. Implement bulk delete function using DELETE /api/flashcards (with body)
7. Add `useEffect` to fetch data on searchParams changes
8. Implement `updateSearch` to reset page and update search
9. Implement `updatePage` to change page
10. Add error handling for all operations
11. Export hook with typed return value

---

### Step 4: Create Presentational Components

**4.1 PageHeader Component**

1. Create basic header with title
2. Style with Tailwind
3. Export with typed props

**4.2 EmptyState Component**

1. Create layout with icon, heading, description
2. Handle two states: genuinely empty vs. no search results
3. Add action button (optional)
4. Style with Tailwind

**4.3 BulkActionBar Component**

1. Create floating/fixed bar component
2. Add selection counter display
3. Add "Delete Selected" button with destructive styling
4. Add "Clear Selection" button or link
5. Show warning if 100 items selected
6. Add animation for appearing/disappearing
7. Only render when selectedCount > 0
8. Style with Tailwind (fixed position on mobile, floating on desktop)

**4.4 ListHeader Component**

1. Create header row component
2. Add "Select All" checkbox
3. Support indeterminate state for checkbox
4. Optional: Add column labels
5. Handle select all toggle
6. Style with Tailwind
7. Only render when flashcards exist

**4.5 FlashcardRow Component**

1. Add checkbox at start of row
2. Create layout with flashcard content
3. Add source badge (AI/Manual) with different colors
4. Add edit and delete icon buttons
5. Implement text truncation with "Show more"
6. Format timestamps (use date-fns or similar)
7. Add hover effects
8. Add visual highlight when selected (background color)
9. Handle click events for checkbox, edit, and delete
10. Prevent row expansion when clicking checkbox or buttons
11. Style with Tailwind

**4.6 FlashcardList Component**

1. Create container component
2. Add ListHeader component (conditionally rendered)
3. Handle loading state (show skeleton or spinner)
4. Handle empty state (render EmptyState)
5. Map flashcards to FlashcardRow components
6. Pass through callbacks (including selection callbacks)
7. Derive isAllSelected and isIndeterminate states
8. Style with Tailwind

**4.7 Pagination Component**

1. Calculate total pages from pagination data
2. Create Previous button (disabled on page 1)
3. Create page number buttons (with ellipsis for many pages)
4. Create Next button (disabled on last page)
5. Add results summary text
6. Handle page change events
7. Style with Tailwind
8. Consider using shadcn/ui Pagination component if available

---

### Step 5: Create SearchBar Component

1. Create controlled input using shadcn/ui Input
2. Add search icon
3. Implement local state for immediate updates
4. Install and set up `use-debounce` library (or implement custom debounce)
5. Implement debounced callback (300ms)
6. Add clear button when input has value
7. Add character counter (show when approaching 100 chars)
8. Style with Tailwind

---

### Step 6: Create FlashcardEditorDialog Component

1. Use shadcn/ui Dialog component
2. Set up form with two Textarea fields (front and back)
3. Implement controlled inputs
4. Add character counters for both fields
5. Implement real-time validation:
   - Check character limits
   - Check if changes made
6. Display error messages below fields
7. Implement Save button (disabled when invalid or unchanged)
8. Implement Cancel button
9. Show loading state during submission
10. Handle form submission with error handling
11. Reset form when dialog closes
12. Style with Tailwind

---

### Step 7: Create DeleteConfirmDialog Component

1. Use shadcn/ui AlertDialog component
2. Display warning message
3. Show flashcard front text preview (truncated)
4. Implement Cancel and Delete buttons
5. Use destructive styling for Delete button
6. Show loading state during deletion
7. Handle confirmation with error handling
8. Style with Tailwind

---

### Step 7b: Create BulkDeleteConfirmDialog Component

1. Use shadcn/ui AlertDialog component
2. Display warning message with count of items
3. Show count in description (e.g., "Are you sure you want to delete 15 flashcards?")
4. Optional: Show preview of first few flashcard fronts
5. Implement Cancel and Delete All buttons
6. Use destructive styling for Delete All button
7. Show loading state during deletion
8. Handle confirmation with error handling
9. Style with Tailwind with stronger warning visuals

---

### Step 8: Create Main MyFlashcards Component

1. Set up component with useFlashcards hook
2. Set up selection state with useState (Set<string>)
3. Set up editor state with useState
4. Set up single delete confirmation state with useState
5. Set up bulk delete confirmation state with useState
6. Implement handler functions:
   - `handleSearch`: calls updateSearch from hook
   - `handlePageChange`: calls updatePage from hook, clears selection
   - `handleToggleSelection`: toggles individual flashcard selection
   - `handleSelectAll`: selects/deselects all on current page
   - `handleClearSelection`: clears all selections
   - `handleEditClick`: opens editor dialog
   - `handleEditSave`: submits update and refetches
   - `handleEditCancel`: closes editor dialog
   - `handleDeleteClick`: opens single delete confirmation dialog
   - `handleDeleteConfirm`: submits single deletion and refetches
   - `handleDeleteCancel`: closes confirmation dialog
   - `handleBulkDeleteClick`: opens bulk delete confirmation dialog
   - `handleBulkDeleteConfirm`: submits bulk deletion, clears selection, refetches
   - `handleBulkDeleteCancel`: closes bulk confirmation dialog
7. Add useEffect to clear selection when page changes
8. Render all child components with proper props (including selection props)
9. Add Toaster component from shadcn/ui
10. Handle loading and error states
11. Style container with Tailwind

---

### Step 9: Create Astro Page

1. Create `src/pages/flashcards/index.astro`
2. Import Layout component
3. Add authentication check (get session from locals)
4. Redirect to login if not authenticated
5. Import MyFlashcards React component
6. Render MyFlashcards with `client:load` directive
7. Add page title and meta tags

---

### Step 10: Install Dependencies

1. Install debounce library:

   ```bash
   npm install use-debounce
   ```

2. Install date formatting library (if not already present):

   ```bash
   npm install date-fns
   ```

3. Ensure shadcn/ui components are installed:
   - Input
   - Textarea
   - Button
   - Checkbox
   - Dialog
   - AlertDialog
   - Badge
   - Toaster (Sonner)

---

### Step 11: Style Components

1. Apply consistent spacing and layout with Tailwind
2. Use design tokens from Tailwind config
3. Ensure responsive design (mobile-first)
4. Add hover and focus states
5. Implement loading skeletons
6. Test dark mode if supported
7. Ensure accessibility (ARIA labels, keyboard navigation)

---

### Step 12: Test Implementation

**Unit Tests (Optional):**

1. Test useFlashcards hook
2. Test validation functions
3. Test utility functions

**Manual Testing:**

1. Test search functionality with debouncing
2. Test pagination (all pages, edge cases)
3. Test editing flashcards (validation, submission, errors)
4. Test deleting single flashcard (confirmation, success, errors)
5. Test bulk selection:
   - Select individual flashcards with checkboxes
   - Select all on current page
   - Deselect individual items
   - Deselect all
   - Selection clears when changing pages
   - Selection clears when searching
6. Test bulk delete:
   - Delete multiple flashcards (2-10 items)
   - Delete many flashcards (50+ items)
   - Try to select more than 100 (should show warning)
   - Bulk delete confirmation dialog
   - Success and error scenarios
7. Test empty states (no flashcards, no search results)
8. Test error scenarios (network errors, 404s, validation errors)
9. Test loading states
10. Test responsive design on mobile (especially BulkActionBar)
11. Test keyboard navigation (including checkboxes)
12. Test screen reader compatibility (checkbox labels, selection announcements)

**Edge Cases to Test:**

1. Delete last item on page > 1
2. Bulk delete all items on page > 1
3. Search returns no results
4. Navigate to invalid page number
5. Edit flashcard that was deleted
6. Session expires during operation
7. Network disconnection during API call
8. Rapid search queries (debouncing)
9. Character limit boundaries (exactly 200/500 chars)
10. Select items, change page, come back (selection should be cleared)
11. Bulk delete with some invalid IDs
12. Try to bulk delete with 0 items selected (button should be disabled)
13. Try to select 101st item (should show warning)
14. BulkActionBar appearance/disappearance animations

---

### Step 13: Polish and Optimize

1. Add smooth transitions and animations
2. Optimize re-renders (use React.memo if needed)
3. Add loading skeletons instead of spinners
4. Implement optimistic updates (optional)
5. Add keyboard shortcuts (optional):
   - `/` to focus search
   - `Escape` to close dialogs
6. Improve error messages
7. Add success animations
8. Consider adding undo functionality for deletions (toast action)

---

### Step 14: Documentation

1. Add JSDoc comments to components and functions
2. Document prop interfaces
3. Add usage examples in comments
4. Document any gotchas or important notes

---

### Step 15: Final Review

1. Verify all user stories are implemented (US-006, US-007)
2. Check all requirements from PRD
3. Verify all API integrations work correctly
4. Confirm validation matches API requirements
5. Test all user interactions
6. Review code for consistency and best practices
7. Check for any console errors or warnings
8. Verify TypeScript types are correct
9. Test in production build
10. Get code review from team

---

## Additional Considerations

### Performance Optimizations

1. **Debounced Search:** Already implemented to reduce API calls
2. **Pagination:** Limits data fetched per request
3. **Memoization:** Use `React.memo` for FlashcardRow to prevent unnecessary re-renders
4. **Virtual Scrolling:** Consider for very long lists (optional, not required for 10 items per page)

### Accessibility

1. **Semantic HTML:** Use appropriate elements (button, input, etc.)
2. **ARIA Labels:** Add labels for icon buttons
3. **Keyboard Navigation:** Ensure all interactive elements are keyboard accessible
4. **Focus Management:** Move focus appropriately when opening/closing dialogs
5. **Screen Reader Support:** Test with screen reader

### Future Enhancements

1. **Cross-Page Selection:** Allow selecting flashcards across multiple pages (currently limited to current page)
2. **Sorting Options:** Add dropdown to sort by different fields (currently only created_at or front)
3. **Filtering:** Filter by source (manual/ai), date range, etc.
4. **Export:** Export flashcards to CSV or JSON
5. **Import:** Import flashcards from file
6. **Drag and Drop:** Reorder flashcards
7. **Tags:** Add tags to flashcards for organization
8. **Favorites:** Mark flashcards as favorites
9. **Search Highlighting:** Highlight search terms in results
10. **Undo Deletion:** Add undo button in toast after deletion (single and bulk)
11. **Bulk Edit:** Edit multiple flashcards at once
12. **Select All Across Pages:** Button to select all flashcards matching current search (with limits)

---

## Summary

This implementation plan provides a comprehensive guide for building the My Flashcards view with full CRUD functionality and bulk operations. The view is structured around a custom hook (`useFlashcards`) that manages all data fetching and mutations, with presentational components handling the UI. Users can browse, search, edit, and delete flashcards individually, or select multiple flashcards (up to 100) for bulk deletion. The plan follows React best practices, uses TypeScript for type safety, and integrates with the existing API endpoints. All user stories (US-006, US-007) are addressed with proper validation, error handling, and user feedback. The bulk selection and deletion features enhance productivity by allowing users to efficiently manage large numbers of flashcards.
