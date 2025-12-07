# Generate Page Test IDs

This document lists all `data-testid` attributes added to components for the flashcard generation scenario.

## Test Scenario Flow

1. Login to the app with testing user test@test.com
2. Redirect to /generate view
3. Wait for whole page to load
4. Fill the source text area with minimum 1000 characters
5. Select gpt-4o-mini model from dropdown
6. Click on Generate flashcards button
7. Wait for successful API response
8. Wait for UI to be updated with flashcards candidates
9. Check for new flashcards existence

## Test IDs by Component

### GenerateReview Component (`src/components/generate/GenerateReview.tsx`)

| Test ID | Element | Purpose |
|---------|---------|---------|
| `generate-review-page` | Main container div | Verify page is loaded |
| `pending-candidates-section` | Section element | Check if pending candidates section exists |
| `pending-candidates-count` | Paragraph element | Verify count of pending candidates |
| `generation-form-section` | Section element | Locate the generation form area |
| `new-candidates-section` | Section element | Check if newly generated candidates appear |
| `new-candidates-count` | Paragraph element | Verify count of newly generated candidates |

### GenerationForm Component (`src/components/generate/GenerationForm.tsx`)

| Test ID | Element | Purpose |
|---------|---------|---------|
| `source-text-input` | Textarea | Input field for source text (step 4) |
| `char-count` | Span element | Character count display |
| `ready-to-generate` | Paragraph element | Validation message when ready |
| `model-select-trigger` | SelectTrigger | Dropdown trigger for model selection (step 5) |
| `model-select-content` | SelectContent | Dropdown content container |
| `model-option-{modelId}` | SelectItem | Individual model options (e.g., `model-option-openai/gpt-4o-mini`) |
| `generate-flashcards-button` | Button | Submit button to generate flashcards (step 6) |
| `loading-spinner` | Loader2 icon | Loading indicator during generation |

### PageHeader Component (`src/components/flashcards/PageHeader.tsx`)

| Test ID | Element | Purpose |
|---------|---------|---------|
| `page-header` | Header element | Page header container |
| `page-title` | H1 element | Page title text |
| `page-description` | Paragraph element | Page description text |

### CandidateList Component (`src/components/generate/CandidateList.tsx`)

| Test ID | Element | Purpose |
|---------|---------|---------|
| `candidates-loading` | Loading div | Loading state indicator |
| `candidates-empty` | Empty state div | Empty state when no candidates |
| `candidate-list` | Main container | Candidate list container (step 9) |
| `candidate-rows-container` | Div element | Container for all candidate rows |

### CandidateListHeader Component (`src/components/generate/CandidateListHeader.tsx`)

| Test ID | Element | Purpose |
|---------|---------|---------|
| `candidate-list-header` | Header div | List header container |
| `select-all-checkbox` | Checkbox | Select all candidates checkbox |

### CandidateRow Component (`src/components/generate/CandidateRow.tsx`)

| Test ID | Element | Purpose |
|---------|---------|---------|
| `candidate-row` | Row container div | Individual candidate row (step 9) |
| `candidate-checkbox` | Checkbox | Selection checkbox for candidate |
| `candidate-front` | Paragraph element | Front text of flashcard |
| `candidate-back` | Paragraph element | Back text of flashcard |
| `candidate-accept-button` | Button | Accept candidate button |
| `candidate-edit-button` | Button | Edit candidate button |
| `candidate-reject-button` | Button | Reject candidate button |

## Example Test Usage

```typescript
// Step 3: Wait for page to load
await page.waitForSelector('[data-testid="generate-review-page"]');
await page.waitForSelector('[data-testid="generation-form-section"]');

// Step 4: Fill source text
const sourceTextInput = page.locator('[data-testid="source-text-input"]');
await sourceTextInput.fill('Your text content here (1000+ characters)...');

// Verify character count is valid
await expect(page.locator('[data-testid="ready-to-generate"]')).toBeVisible();

// Step 5: Select model
await page.locator('[data-testid="model-select-trigger"]').click();
await page.locator('[data-testid="model-option-openai/gpt-4o-mini"]').click();

// Step 6: Click generate button
await page.locator('[data-testid="generate-flashcards-button"]').click();

// Step 7: Wait for loading to complete
await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 30000 });

// Step 8 & 9: Verify new candidates appear
await expect(page.locator('[data-testid="new-candidates-section"]')).toBeVisible();
const candidateRows = page.locator('[data-testid="candidate-row"]');
await expect(candidateRows).toHaveCount(greaterThan(0));

// Verify candidate content
const firstCandidate = candidateRows.first();
await expect(firstCandidate.locator('[data-testid="candidate-front"]')).toBeVisible();
await expect(firstCandidate.locator('[data-testid="candidate-back"]')).toBeVisible();
```

## Notes

- All test IDs follow kebab-case naming convention
- Model option test IDs include the full model path (e.g., `openai/gpt-4o-mini`)
- Multiple candidate rows will have the same `candidate-row` test ID (use `.locator()` with filters or `.nth()`)
- The loading spinner only appears when generation is in progress
- The `new-candidates-section` only appears after successful generation


