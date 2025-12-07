# Generate Flashcards - Test Scenario Guide

This guide shows how to implement the complete test scenario using the Page Object Model.

## Test Scenario Steps

1. Login to the app with testing user test@test.com
2. You should be redirected to /generate view
3. Wait for whole page to load
4. Fill the source text area with minimum 1000 characters
5. Select gpt-4o-mini model from dropdown
6. Click on Generate flashcards button
7. Wait for successful API response
8. Wait for UI to be updated with flashcards candidates
9. Check for new flashcards existence

## Implementation with Page Objects

### Complete Test Implementation

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, GeneratePage } from "../page-objects";

test("Complete generate flashcards flow", async ({ page }) => {
  // Step 1: Login to the app with testing user
  const testEmail = process.env.E2E_EMAIL || "test@test.com";
  const testPassword = process.env.E2E_PASSWORD || "test1234";
  
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(testEmail, testPassword);

  // Step 2: Verify redirect to /generate view
  await expect(page).toHaveURL("/generate");

  // Step 3: Wait for whole page to load
  const generatePage = new GeneratePage(page);
  await generatePage.waitForPageLoad();

  // Verify page is fully loaded
  await expect(generatePage.pageContainer).toBeVisible();
  await expect(generatePage.generationFormSection).toBeVisible();

  // Step 4: Fill the source text area with minimum 1000 characters
  const sampleText = `
    Artificial Intelligence (AI) is a branch of computer science that aims to create 
    intelligent machines that work and react like humans. Some of the activities computers 
    with artificial intelligence are designed for include speech recognition, learning, 
    planning, and problem solving. AI research has been highly successful in developing 
    effective techniques for solving a wide range of problems, from game playing to medical 
    diagnosis. Machine learning is a core part of AI. It is the study of computer algorithms 
    that improve automatically through experience. Machine learning algorithms build a 
    mathematical model based on sample data, known as training data, in order to make 
    predictions or decisions without being explicitly programmed to do so. Deep learning 
    is part of a broader family of machine learning methods based on artificial neural 
    networks with representation learning. Learning can be supervised, semi-supervised or 
    unsupervised. The field of AI research was founded at a workshop at Dartmouth College 
    in 1956. The attendees became the leaders of AI research for decades.
  `.trim();

  await generatePage.generationForm.fillSourceText(sampleText);

  // Verify character count is valid
  const charCount = await generatePage.generationForm.getCharCount();
  expect(charCount).toContain("1"); // Should show at least 1000 characters

  // Verify ready to generate message appears
  await expect(generatePage.generationForm.readyToGenerateMessage).toBeVisible();

  // Step 5: Select gpt-4o-mini model from dropdown
  await generatePage.generationForm.selectModel("openai/gpt-4o-mini");

  // Verify button is enabled
  await expect(generatePage.generationForm.generateButton).toBeEnabled();

  // Step 6: Click on Generate flashcards button
  await generatePage.generationForm.clickGenerate();

  // Step 7: Wait for successful API response
  // Loading spinner should appear
  await expect(generatePage.generationForm.loadingSpinner).toBeVisible();

  // Wait for generation to complete (API response received)
  await generatePage.generationForm.waitForGenerationComplete(30000);

  // Step 8: Wait for UI to be updated with flashcards candidates
  await expect(generatePage.newCandidatesSection).toBeVisible({ timeout: 30000 });

  // Verify the section header and count are visible
  await expect(generatePage.newCandidatesCount).toBeVisible();

  // Step 9: Check for new flashcards existence
  // Verify at least one candidate is displayed
  const candidateCount = await generatePage.newCandidatesList.getRowCount();
  expect(candidateCount).toBeGreaterThan(0);

  // Verify first candidate has content
  const firstCandidate = generatePage.newCandidatesList.getFirstRow();
  await expect(firstCandidate.row).toBeVisible();
  await expect(firstCandidate.frontText).toBeVisible();
  await expect(firstCandidate.backText).toBeVisible();

  // Get candidate content
  const frontText = await firstCandidate.getFrontText();
  const backText = await firstCandidate.getBackText();

  expect(frontText.length).toBeGreaterThan(0);
  expect(backText.length).toBeGreaterThan(0);

  console.log(`✅ Generated ${candidateCount} flashcard candidates`);
  console.log(`First candidate: ${frontText}`);
});
```

### Simplified Version Using Helper Method

```typescript
test("Generate flashcards - simplified", async ({ page }) => {
  // Steps 1-3: Login and navigate
  const testEmail = process.env.E2E_EMAIL || "test@test.com";
  const testPassword = process.env.E2E_PASSWORD || "test1234";
  
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(testEmail, testPassword);

  const generatePage = new GeneratePage(page);
  await generatePage.waitForPageLoad();

  // Steps 4-8: Generate flashcards (all in one method)
  await generatePage.generateFlashcards(
    SAMPLE_TEXT_1000_CHARS,
    "openai/gpt-4o-mini",
    true // wait for results
  );

  // Step 9: Verify candidates exist
  expect(await generatePage.hasNewCandidates()).toBe(true);
  
  const count = await generatePage.newCandidatesList.getRowCount();
  expect(count).toBeGreaterThan(0);
});
```

## Key Test IDs Used

### Step 3: Wait for page load
- `generate-review-page` - Main page container
- `generation-form-section` - Form section

### Step 4: Fill source text
- `source-text-input` - Text input field
- `char-count` - Character count display
- `ready-to-generate` - Validation message

### Step 5: Select model
- `model-select-trigger` - Dropdown trigger
- `model-option-openai/gpt-4o-mini` - Specific model option

### Step 6: Click generate
- `generate-flashcards-button` - Submit button

### Step 7: Wait for API response
- `loading-spinner` - Loading indicator

### Step 8: Wait for UI update
- `new-candidates-section` - New candidates section
- `new-candidates-count` - Count display

### Step 9: Check candidates
- `candidate-list` - List container
- `candidate-row` - Individual rows
- `candidate-front` - Front text
- `candidate-back` - Back text

## Assertions at Each Step

```typescript
// Step 1: Login successful
await expect(page).toHaveURL("/generate");

// Step 2: Redirected correctly
await expect(generatePage.pageTitle).toHaveText("Generate & Review");

// Step 3: Page loaded
await expect(generatePage.pageContainer).toBeVisible();

// Step 4: Text filled correctly
const value = await generatePage.generationForm.getSourceTextValue();
expect(value.length).toBeGreaterThanOrEqual(1000);

// Step 5: Model selected
await expect(generatePage.generationForm.generateButton).toBeEnabled();

// Step 6: Generation started
await expect(generatePage.generationForm.loadingSpinner).toBeVisible();

// Step 7: Generation completed
await expect(generatePage.generationForm.loadingSpinner).not.toBeVisible();

// Step 8: UI updated
await expect(generatePage.newCandidatesSection).toBeVisible();

// Step 9: Candidates exist
const count = await generatePage.newCandidatesList.getRowCount();
expect(count).toBeGreaterThan(0);
```

## Error Handling

```typescript
test("Handle generation errors gracefully", async ({ page }) => {
  const generatePage = new GeneratePage(page);
  await generatePage.goto();
  await generatePage.waitForPageLoad();

  try {
    // Attempt to generate with invalid data
    await generatePage.generationForm.fillSourceText("Too short");
    
    // Button should be disabled
    await expect(generatePage.generationForm.generateButton).toBeDisabled();
    
    // Ready message should not appear
    await expect(generatePage.generationForm.readyToGenerateMessage).not.toBeVisible();
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
});
```

## Running the Tests

```bash
# Run all generate tests
npm run test:e2e -- e2e/generate/

# Run specific test file
npm run test:e2e -- e2e/generate/generate-flashcards.spec.ts

# Run in UI mode for debugging
npm run test:e2e:ui

# Run with trace for debugging failures
npm run test:e2e -- --trace on
```

## Debugging Tips

1. **Use UI Mode** - See the test execution in real-time
   ```bash
   npm run test:e2e:ui
   ```

2. **Enable Traces** - Record test execution for debugging
   ```bash
   npm run test:e2e -- --trace on
   ```

3. **Add Console Logs** - Track test progress
   ```typescript
   const count = await generatePage.newCandidatesList.getRowCount();
   console.log(`Generated ${count} candidates`);
   ```

4. **Take Screenshots** - Capture state at key points
   ```typescript
   await generatePage.takeScreenshot("after-generation");
   ```

5. **Use Slow Motion** - Slow down test execution
   ```typescript
   test.use({ launchOptions: { slowMo: 1000 } });
   ```

## Best Practices

✅ **DO:**
- Use page object methods for all interactions
- Wait for elements using built-in methods
- Add meaningful assertions at each step
- Use descriptive test names
- Clean up test data after tests

❌ **DON'T:**
- Access `page` directly in tests
- Use arbitrary `waitForTimeout()`
- Hard-code test data in multiple places
- Skip error handling
- Test implementation details

## Sample Test Data

```typescript
// Minimum valid text (1000+ characters)
const SAMPLE_TEXT_1000_CHARS = `...`; // See full example in test file

// Models to test
const MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3-haiku",
];

// Test user credentials (from environment variables or defaults)
const testEmail = process.env.E2E_EMAIL || "test@test.com";
const testPassword = process.env.E2E_PASSWORD || "test1234";
```

**Note:** Test credentials are loaded from environment variables (`E2E_EMAIL` and `E2E_PASSWORD`) with fallback defaults. The actual credentials are stored in `.env.test` file.

