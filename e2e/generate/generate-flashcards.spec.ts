import { test, expect } from "@playwright/test";
import { LoginPage, GeneratePage } from "../page-objects";

/**
 * Generate Flashcards E2E Tests
 * Tests the complete flow of generating flashcards from text
 */

const SAMPLE_TEXT_1000_CHARS = `
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

test.describe("Generate Flashcards", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const testEmail = process.env.E2E_EMAIL || "test@test.com";
    const testPassword = process.env.E2E_PASSWORD || "test1234";

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testEmail, testPassword);

    // Wait for redirect to generate page
    await page.waitForURL("/generate");
  });

  test("should load the generate page successfully", async ({ page }) => {
    const generatePage = new GeneratePage(page);

    // Wait for page to load
    await generatePage.waitForPageLoad();

    // Verify page elements
    await expect(generatePage.pageTitle).toBeVisible();
    await expect(generatePage.pageTitle).toHaveText("Generate & Review");
    await expect(generatePage.generationFormSection).toBeVisible();
  });

  test("should display character count when typing", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Verify character count element exists and shows initial state
    await expect(generatePage.generationForm.charCount).toBeVisible();
    await expect(generatePage.generationForm.charCount).toContainText("0 / 10,000 characters");

    // Fill with some text
    await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);

    // Wait for React state to update
    await page.waitForTimeout(300);

    // Verify character count updates
    const charCount = await generatePage.generationForm.charCount.textContent();
    expect(charCount).not.toContain("0 / 10,000");
    expect(charCount).toMatch(/1,\d{3}/); // Should show 1,XXX characters
  });

  test("should enable generate button when text is valid", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Initially button should be disabled
    await expect(generatePage.generationForm.generateButton).toBeDisabled();

    // Verify the form elements are present
    await expect(generatePage.generationForm.sourceTextInput).toBeVisible();
    await expect(generatePage.generationForm.modelSelectTrigger).toBeVisible();

    // Fill with sufficient text (>= 1000 characters)
    await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);

    // Wait for React state to update
    await page.waitForTimeout(300);

    // Verify button becomes enabled
    await expect(generatePage.generationForm.generateButton).toBeEnabled();

    // Verify ready message appears
    await expect(generatePage.generationForm.readyToGenerateMessage).toBeVisible();
  });

  test("should generate flashcards successfully", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Fill the form
    await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);

    // Wait for React state to update
    await page.waitForTimeout(300);

    await generatePage.generationForm.selectModel("openai/gpt-4o-mini");

    // Submit the form
    await generatePage.generationForm.clickGenerate();

    // Wait for loading spinner
    await expect(generatePage.generationForm.loadingSpinner).toBeVisible();

    // Wait for generation to complete (increased timeout for real API call)
    await generatePage.generationForm.waitForGenerationComplete(40000);

    // Verify new candidates section appears
    await expect(generatePage.newCandidatesSection).toBeVisible({ timeout: 40000 });

    // Verify candidates are displayed
    const candidateCount = await generatePage.newCandidatesList.getRowCount();
    expect(candidateCount).toBeGreaterThan(0);
  });

  test("should display candidate details correctly", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Generate flashcards
    await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);
    await page.waitForTimeout(300);
    await generatePage.generationForm.selectModel("openai/gpt-4o-mini");
    await generatePage.generationForm.clickGenerate();
    await generatePage.generationForm.waitForGenerationComplete(40000);
    await expect(generatePage.newCandidatesSection).toBeVisible({ timeout: 40000 });

    // Get first candidate
    const firstCandidate = generatePage.newCandidatesList.getFirstRow();

    // Verify candidate has front and back text
    const frontText = await firstCandidate.getFrontText();
    const backText = await firstCandidate.getBackText();

    expect(frontText.length).toBeGreaterThan(0);
    expect(backText.length).toBeGreaterThan(0);

    // Verify action buttons are visible
    await expect(firstCandidate.acceptButton).toBeVisible();
    await expect(firstCandidate.editButton).toBeVisible();
    await expect(firstCandidate.rejectButton).toBeVisible();
  });

  test("should accept a candidate successfully", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Generate flashcards
    await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);
    await page.waitForTimeout(300);
    await generatePage.generationForm.selectModel("openai/gpt-4o-mini");
    await generatePage.generationForm.clickGenerate();
    await generatePage.generationForm.waitForGenerationComplete(40000);
    await expect(generatePage.newCandidatesSection).toBeVisible({ timeout: 40000 });

    // Get initial count
    const initialCount = await generatePage.newCandidatesList.getRowCount();

    // Accept first candidate
    const firstCandidate = generatePage.newCandidatesList.getFirstRow();
    await firstCandidate.accept();

    // Wait for the count to change (optimistic update should be immediate)
    await page.waitForTimeout(500);

    // Verify count decreased
    const newCount = await generatePage.newCandidatesList.getRowCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test("should reject a candidate successfully", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Generate flashcards
    await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);
    await page.waitForTimeout(300);
    await generatePage.generationForm.selectModel("openai/gpt-4o-mini");
    await generatePage.generationForm.clickGenerate();
    await generatePage.generationForm.waitForGenerationComplete(40000);
    await expect(generatePage.newCandidatesSection).toBeVisible({ timeout: 40000 });

    // Get initial count
    const initialCount = await generatePage.newCandidatesList.getRowCount();

    // Reject first candidate
    const firstCandidate = generatePage.newCandidatesList.getFirstRow();
    await firstCandidate.reject();

    // Wait for the count to change (optimistic update should be immediate)
    await page.waitForTimeout(500);

    // Verify count decreased
    const newCount = await generatePage.newCandidatesList.getRowCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test("should select and deselect candidates", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Generate flashcards
    await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);
    await page.waitForTimeout(300);
    await generatePage.generationForm.selectModel("openai/gpt-4o-mini");
    await generatePage.generationForm.clickGenerate();
    await generatePage.generationForm.waitForGenerationComplete(40000);
    await expect(generatePage.newCandidatesSection).toBeVisible({ timeout: 40000 });

    // Get first candidate
    const firstCandidate = generatePage.newCandidatesList.getFirstRow();

    // Initially not selected
    expect(await firstCandidate.isSelected()).toBe(false);

    // Select candidate
    await firstCandidate.select();
    expect(await firstCandidate.isSelected()).toBe(true);

    // Deselect candidate
    await firstCandidate.deselect();
    expect(await firstCandidate.isSelected()).toBe(false);
  });

  test("should select all candidates", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Generate flashcards
    await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);
    await page.waitForTimeout(300);
    await generatePage.generationForm.selectModel("openai/gpt-4o-mini");
    await generatePage.generationForm.clickGenerate();
    await generatePage.generationForm.waitForGenerationComplete(40000);
    await expect(generatePage.newCandidatesSection).toBeVisible({ timeout: 40000 });

    // Select all
    await generatePage.newCandidatesList.selectAll();

    // Verify all are selected
    const count = await generatePage.newCandidatesList.getRowCount();
    for (let i = 0; i < count; i++) {
      const candidate = generatePage.newCandidatesList.getRowByIndex(i);
      expect(await candidate.isSelected()).toBe(true);
    }
  });

  test("should navigate to My Flashcards after accepting candidates", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Generate flashcards
    await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);
    await page.waitForTimeout(300);
    await generatePage.generationForm.selectModel("openai/gpt-4o-mini");
    await generatePage.generationForm.clickGenerate();
    await generatePage.generationForm.waitForGenerationComplete(40000);
    await expect(generatePage.newCandidatesSection).toBeVisible({ timeout: 40000 });

    // Accept first candidate
    const firstCandidate = generatePage.newCandidatesList.getFirstRow();
    await firstCandidate.accept();

    // Navigate to My Flashcards
    await generatePage.goToMyFlashcards();

    // Verify we're on the flashcards page
    await expect(page).toHaveURL("/flashcards");

    // Verify the accepted flashcard appears in the list
    // (This would require FlashcardsList to be visible on the page)
    await page.waitForSelector('[data-testid="flashcard-row"]', { timeout: 5000 });
  });

  test("should handle multiple model selections", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Fill text
    await generatePage.generationForm.fillSourceText(SAMPLE_TEXT_1000_CHARS);

    // Wait for React state to update
    await page.waitForTimeout(300);

    // Verify button becomes enabled (proves onChange fired)
    await expect(generatePage.generationForm.generateButton).toBeEnabled();

    // Try selecting different models
    await generatePage.generationForm.selectModel("openai/gpt-3.5-turbo");
    await page.waitForTimeout(300);

    // Verify button is still enabled after first selection
    await expect(generatePage.generationForm.generateButton).toBeEnabled();

    // Select a different model
    await generatePage.generationForm.selectModel("anthropic/claude-3-haiku");
    await page.waitForTimeout(300);

    // Verify button is still enabled after second selection
    await expect(generatePage.generationForm.generateButton).toBeEnabled();
  });

  test("should show validation for insufficient text", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Fill with insufficient text (less than 1000 characters)
    await generatePage.generationForm.fillSourceText("Short text");

    // Generate button should be disabled
    await expect(generatePage.generationForm.generateButton).toBeDisabled();

    // Ready message should not appear
    await expect(generatePage.generationForm.readyToGenerateMessage).not.toBeVisible();
  });

  test("should select model from dropdown successfully", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Verify model select trigger is visible
    await expect(generatePage.generationForm.modelSelectTrigger).toBeVisible();

    // Select a specific model
    await generatePage.generationForm.selectModel("openai/gpt-4o-mini");

    // Wait for dropdown to close
    await page.waitForTimeout(300);

    // Verify dropdown is closed after selection
    await expect(generatePage.generationForm.modelSelectContent).not.toBeVisible();

    // Verify the selected value is displayed in the trigger
    const triggerText = await generatePage.generationForm.modelSelectTrigger.textContent();
    expect(triggerText).toContain("gpt-4o-mini");
  });
});
