import { Page, Locator } from "@playwright/test";
import { CandidateRow } from "./CandidateRow";

/**
 * Candidates List Component
 * Represents a list of candidate flashcards (pending or newly generated)
 */
export class CandidatesList {
  readonly page: Page;
  readonly container: Locator;
  readonly listHeader: Locator;
  readonly selectAllCheckbox: Locator;
  readonly rowsContainer: Locator;
  readonly loadingIndicator: Locator;
  readonly emptyState: Locator;
  readonly testIdPrefix: string;

  constructor(page: Page, testIdPrefix = "candidate") {
    this.page = page;
    this.testIdPrefix = testIdPrefix;
    this.container = page.getByTestId(`${testIdPrefix}-list`);
    this.listHeader = page.getByTestId(`${testIdPrefix}-list-header`);
    this.selectAllCheckbox = page.getByTestId(`${testIdPrefix}-select-all-checkbox`);
    this.rowsContainer = page.getByTestId(`${testIdPrefix}-rows-container`);
    this.loadingIndicator = page.getByTestId(`${testIdPrefix}-list-loading`);
    this.emptyState = page.getByTestId(`${testIdPrefix}-list-empty`);
  }

  /**
   * Get all candidate rows
   */
  getAllRows(): Locator {
    return this.container.getByTestId("candidate-row");
  }

  /**
   * Get a specific candidate row by index (0-based)
   */
  getRowByIndex(index: number): CandidateRow {
    const rowLocator = this.getAllRows().nth(index);
    return new CandidateRow(this.page, rowLocator);
  }

  /**
   * Get the first candidate row
   */
  getFirstRow(): CandidateRow {
    return this.getRowByIndex(0);
  }

  /**
   * Get the last candidate row
   */
  async getLastRow(): Promise<CandidateRow> {
    const count = await this.getRowCount();
    return this.getRowByIndex(count - 1);
  }

  /**
   * Get the count of candidate rows
   */
  async getRowCount(): Promise<number> {
    return await this.getAllRows().count();
  }

  /**
   * Check if the list is empty
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible().catch(() => false);
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
   * Select all candidates
   */
  async selectAll() {
    await this.selectAllCheckbox.check();
  }

  /**
   * Deselect all candidates
   */
  async deselectAll() {
    await this.selectAllCheckbox.uncheck();
  }

  /**
   * Get all candidate front texts
   */
  async getAllFrontTexts(): Promise<string[]> {
    const count = await this.getRowCount();
    const texts: string[] = [];

    for (let i = 0; i < count; i++) {
      const row = this.getRowByIndex(i);
      texts.push(await row.getFrontText());
    }

    return texts;
  }

  /**
   * Get all candidate back texts
   */
  async getAllBackTexts(): Promise<string[]> {
    const count = await this.getRowCount();
    const texts: string[] = [];

    for (let i = 0; i < count; i++) {
      const row = this.getRowByIndex(i);
      texts.push(await row.getBackText());
    }

    return texts;
  }

  /**
   * Find a candidate row by front text
   */
  async findRowByFrontText(text: string): Promise<CandidateRow | null> {
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
   * Check if a candidate with specific front text exists
   */
  async hasCandidateWithFront(text: string): Promise<boolean> {
    const row = await this.findRowByFrontText(text);
    return row !== null;
  }

  /**
   * Accept all visible candidates
   */
  async acceptAll() {
    const count = await this.getRowCount();

    for (let i = 0; i < count; i++) {
      const row = this.getRowByIndex(0); // Always get first as they disappear after accept
      await row.accept();
      await row.waitForDisappear().catch(() => {}); // Wait for row to disappear
    }
  }

  /**
   * Reject all visible candidates
   */
  async rejectAll() {
    const count = await this.getRowCount();

    for (let i = 0; i < count; i++) {
      const row = this.getRowByIndex(0); // Always get first as they disappear after reject
      await row.reject();
      await row.waitForDisappear().catch(() => {}); // Wait for row to disappear
    }
  }

  /**
   * Wait for candidates to appear
   * @param minCount - Minimum number of candidates expected
   * @param timeout - Maximum time to wait in milliseconds
   */
  async waitForCandidates(minCount = 1, timeout = 5000) {
    await this.page.waitForFunction(
      ({ testIdPrefix, min }) => {
        const container = document.querySelector(`[data-testid="${testIdPrefix}-list"]`);
        if (!container) return false;
        const rows = container.querySelectorAll('[data-testid="candidate-row"]');
        return rows.length >= min;
      },
      { testIdPrefix: this.testIdPrefix, min: minCount },
      { timeout }
    );
  }

  /**
   * Check if the list container is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible();
  }

  /**
   * Wait for the list to be visible
   */
  async waitForVisible() {
    await this.container.waitFor({ state: "visible" });
  }
}
