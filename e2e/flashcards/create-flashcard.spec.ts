import { test, expect } from "@playwright/test";
import { LoginPage, MyFlashcardsPage } from "../page-objects";

/**
 * E2E Test: Create Flashcard Flow
 *
 * Scenario:
 * 1. Login to the app with testing user test@test.com
 * 2. Enter My flashcards page by clicking My Flashcards in the top bar
 * 3. Wait for My flashcards page load
 * 4. Click on New Flashcards button
 * 5. Wait for Create Flashcard modal to show
 * 6. Fill Front (max 200 characters) and Back (max 500 characters) text areas
 * 7. Click Create button
 * 8. Wait for flashcard being created - API request and loading state
 * 9. Wait for newly created flashcard show up at the top of flashcards list
 */

test.describe("Create Flashcard", () => {
  let loginPage: LoginPage;
  let myFlashcardsPage: MyFlashcardsPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    myFlashcardsPage = new MyFlashcardsPage(page);

    // Step 1: Login with test user
    const testEmail = process.env.E2E_EMAIL || "test@test.com";
    const testPassword = process.env.E2E_PASSWORD || "test1234";

    await loginPage.goto();
    await loginPage.login(testEmail, testPassword);

    // Wait for successful login redirect with longer timeout
    await page.waitForURL(/\/(generate|flashcards)/, { timeout: 15000 });
  });

  test("should create a new flashcard successfully", async ({ page }) => {
    // Step 2: Navigate to My Flashcards page
    await myFlashcardsPage.goto();

    // Step 3: Wait for page to load
    await myFlashcardsPage.waitForPageLoad();

    // Verify we're on the correct page
    await expect(myFlashcardsPage.pageTitle).toHaveText("My Flashcards");

    // Get initial flashcard count
    const initialCount = await myFlashcardsPage.flashcardsList.getRowCount();

    // Step 4: Click "New Flashcard" button
    await myFlashcardsPage.clickNewFlashcard();

    // Step 5: Wait for Create Flashcard modal to show
    await expect(myFlashcardsPage.editorDialog.createDialog).toBeVisible();
    await expect(myFlashcardsPage.editorDialog.dialogTitle).toHaveText("Create Flashcard");

    // Step 6: Fill form fields with flashcard-like text
    const frontText = "What is the capital of France?";
    const backText = "Paris is the capital and largest city of France.";

    await myFlashcardsPage.editorDialog.fillFront(frontText);
    await myFlashcardsPage.editorDialog.fillBack(backText);

    // Verify inputs are filled correctly
    await expect(myFlashcardsPage.editorDialog.frontInput).toHaveValue(frontText);
    await expect(myFlashcardsPage.editorDialog.backInput).toHaveValue(backText);

    // Verify submit button is enabled
    await expect(myFlashcardsPage.editorDialog.submitButton).toBeEnabled();

    // Step 7: Click Create button
    // Wait for the POST request to create the flashcard
    const createResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/flashcards") && response.request().method() === "POST",
      { timeout: 10000 }
    );

    await myFlashcardsPage.editorDialog.clickSubmit();

    // Step 8: Wait for POST to complete and check if it was successful
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);

    // Wait for dialog to close (indicates successful creation)
    await myFlashcardsPage.editorDialog.waitForDialogClose();

    // Step 9: Verify the flashcard appears in the list
    // Wait for at least one flashcard row to appear
    await expect(page.getByTestId("flashcard-row").first()).toBeVisible({ timeout: 5000 });

    const newCount = await myFlashcardsPage.flashcardsList.getRowCount();
    expect(newCount).toBe(initialCount + 1);

    // Verify the first row contains our new flashcard
    const firstRow = myFlashcardsPage.flashcardsList.getFirstRow();
    await expect(firstRow.frontText).toContainText(frontText);
    await expect(firstRow.backText).toContainText(backText);

    // Verify it's marked as "Manual" source
    expect(await firstRow.isManual()).toBe(true);
  });

  test("should validate front field max length (200 characters)", async () => {
    await myFlashcardsPage.goto();
    await myFlashcardsPage.waitForPageLoad();
    await myFlashcardsPage.clickNewFlashcard();

    // Create text longer than 200 characters
    const longText = "A".repeat(250);

    await myFlashcardsPage.editorDialog.fillFront(longText);

    // Input should only accept 200 characters (browser maxLength attribute)
    const actualLength = await myFlashcardsPage.editorDialog.getFrontCharCount();
    expect(actualLength).toBeLessThanOrEqual(200);
  });

  test("should validate back field max length (500 characters)", async () => {
    await myFlashcardsPage.goto();
    await myFlashcardsPage.waitForPageLoad();
    await myFlashcardsPage.clickNewFlashcard();

    // Create text longer than 500 characters
    const longText = "B".repeat(600);

    await myFlashcardsPage.editorDialog.fillBack(longText);

    // Input should only accept 500 characters (browser maxLength attribute)
    const actualLength = await myFlashcardsPage.editorDialog.getBackCharCount();
    expect(actualLength).toBeLessThanOrEqual(500);
  });

  test("should disable submit button when fields are empty", async () => {
    await myFlashcardsPage.goto();
    await myFlashcardsPage.waitForPageLoad();
    await myFlashcardsPage.clickNewFlashcard();

    // Submit button should be disabled with empty fields
    await expect(myFlashcardsPage.editorDialog.submitButton).toBeDisabled();

    // Fill only front field
    await myFlashcardsPage.editorDialog.fillFront("Test question");
    await expect(myFlashcardsPage.editorDialog.submitButton).toBeDisabled();

    // Fill back field - now button should be enabled
    await myFlashcardsPage.editorDialog.fillBack("Test answer");
    await expect(myFlashcardsPage.editorDialog.submitButton).toBeEnabled();
  });

  test("should cancel flashcard creation", async () => {
    await myFlashcardsPage.goto();
    await myFlashcardsPage.waitForPageLoad();

    const initialCount = await myFlashcardsPage.flashcardsList.getRowCount();

    await myFlashcardsPage.clickNewFlashcard();
    await myFlashcardsPage.editorDialog.fillFront("Test front");
    await myFlashcardsPage.editorDialog.fillBack("Test back");

    // Click cancel
    await myFlashcardsPage.editorDialog.clickCancel();

    // Dialog should close
    await expect(myFlashcardsPage.editorDialog.createDialog).not.toBeVisible();

    // No new flashcard should be created
    const newCount = await myFlashcardsPage.flashcardsList.getRowCount();
    expect(newCount).toBe(initialCount);
  });

  test("should navigate to My Flashcards via header navigation", async ({ page }) => {
    // Start from a different page
    await page.goto("/generate");

    // Use header component to navigate
    await myFlashcardsPage.goto();

    // Verify navigation
    await expect(page).toHaveURL(/\/flashcards/);
    await expect(myFlashcardsPage.pageTitle).toHaveText("My Flashcards");
  });
});
