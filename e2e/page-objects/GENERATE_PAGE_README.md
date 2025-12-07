# Generate Page - Page Object Model

This document describes the Page Object Model (POM) structure for the Generate & Review page.

## Overview

The Generate page allows users to generate flashcard candidates from text using AI models, then review, accept, edit, or reject the candidates.

## Page Objects Structure

```
GeneratePage (Main Page)
├── GenerationForm (Component)
├── CandidatesList (Component)
│   └── CandidateRow[] (Component)
└── Header (Shared Component)
```

## Classes

### GeneratePage

Main page object for the Generate & Review page.

**Location:** `e2e/page-objects/GeneratePage.ts`

**Key Properties:**
- `pageContainer` - Main page container
- `pageTitle` - Page title element
- `generationForm` - GenerationForm component instance
- `pendingCandidatesList` - List of pending candidates from previous sessions
- `newCandidatesList` - List of newly generated candidates
- `header` - Header component instance

**Key Methods:**

```typescript
// Navigation
await generatePage.goto();
await generatePage.waitForPageLoad();

// Check sections
await generatePage.hasPendingCandidates();
await generatePage.hasNewCandidates();

// Generate flashcards
await generatePage.generateFlashcards(text, modelId, waitForResults);

// Get candidate data
await generatePage.getNewCandidateFrontTexts();
await generatePage.getNewCandidateBackTexts();

// Bulk actions
await generatePage.acceptAllNewCandidates();
await generatePage.rejectAllNewCandidates();
```

**Example Usage:**

```typescript
const generatePage = new GeneratePage(page);
await generatePage.goto();
await generatePage.waitForPageLoad();

// Generate flashcards
await generatePage.generateFlashcards(
  "Your text here (1000+ chars)",
  "openai/gpt-4o-mini"
);

// Verify candidates appeared
expect(await generatePage.hasNewCandidates()).toBe(true);
```

---

### GenerationForm

Component for the flashcard generation form.

**Location:** `e2e/page-objects/components/GenerationForm.ts`

**Key Properties:**
- `sourceTextInput` - Text input for source content
- `charCount` - Character count display
- `modelSelectTrigger` - Model selection dropdown trigger
- `generateButton` - Submit button
- `loadingSpinner` - Loading indicator

**Key Methods:**

```typescript
// Fill form
await form.fillSourceText(text);
await form.selectModel("openai/gpt-4o-mini");

// Submit
await form.clickGenerate();
await form.waitForGenerationComplete();

// Check state
await form.isReadyToGenerate();
await form.isGenerating();
await form.isGenerateButtonEnabled();

// Get values
await form.getCharCount();
await form.getSourceTextValue();
```

**Example Usage:**

```typescript
const form = generatePage.generationForm;

// Fill and submit
await form.fillSourceText(longText);
await form.selectModel("openai/gpt-4o-mini");
await form.clickGenerate();

// Wait for completion
await form.waitForGenerationComplete();
```

---

### CandidatesList

Component representing a list of candidate flashcards.

**Location:** `e2e/page-objects/components/CandidatesList.ts`

**Key Properties:**
- `container` - List container element
- `selectAllCheckbox` - Select all checkbox
- `rowsContainer` - Container for candidate rows

**Key Methods:**

```typescript
// Get rows
const allRows = list.getAllRows();
const firstRow = list.getFirstRow();
const rowByIndex = list.getRowByIndex(0);

// Get counts
await list.getRowCount();
await list.isEmpty();

// Selection
await list.selectAll();
await list.deselectAll();

// Get data
await list.getAllFrontTexts();
await list.getAllBackTexts();
await list.findRowByFrontText("search text");

// Wait for data
await list.waitForCandidates(minCount, timeout);
await list.waitForLoad();
```

**Example Usage:**

```typescript
const candidatesList = generatePage.newCandidatesList;

// Wait for candidates to load
await candidatesList.waitForCandidates(5);

// Get all front texts
const frontTexts = await candidatesList.getAllFrontTexts();
console.log(`Generated ${frontTexts.length} candidates`);

// Find specific candidate
const candidate = await candidatesList.findRowByFrontText("Artificial Intelligence");
```

---

### CandidateRow

Component representing a single candidate flashcard row.

**Location:** `e2e/page-objects/components/CandidateRow.ts`

**Key Properties:**
- `row` - Row container element
- `checkbox` - Selection checkbox
- `frontText` - Front text element
- `backText` - Back text element
- `acceptButton` - Accept button
- `editButton` - Edit button
- `rejectButton` - Reject button

**Key Methods:**

```typescript
// Get data
await row.getFrontText();
await row.getBackText();

// Selection
await row.select();
await row.deselect();
await row.toggleSelection();
await row.isSelected();

// Actions
await row.accept();
await row.edit();
await row.reject();

// Wait for changes
await row.waitForDisappear();
```

**Example Usage:**

```typescript
const firstCandidate = generatePage.newCandidatesList.getFirstRow();

// Check content
const front = await firstCandidate.getFrontText();
const back = await firstCandidate.getBackText();
console.log(`Front: ${front}, Back: ${back}`);

// Accept the candidate
await firstCandidate.accept();
await firstCandidate.waitForDisappear();
```

---

## Complete Test Example

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, GeneratePage } from "../page-objects";

test("Generate and accept flashcards", async ({ page }) => {
  // 1. Login
  const testEmail = process.env.E2E_EMAIL || "test@test.com";
  const testPassword = process.env.E2E_PASSWORD || "test1234";
  
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(testEmail, testPassword);

  // 2. Navigate to generate page
  const generatePage = new GeneratePage(page);
  await generatePage.waitForPageLoad();

  // 3. Fill source text (1000+ characters)
  const longText = "Your long text here...";
  await generatePage.generationForm.fillSourceText(longText);

  // 4. Verify ready state
  await expect(generatePage.generationForm.readyToGenerateMessage).toBeVisible();

  // 5. Select model
  await generatePage.generationForm.selectModel("openai/gpt-4o-mini");

  // 6. Generate flashcards
  await generatePage.generationForm.clickGenerate();

  // 7. Wait for generation
  await generatePage.generationForm.waitForGenerationComplete();

  // 8. Verify candidates appeared
  await expect(generatePage.newCandidatesSection).toBeVisible();
  
  // 9. Check candidate count
  const count = await generatePage.newCandidatesList.getRowCount();
  expect(count).toBeGreaterThan(0);

  // 10. Accept first candidate
  const firstCandidate = generatePage.newCandidatesList.getFirstRow();
  const frontText = await firstCandidate.getFrontText();
  
  await firstCandidate.accept();
  await firstCandidate.waitForDisappear();

  // 11. Navigate to My Flashcards
  await generatePage.goToMyFlashcards();
  
  // 12. Verify flashcard was added
  await expect(page).toHaveURL("/flashcards");
});
```

## Test Data IDs Reference

All test IDs used in the Generate page components:

### Page Level
- `generate-review-page` - Main page container
- `page-title` - Page title
- `page-description` - Page description

### Sections
- `pending-candidates-section` - Pending candidates section
- `pending-candidates-count` - Pending count text
- `generation-form-section` - Form section
- `new-candidates-section` - New candidates section
- `new-candidates-count` - New candidates count text

### Form Elements
- `source-text-input` - Source text textarea
- `char-count` - Character count display
- `ready-to-generate` - Ready message
- `model-select-trigger` - Model dropdown trigger
- `model-select-content` - Model dropdown content
- `model-option-{modelId}` - Model option (e.g., `model-option-openai/gpt-4o-mini`)
- `generate-flashcards-button` - Generate button
- `loading-spinner` - Loading spinner

### List Elements
- `candidate-list` - Candidates list container
- `candidate-list-header` - List header
- `select-all-checkbox` - Select all checkbox
- `candidate-rows-container` - Rows container
- `candidates-loading` - Loading state
- `candidates-empty` - Empty state

### Row Elements
- `candidate-row` - Individual row
- `candidate-checkbox` - Row checkbox
- `candidate-front` - Front text
- `candidate-back` - Back text
- `candidate-accept-button` - Accept button
- `candidate-edit-button` - Edit button
- `candidate-reject-button` - Reject button

## Best Practices

1. **Use Page Objects for all interactions**
   ```typescript
   // ✅ Good
   await generatePage.generationForm.fillSourceText(text);
   
   // ❌ Bad
   await page.getByTestId("source-text-input").fill(text);
   ```

2. **Wait for operations to complete**
   ```typescript
   await generatePage.generationForm.clickGenerate();
   await generatePage.generationForm.waitForGenerationComplete();
   ```

3. **Use component methods for complex operations**
   ```typescript
   // ✅ Good - uses high-level method
   await generatePage.generateFlashcards(text, modelId);
   
   // ❌ Bad - manual steps
   await generatePage.generationForm.fillSourceText(text);
   await generatePage.generationForm.selectModel(modelId);
   await generatePage.generationForm.clickGenerate();
   await generatePage.generationForm.waitForGenerationComplete();
   ```

4. **Check state before actions**
   ```typescript
   if (await generatePage.hasNewCandidates()) {
     await generatePage.acceptAllNewCandidates();
   }
   ```

5. **Use descriptive test names**
   ```typescript
   test("should generate flashcards and accept first candidate", async ({ page }) => {
     // Test implementation
   });
   ```

