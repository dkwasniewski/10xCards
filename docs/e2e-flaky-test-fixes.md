# E2E Flaky Test Fixes

## Problem Summary

Two E2E tests were failing intermittently in CI/CD pipeline on first attempt but passing on retry:

- "should display candidate details correctly"
- "should select and deselect candidates"

### Root Cause

The tests were experiencing race conditions due to:

1. **Insufficient wait for React state updates**: Tests used fixed 300ms timeout (`page.waitForTimeout(300)`) which was unreliable in CI environments
2. **Fragile button state checking**: Used `page.waitForFunction()` with DOM polling which could miss state changes
3. **No explicit wait for form readiness**: Tests didn't wait for visual indicators that React had processed the input

### Error Logs

```
TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
   at page-objects/components/GenerationForm.ts:106
```

The test was timing out while waiting for the generate button to become enabled after filling the text input.

## Solutions Implemented

### 1. Improved Button Click Method

**File**: `e2e/page-objects/components/GenerationForm.ts`

**Before**:

```typescript
async clickGenerate() {
  await this.generateButton.waitFor({ state: "visible" });
  await this.page.waitForFunction(
    (selector) => {
      const button = document.querySelector(selector);
      return button && !button.hasAttribute("disabled");
    },
    `[data-testid="generate-flashcards-button"]`,
    { timeout: 10000 }
  );
  await this.generateButton.click();
}
```

**After**:

```typescript
async clickGenerate() {
  await this.generateButton.waitFor({ state: "visible" });

  // Use Playwright's built-in enabled check with retry logic
  // This is more reliable than waitForFunction as it uses Playwright's auto-waiting
  await expect(this.generateButton).toBeEnabled({ timeout: 15000 });

  await this.generateButton.click();
}
```

**Benefits**:

- Uses Playwright's native auto-waiting mechanism
- More reliable than DOM polling
- Increased timeout to 15 seconds for CI environments
- Better error messages when failures occur

### 2. Added Robust Form Fill Method

**File**: `e2e/page-objects/components/GenerationForm.ts`

Added new method `fillSourceTextAndWaitForReady()`:

```typescript
async fillSourceTextAndWaitForReady(text: string) {
  await this.fillSourceText(text);

  // Wait for the ready message to appear, which indicates React has processed the input
  // and the button should be enabled (if text is valid)
  if (text.length >= 1000) {
    await expect(this.readyToGenerateMessage).toBeVisible({ timeout: 5000 });
    // Also wait for button to be enabled
    await expect(this.generateButton).toBeEnabled({ timeout: 5000 });
  }
}
```

**Benefits**:

- Waits for visual confirmation that React state has updated
- Checks both the "ready to generate" message and button state
- Eliminates race conditions between text input and state updates
- More explicit about what we're waiting for

### 3. Added Data-State Attribute

**File**: `src/components/generate/GenerationForm.tsx`

Added `data-state` attribute to the button:

```typescript
<Button
  type="submit"
  disabled={isLoading || !hasValidLength}
  className="w-full"
  data-testid="generate-flashcards-button"
  data-state={isLoading ? "loading" : hasValidLength ? "ready" : "disabled"}
>
```

**Benefits**:

- Provides explicit state information for testing
- Makes debugging easier (can see exact state in screenshots)
- Enables more reliable state-based assertions
- Future-proofs tests against UI changes

### 4. Added State Checking Helper

**File**: `e2e/page-objects/components/GenerationForm.ts`

```typescript
async waitForButtonState(state: "ready" | "loading" | "disabled", timeout = 5000) {
  await expect(this.generateButton).toHaveAttribute("data-state", state, { timeout });
}
```

**Benefits**:

- Can explicitly wait for specific button states
- Useful for debugging and more complex test scenarios
- Type-safe state checking

### 5. Updated All Test Cases

**File**: `e2e/generate/generate-flashcards.spec.ts`

Updated all tests that generate flashcards to use the new robust method:

**Before**:

```typescript
await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);
await page.waitForTimeout(300);
await generatePage.generationForm.selectModel("openai/gpt-4o-mini");
await generatePage.generationForm.clickGenerate();
```

**After**:

```typescript
await generatePage.generationForm.fillSourceTextAndWaitForReady(SAMPLE_TEXT_1000_CHARS);
await generatePage.generationForm.selectModel("openai/gpt-4o-mini");
await generatePage.generationForm.clickGenerate();
```

**Benefits**:

- Eliminates arbitrary timeouts
- More reliable in CI environments
- Self-documenting code (clear what we're waiting for)
- Consistent pattern across all tests

### 6. Improved Character Count Test

**Before**:

```typescript
await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);
await page.waitForTimeout(300);
const charCount = await generatePage.generationForm.charCount.textContent();
expect(charCount).not.toContain("0 / 10,000");
```

**After**:

```typescript
await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);
// Wait for character count to update by checking the content
await expect(generatePage.generationForm.charCount).not.toContainText("0 / 10,000", { timeout: 3000 });
const charCount = await generatePage.generationForm.charCount.textContent();
```

**Benefits**:

- Waits for actual content change instead of arbitrary timeout
- More explicit about what we're waiting for
- Fails faster if something is wrong

## Impact

### Tests Updated

- ✅ "should display candidate details correctly"
- ✅ "should select and deselect candidates"
- ✅ "should generate flashcards successfully"
- ✅ "should accept a candidate successfully"
- ✅ "should reject a candidate successfully"
- ✅ "should select all candidates"
- ✅ "should navigate to My Flashcards after accepting candidates"
- ✅ "should handle multiple model selections"
- ✅ "should display character count when typing"
- ✅ "should enable generate button when text is valid"

### Expected Results

1. **Reduced flakiness**: Tests should pass consistently on first attempt in CI
2. **Faster failure detection**: When tests do fail, they'll fail faster with clearer error messages
3. **Better debugging**: The `data-state` attribute will be visible in failure screenshots
4. **More maintainable**: Explicit waiting patterns are easier to understand and modify

## Best Practices Applied

1. ✅ **Use Playwright's built-in assertions** instead of custom wait functions
2. ✅ **Wait for visible state changes** rather than arbitrary timeouts
3. ✅ **Add explicit state attributes** to components for better testability
4. ✅ **Increase timeouts for CI environments** (15s instead of 10s)
5. ✅ **Use auto-waiting mechanisms** provided by Playwright
6. ✅ **Make tests self-documenting** with clear method names

## Testing Recommendations

To verify these fixes:

1. Run the tests multiple times locally:

   ```bash
   npm run test:e2e -- --repeat-each=5
   ```

2. Run in CI pipeline and verify first-attempt pass rate

3. Monitor test execution times to ensure no performance regression

4. Check failure screenshots for the new `data-state` attribute when debugging

## Future Improvements

Consider these additional improvements if flakiness persists:

1. Add retry logic at the action level (not just test level)
2. Implement custom Playwright fixtures for common wait patterns
3. Add performance monitoring to detect slow React updates
4. Consider using Playwright's `page.waitForLoadState('networkidle')` for complex state updates
5. Add visual regression testing to catch UI state issues earlier
