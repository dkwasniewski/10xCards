import { Page, Locator } from "@playwright/test";

/**
 * Generation Form Component
 * Represents the form for generating flashcards from text
 */
export class GenerationForm {
  readonly page: Page;
  readonly container: Locator;
  readonly sourceTextInput: Locator;
  readonly charCount: Locator;
  readonly readyToGenerateMessage: Locator;
  readonly modelSelectTrigger: Locator;
  readonly modelSelectContent: Locator;
  readonly generateButton: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form container
    this.container = page.getByTestId("generation-form-section");

    // Input elements
    this.sourceTextInput = page.getByTestId("source-text-input");
    this.charCount = page.getByTestId("char-count");
    this.readyToGenerateMessage = page.getByTestId("ready-to-generate");

    // Model selection
    this.modelSelectTrigger = page.getByTestId("model-select-trigger");
    this.modelSelectContent = page.getByTestId("model-select-content");

    // Submit button
    this.generateButton = page.getByTestId("generate-flashcards-button");
    this.loadingSpinner = page.getByTestId("loading-spinner");
  }

  /**
   * Fill the source text input
   */
  async fillSourceText(text: string) {
    await this.sourceTextInput.clear();
    await this.sourceTextInput.fill(text);
    // Trigger blur to ensure React onChange fires
    await this.sourceTextInput.blur();
  }

  /**
   * Clear the source text input
   */
  async clearSourceText() {
    await this.sourceTextInput.clear();
  }

  /**
   * Get the current character count
   */
  async getCharCount(): Promise<string> {
    return (await this.charCount.textContent()) || "";
  }

  /**
   * Check if the form is ready to generate (has valid text length)
   */
  async isReadyToGenerate(): Promise<boolean> {
    return await this.readyToGenerateMessage.isVisible();
  }

  /**
   * Select a model from the dropdown
   * @param modelId - Full model ID (e.g., "openai/gpt-4o-mini")
   */
  async selectModel(modelId: string) {
    // Check if dropdown is already open
    const isOpen = await this.modelSelectContent.isVisible().catch(() => false);

    // Open dropdown if not already open
    if (!isOpen) {
      await this.modelSelectTrigger.click();
      // Wait for the dropdown content to be visible
      await this.modelSelectContent.waitFor({ state: "visible", timeout: 5000 });
    }

    // Wait for the specific option to be visible
    const option = this.page.getByTestId(`model-option-${modelId}`);
    await option.waitFor({ state: "visible", timeout: 5000 });
    await option.click();

    // Wait for dropdown to close after selection
    await this.modelSelectContent.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }

  /**
   * Get a specific model option locator
   */
  getModelOption(modelId: string): Locator {
    return this.page.getByTestId(`model-option-${modelId}`);
  }

  /**
   * Click the generate button
   */
  async clickGenerate() {
    // Wait for button to be enabled before clicking
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

  /**
   * Check if the generate button is enabled
   */
  async isGenerateButtonEnabled(): Promise<boolean> {
    return await this.generateButton.isEnabled();
  }

  /**
   * Check if generation is in progress (loading spinner visible)
   */
  async isGenerating(): Promise<boolean> {
    return await this.loadingSpinner.isVisible().catch(() => false);
  }

  /**
   * Wait for generation to complete
   * @param timeout - Maximum time to wait in milliseconds (default: 30000)
   */
  async waitForGenerationComplete(timeout = 30000) {
    // Wait for loading spinner to appear first
    await this.loadingSpinner.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
      // Spinner might not appear if generation is very fast
    });

    // Wait for loading spinner to disappear
    await this.loadingSpinner.waitFor({ state: "hidden", timeout });
  }

  /**
   * Fill form and submit to generate flashcards
   * @param text - Source text (minimum 1000 characters)
   * @param modelId - Model ID to use (e.g., "openai/gpt-4o-mini")
   */
  async generateFlashcards(text: string, modelId: string) {
    await this.fillSourceText(text);
    await this.selectModel(modelId);
    await this.clickGenerate();
  }

  /**
   * Wait for the form to be ready
   */
  async waitForReady() {
    await this.container.waitFor({ state: "visible" });
    await this.sourceTextInput.waitFor({ state: "visible" });
  }

  /**
   * Get the current value of the source text input
   */
  async getSourceTextValue(): Promise<string> {
    return await this.sourceTextInput.inputValue();
  }

  /**
   * Check if the form container is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible();
  }
}
