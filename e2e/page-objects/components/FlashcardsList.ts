import { Page, Locator } from "@playwright/test";
import { FlashcardRow } from "./FlashcardRow";

/**
 * Flashcards List Component
 * Represents the list of flashcards with all rows
 */
export class FlashcardsList {
  readonly page: Page;
  readonly container: Locator;
  readonly loadingIndicator: Locator;
  readonly emptyState: Locator;
  readonly selectAllCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("flashcards-list");
    this.loadingIndicator = page.getByTestId("flashcards-loading");
    this.emptyState = page.getByText(/no flashcards/i);
    this.selectAllCheckbox = page.getByRole("checkbox", { name: /select all/i });
  }

  /**
   * Get all flashcard rows
   */
  getAllRows(): Locator {
    return this.page.getByTestId("flashcard-row");
  }

  /**
   * Get a specific flashcard row by index (0-based)
   */
  getRowByIndex(index: number): FlashcardRow {
    const rowLocator = this.getAllRows().nth(index);
    return new FlashcardRow(this.page, rowLocator);
  }

  /**
   * Get a specific flashcard row by ID
   */
  getRowById(id: string): FlashcardRow {
    const rowLocator = this.page.locator(`[data-testid="flashcard-row"][data-flashcard-id="${id}"]`);
    return new FlashcardRow(this.page, rowLocator);
  }

  /**
   * Get the first flashcard row (most recently created)
   */
  getFirstRow(): FlashcardRow {
    return this.getRowByIndex(0);
  }

  /**
   * Get the count of flashcard rows
   */
  async getRowCount(): Promise<number> {
    return await this.getAllRows().count();
  }

  /**
   * Check if the list is empty
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Check if the list is loading
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible().catch(() => false);
  }

  /**
   * Wait for the list to load
   */
  async waitForLoad() {
    await this.loadingIndicator.waitFor({ state: "hidden" }).catch(() => {});
    await this.container.waitFor({ state: "visible" }).catch(() => {});
  }

  /**
   * Select all flashcards
   */
  async selectAll() {
    await this.selectAllCheckbox.check();
  }

  /**
   * Deselect all flashcards
   */
  async deselectAll() {
    await this.selectAllCheckbox.uncheck();
  }

  /**
   * Get all flashcard front texts
   */
  async getAllFrontTexts(): Promise<string[]> {
    const rows = this.getAllRows();
    const count = await rows.count();
    const texts: string[] = [];

    for (let i = 0; i < count; i++) {
      const row = this.getRowByIndex(i);
      texts.push(await row.getFrontText());
    }

    return texts;
  }

  /**
   * Get all flashcard back texts
   */
  async getAllBackTexts(): Promise<string[]> {
    const rows = this.getAllRows();
    const count = await rows.count();
    const texts: string[] = [];

    for (let i = 0; i < count; i++) {
      const row = this.getRowByIndex(i);
      texts.push(await row.getBackText());
    }

    return texts;
  }

  /**
   * Find a flashcard row by front text
   */
  async findRowByFrontText(text: string): Promise<FlashcardRow | null> {
    const count = await this.getRowCount();

    for (let i = 0; i < count; i++) {
      const row = this.getRowByIndex(i);
      const frontText = await row.getFrontText();

      if (frontText.includes(text)) {
        return row;
      }
    }

    return null;
  }

  /**
   * Check if a flashcard with specific front text exists
   */
  async hasFlashcardWithFront(text: string): Promise<boolean> {
    const row = await this.findRowByFrontText(text);
    return row !== null;
  }

  /**
   * Wait for a new flashcard to appear at the top
   */
  async waitForNewFlashcard(expectedFront: string, timeout = 5000) {
    await this.page.waitForFunction(
      ({ frontText }) => {
        const firstRow = document.querySelector('[data-testid="flashcard-row"]');
        if (!firstRow) return false;

        const frontElement = firstRow.querySelector('[data-testid="flashcard-front"]');
        if (!frontElement) return false;

        return frontElement.textContent?.includes(frontText) || false;
      },
      { frontText: expectedFront },
      { timeout }
    );
  }
}
