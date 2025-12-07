import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { GenerationForm } from "./components/GenerationForm";
import { CandidatesList } from "./components/CandidatesList";
import { Header } from "./components/Header";

/**
 * Generate Page Object Model
 * Represents the main page for generating and reviewing flashcard candidates
 */
export class GeneratePage extends BasePage {
  readonly pageContainer: Locator;
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;

  // Section containers
  readonly pendingCandidatesSection: Locator;
  readonly pendingCandidatesCount: Locator;
  readonly generationFormSection: Locator;
  readonly newCandidatesSection: Locator;
  readonly newCandidatesCount: Locator;

  // Component objects
  readonly header: Header;
  readonly generationForm: GenerationForm;
  readonly pendingCandidatesList: CandidatesList;
  readonly newCandidatesList: CandidatesList;

  constructor(page: Page) {
    super(page);

    // Main page elements
    this.pageContainer = page.getByTestId("generate-review-page");
    this.pageTitle = page.getByTestId("page-title");
    this.pageDescription = page.getByTestId("page-description");

    // Section containers
    this.pendingCandidatesSection = page.getByTestId("pending-candidates-section");
    this.pendingCandidatesCount = page.getByTestId("pending-candidates-count");
    this.generationFormSection = page.getByTestId("generation-form-section");
    this.newCandidatesSection = page.getByTestId("new-candidates-section");
    this.newCandidatesCount = page.getByTestId("new-candidates-count");

    // Initialize component objects
    this.header = new Header(page);
    this.generationForm = new GenerationForm(page);
    this.pendingCandidatesList = new CandidatesList(page, "pending-candidate");
    this.newCandidatesList = new CandidatesList(page, "new-candidate");
  }

  async goto() {
    await super.goto("/generate");
  }

  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad() {
    await this.pageContainer.waitFor({ state: "visible" });
    await this.pageTitle.waitFor({ state: "visible" });
    await this.generationFormSection.waitFor({ state: "visible" });
  }

  /**
   * Check if the page is loaded
   */
  async isPageLoaded(): Promise<boolean> {
    return await this.pageContainer.isVisible();
  }

  /**
   * Get the page title text
   */
  async getPageTitle(): Promise<string> {
    return (await this.pageTitle.textContent()) || "";
  }

  /**
   * Check if pending candidates section is visible
   */
  async hasPendingCandidates(): Promise<boolean> {
    return await this.pendingCandidatesSection.isVisible().catch(() => false);
  }

  /**
   * Get the count of pending candidates from the text
   */
  async getPendingCandidatesCount(): Promise<number> {
    if (!(await this.hasPendingCandidates())) {
      return 0;
    }

    const text = await this.pendingCandidatesCount.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if new candidates section is visible
   */
  async hasNewCandidates(): Promise<boolean> {
    return await this.newCandidatesSection.isVisible().catch(() => false);
  }

  /**
   * Get the count of new candidates from the text
   */
  async getNewCandidatesCount(): Promise<number> {
    if (!(await this.hasNewCandidates())) {
      return 0;
    }

    const text = await this.newCandidatesCount.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Wait for new candidates to appear after generation
   * @param minCount - Minimum number of candidates expected
   * @param timeout - Maximum time to wait in milliseconds
   */
  async waitForNewCandidates(minCount = 1, timeout = 30000) {
    // Wait for the section to appear
    await this.newCandidatesSection.waitFor({ state: "visible", timeout });

    // Wait for candidates to load
    await this.newCandidatesList.waitForCandidates(minCount, timeout);
  }

  /**
   * Generate flashcards with text and model
   * @param text - Source text (minimum 1000 characters)
   * @param modelId - Model ID (e.g., "openai/gpt-4o-mini")
   * @param waitForResults - Whether to wait for generation to complete
   */
  async generateFlashcards(text: string, modelId: string, waitForResults = true) {
    await this.generationForm.generateFlashcards(text, modelId);

    if (waitForResults) {
      await this.generationForm.waitForGenerationComplete();
      await this.waitForNewCandidates();
    }
  }

  /**
   * Get all new candidate front texts
   */
  async getNewCandidateFrontTexts(): Promise<string[]> {
    if (!(await this.hasNewCandidates())) {
      return [];
    }

    return await this.newCandidatesList.getAllFrontTexts();
  }

  /**
   * Get all new candidate back texts
   */
  async getNewCandidateBackTexts(): Promise<string[]> {
    if (!(await this.hasNewCandidates())) {
      return [];
    }

    return await this.newCandidatesList.getAllBackTexts();
  }

  /**
   * Accept all new candidates
   */
  async acceptAllNewCandidates() {
    if (await this.hasNewCandidates()) {
      await this.newCandidatesList.acceptAll();
    }
  }

  /**
   * Reject all new candidates
   */
  async rejectAllNewCandidates() {
    if (await this.hasNewCandidates()) {
      await this.newCandidatesList.rejectAll();
    }
  }

  /**
   * Check if the generation form is visible
   */
  async isGenerationFormVisible(): Promise<boolean> {
    return await this.generationFormSection.isVisible();
  }

  /**
   * Navigate to My Flashcards page via header
   */
  async goToMyFlashcards() {
    await this.header.goToMyFlashcards();
  }

  /**
   * Logout via header
   */
  async logout() {
    await this.header.logout();
  }
}
