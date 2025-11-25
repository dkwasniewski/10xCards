# View Implementation Plan – Generate & Review (`/generate`)

## 1. Overview

The **Generate & Review** view allows authenticated users to:

1. Review all _pending_ AI-generated flashcard candidates left over from previous sessions.
2. Paste new source text (1 000 – 10 000 chars), pick an LLM model, and request fresh AI candidates.
3. Review the newly generated candidates in the same UI.
4. Perform **bulk Accept / Edit / Reject** actions on any selected candidates (pending or new) with optimistic UI feedback and rollback on failure.

The page unifies candidate management and generation into one workflow, satisfying PRD user stories _US-004_ and _US-005_ while complementing _US-009_ (display & layout consistency).

## 2. View Routing

| Path        | File                             | Auth Guard                                                   |
| ----------- | -------------------------------- | ------------------------------------------------------------ |
| `/generate` | `src/pages/generate/index.astro` | Requires authenticated session (middleware already enforced) |

The Astro page hosts a React island (`<GenerateReview />`) for interactive logic.

## 3. Component Structure

```
GenerateReviewPage (Astro) ──▶ <GenerateReview />  (React root)
  ├── PendingCandidatesSection
  │     └── <CandidateList>
  │           ├── CandidateListHeader (checkbox, select-all)
  │           ├── CandidateRow* (one per candidate)
  │           └── Pagination
  ├── GenerationFormSection
  │     ├── <GenerationForm>
  │     │     ├── TextareaInput (1k-10k)
  │     │     ├── ModelSelect  (radio/select)
  │     │     └── GenerateButton (spinner while loading)
  │     └── InlineError (validation / server)
  ├── NewCandidatesSection (shown after POST success)
  │     └── <CandidateList> (same as above, own state)
  └── Global <BulkActionBar> (appears when any list has >0 selection)
```

`CandidateRow*` contains Accept, Edit, Reject buttons.

## 4. Component Details

### 4.1 GenerateReview (root)

- **Purpose**: Orchestrates data fetch, generation, and candidate actions; holds shared state.
- **Main elements**: two `CandidateList` instances, `GenerationForm`, `BulkActionBar`, `<Toaster/>` (sonner) for notifications.
- **Handled interactions**:
  - Initial fetch of pending candidates (`GET /candidates`).
  - Forward refs to API functions for child callbacks.
  - Maintain two `SelectionState` maps and derive combined selection metrics.
- **Validation**: none (delegates to children).
- **Props**: none (root).
- **Types used**: `CandidateDto`, `CandidateCreateDto`, `CandidateActionCommand`, internal view models below.

### 4.2 CandidateList

- **Purpose**: Reusable paginated list with select-all and row actions.
- **Main elements**: `CandidateListHeader`, mapped `CandidateRow` children, `Pagination`.
- **Handled interactions**: toggle checkbox, select-all, per-row Accept/Edit/Reject, pagination.
- **Validation**: disables checkboxes while API mutating; enforces max 100 selection (shared constant).
- **Props**:
  ```ts
  interface CandidateListProps {
    candidates: CandidateViewModel[];
    pagination: PaginationDto;
    isLoading: boolean;
    selectedIds: Set<string>;
    onToggleSelection(id: string, selected: boolean): void;
    onSelectAll(selected: boolean): void;
    onAccept(id: string): void;
    onEdit(id: string, front: string, back: string): void;
    onReject(id: string): void;
  }
  ```

### 4.3 CandidateRow

- **Purpose**: Display single candidate with front/back texts, source badge, createdAt, selection checkbox, and action buttons.
- **Main elements**: checkbox, two `<p>` text blocks (front/back), Expand/Collapse link, Accept/Edit/Reject buttons using `Button`.
- **Handled interactions**: same as FlashcardRow + candidate specific buttons.
- **Validation**: Edit opens `CandidateEditorDialog` (reuse existing `FlashcardEditorDialog`) where edited front/back must satisfy back ≤500, front ≤200.
- **Props**: `{ candidate: CandidateViewModel, ...callbacks }`.

### 4.4 GenerationForm

- **Purpose**: Input form to request new AI candidates.
- **Main elements**: `<Textarea>`, `<Select>` (models), `<Button>`.
- **Handled events**:
  - `onSubmit` → triggers `POST /ai-sessions`.
  - Disable textarea/model select + show spinner while request pending.
- **Validation conditions**:
  - Text length 1 000–10 000 chars (hard limit + live counter + error state).
  - Model selection in `ALLOWED_MODELS` (populated from constant).
- **Props**: `onSuccess(sessionId: string, candidates: CandidateCreateDto[]): void`.

### 4.5 BulkActionBar (existing)

- **Extended purpose**: Provide Accept _selected_, Reject _selected_, Edit is per-row only. Will be updated to accept callbacks: `onBulkAccept`, `onBulkReject`, optional `onClear`.

### 4.6 CandidateEditorDialog (reuse/extend)

- Opens when user clicks _Edit_; returns new front/back to parent.

## 5. Types

### 5.1 CandidateViewModel (local)

```ts
export interface CandidateViewModel {
  id: string;
  front: string;
  back: string;
  prompt: string;
  aiSessionId: string;
  created_at: string; // ISO from backend
  status: "pending" | "new"; // for differentiating lists
}
```

### 5.2 FormInputs

```ts
interface GenerationFormValues {
  input_text: string; // 1k-10k chars
  model: string; // one of ALLOWED_MODELS
}
```

### 5.3 SelectionState<br>`type SelectionState = Set<string>;`

### 5.4 Hook Return Types

- `useCandidates` → `{ data: CandidateViewModel[], pagination, isLoading, error, refresh() }`.
- `useGeneration` → states for mutation progress & optimistic list update.

## 6. State Management

Use **local React state + custom hooks** – no global store required.

- `pendingCandidates`, `pendingPagination`
- `newCandidates`, `newPagination` (simple slice, 10 per page)
- `pendingSelection`, `newSelection` (`Set<string>`)
- `generationForm`, `isGenerating`, `formErrors`
- `mutationInFlight`, `optimisticUpdates`
  Hooks:

1. `useCandidates(sessionId)` – wraps fetch & pagination for GET endpoint.
2. `useCandidateActions()` – wraps POST actions with optimistic updates.
3. `useGeneration()` – manages POST /ai-sessions flow, returns new candidates & sessionId.

## 7. API Integration

| Action        | Method & Path                                          | Request Type                     | Response Type                  |
| ------------- | ------------------------------------------------------ | -------------------------------- | ------------------------------ |
| Fetch pending | GET `/api/ai-sessions/{sessionId}/candidates`          | n/a                              | `GetCandidatesResponseDto`     |
| Generate      | POST `/api/ai-sessions`                                | `CreateGenerationSessionCommand` | `GenerationSessionResponseDto` |
| Bulk actions  | POST `/api/ai-sessions/{sessionId}/candidates/actions` | `CandidateActionCommand`         | `CandidateActionResponseDto`   |

Implementation notes:

- Store last **open** sessionId in localStorage to refetch pending list on page load.
- After successful generation, update `sessionId` to new one.
- Build `CandidateActionCommand` from combined selections.
- Use `fetch` wrapper in `lib/utils/fetch-json.ts` (create) with automatic toast on non-2xx.

## 8. User Interactions

| Interaction             | UI Feedback                              | API Action                    | Optimistic?       |
| ----------------------- | ---------------------------------------- | ----------------------------- | ----------------- |
| Click **Generate**      | Button spinner, form disabled            | POST /ai-sessions             | N/A               |
| Select row checkbox     | Row highlight                            | none                          | Yes – local state |
| Select-all              | Header checkbox indeterminate            | none                          | Yes               |
| Click **Accept** on row | Fade row + toast                         | POST actions (single)         | Yes               |
| Click **Reject** (row)  | Confirm dialog, fade out                 | POST actions                  | Yes               |
| Click **Edit**          | Dialog opens, save triggers POST actions | Partially (update UI)         |
| Bulk Accept / Reject    | Spinner in BulkActionBar                 | POST actions (batch)          | Yes               |
| Pagination click        | Scroll to top of list                    | none (local slice or refetch) | -                 |

## 9. Conditions & Validation

1. **Textarea length**: live counter, red border at limits.
2. **Required model**: select defaults to `DEFAULT_MODEL`.
3. **Selection limit**: max 100; show warning in BulkActionBar when reached.
4. **Edited text rules**: front ≤200, back ≤500; inline validation in dialog.
5. **API pre-conditions**: sessionId must be UUID; enforced server-side but validated via `z.string().uuid()` in client utils.

## 10. Error Handling

- **400 Validation**: display inline error list under textarea or toast.
- **401/403**: redirect to login (middleware handles, but guard fallback toast).
- **404 session not found**: clear local sessionId, refetch.
- **429 & 500**: show toast error, keep UI state.
- **Optimistic rollback**: on POST actions failure, refresh lists from server and show ‘Action failed – rolled back’ toast.

## 11. Implementation Steps

1. **Routing**: create `src/pages/generate/index.astro` with Layout wrapper.
2. **Scaffold root React component** in `src/components/generate/GenerateReview.tsx` and mount via Astro `<Island />`.
3. **Create custom hooks**: `useCandidates`, `useGeneration`, `useCandidateActions` in `src/lib/hooks/ai-candidates.ts`.
4. **Implement GenerationForm** component with validation & Tailwind styling.
5. **Implement CandidateList & CandidateRow** reusing UI patterns from flashcards components; factor out shared UI util (Checkbox, Badge, etc.).
6. **Integrate Pagination** (reuse existing flashcards `Pagination.tsx`).
7. **Extend BulkActionBar** to support Accept / Reject; add prop types and update existing usages.
8. **Implement CandidateEditorDialog** by adapting `FlashcardEditorDialog.tsx` with front/back limits.
9. **Wire API calls** inside hooks using `fetch-json` helper; include toast notifications via Shadcn/sonner.
10. **Add optimistic UI logic** with `useOptimistic` & rollback on catch.
11. **Persist last sessionId** to localStorage; on mount, attempt preload.
12. **Write unit tests** for hooks (mock fetch) and component interactions (React Testing Library).
13. **Run linter & fix**; ensure TypeScript strict compliance.
14. **Update README** usage section.
15. **Commit & PR** following conventional commits.
