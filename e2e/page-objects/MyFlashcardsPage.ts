import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { FlashcardEditorDialog } from "./components/FlashcardEditorDialog";
import { FlashcardsList } from "./components/FlashcardsList";

/**
 * My Flashcards Page Object Model
 * Represents the main flashcards management page
 */
export class MyFlashcardsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly newFlashcardButton: Locator;
  readonly searchInput: Locator;
  readonly searchClearButton: Locator;
  readonly loadingIndicator: Locator;

  // Component objects
  readonly flashcardsList: FlashcardsList;
  readonly editorDialog: FlashcardEditorDialog;

  constructor(page: Page) {
    super(page);

    // Main page elements
    this.pageTitle = page.getByTestId("page-title");
    this.newFlashcardButton = page.getByTestId("new-flashcard-button");
    this.searchInput = page.getByPlaceholder(/search flashcards/i);
    this.searchClearButton = page.getByRole("button", { name: /clear search/i });
    this.loadingIndicator = page.getByTestId("flashcards-loading");

    // Initialize component objects
    this.flashcardsList = new FlashcardsList(page);
    this.editorDialog = new FlashcardEditorDialog(page);
  }

  async goto() {
    await super.goto("/flashcards");
  }

  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad() {
    await this.pageTitle.waitFor({ state: "visible" });
    // Wait for either loading indicator to disappear or list to appear
    await Promise.race([
      this.loadingIndicator.waitFor({ state: "hidden" }).catch(() => {
        // Ignore if loading indicator doesn't exist
      }),
      this.flashcardsList.container.waitFor({ state: "visible" }).catch(() => {
        // Ignore if container doesn't appear immediately
      }),
    ]);
  }

  /**
   * Click the "New Flashcard" button to open create dialog
   * Note: Caller should wait for dialog to appear after clicking
   */
  async clickNewFlashcard() {
    await this.newFlashcardButton.click();
  }

  /**
   * Search for flashcards
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounce and results to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear the search
   */
  async clearSearch() {
    await this.searchClearButton.click();
  }

  /**
   * Check if page title is visible
   */
  async isPageTitleVisible(): Promise<boolean> {
    return await this.pageTitle.isVisible();
  }

  /**
   * Get the page title text
   */
  async getPageTitle(): Promise<string> {
    return (await this.pageTitle.textContent()) || "";
  }

  /**
   * Check if loading indicator is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible().catch(() => false);
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    await this.loadingIndicator.waitFor({ state: "hidden" }).catch(() => {
      // Ignore if loading indicator doesn't exist
    });
  }
}
