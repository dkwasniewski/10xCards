import { Page, Locator } from "@playwright/test";

/**
 * Flashcard Row Component
 * Represents a single flashcard in the list
 */
export class FlashcardRow {
  readonly page: Page;
  readonly row: Locator;
  readonly checkbox: Locator;
  readonly sourceBadge: Locator;
  readonly frontText: Locator;
  readonly backText: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly expandButton: Locator;

  constructor(page: Page, rowLocator: Locator) {
    this.page = page;
    this.row = rowLocator;

    // Elements within the row
    // The row has both mobile and desktop layouts with duplicate test IDs
    // We filter to only visible elements to get the correct layout for current viewport
    this.checkbox = this.row.getByRole("checkbox");
    this.sourceBadge = this.row.getByTestId("flashcard-source").locator("visible=true").first();
    this.frontText = this.row.getByTestId("flashcard-front").locator("visible=true").first();
    this.backText = this.row.getByTestId("flashcard-back").locator("visible=true").first();
    this.editButton = this.row.getByRole("button", { name: /edit/i }).locator("visible=true").first();
    this.deleteButton = this.row.getByRole("button", { name: /delete/i }).locator("visible=true").first();
    this.expandButton = this.row.getByRole("button", { name: /show more|show less/i });
  }

  /**
   * Get the flashcard ID from the row
   */
  async getId(): Promise<string | null> {
    return await this.row.getAttribute("data-flashcard-id");
  }

  /**
   * Get the front text content
   */
  async getFrontText(): Promise<string> {
    return (await this.frontText.textContent()) || "";
  }

  /**
   * Get the back text content
   */
  async getBackText(): Promise<string> {
    return (await this.backText.textContent()) || "";
  }

  /**
   * Get the source badge text (AI or Manual)
   */
  async getSource(): Promise<string> {
    return (await this.sourceBadge.textContent()) || "";
  }

  /**
   * Check if the flashcard is from AI
   */
  async isAIGenerated(): Promise<boolean> {
    const source = await this.getSource();
    return source.toLowerCase().includes("ai");
  }

  /**
   * Check if the flashcard is manually created
   */
  async isManual(): Promise<boolean> {
    const source = await this.getSource();
    return source.toLowerCase().includes("manual");
  }

  /**
   * Select the flashcard
   */
  async select() {
    await this.checkbox.check();
  }

  /**
   * Deselect the flashcard
   */
  async deselect() {
    await this.checkbox.uncheck();
  }

  /**
   * Toggle selection
   */
  async toggleSelection() {
    await this.checkbox.click();
  }

  /**
   * Check if the flashcard is selected
   */
  async isSelected(): Promise<boolean> {
    return await this.checkbox.isChecked();
  }

  /**
   * Click the edit button
   */
  async clickEdit() {
    await this.editButton.click();
  }

  /**
   * Click the delete button
   */
  async clickDelete() {
    await this.deleteButton.click();
  }

  /**
   * Expand the flashcard to show full text
   */
  async expand() {
    const isExpandable = await this.expandButton.isVisible();
    if (isExpandable) {
      const buttonText = await this.expandButton.textContent();
      if (buttonText?.toLowerCase().includes("more")) {
        await this.expandButton.click();
      }
    }
  }

  /**
   * Collapse the flashcard
   */
  async collapse() {
    const isExpandable = await this.expandButton.isVisible();
    if (isExpandable) {
      const buttonText = await this.expandButton.textContent();
      if (buttonText?.toLowerCase().includes("less")) {
        await this.expandButton.click();
      }
    }
  }

  /**
   * Check if the row is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.row.isVisible();
  }

  /**
   * Wait for the row to be visible
   */
  async waitForVisible() {
    await this.row.waitFor({ state: "visible" });
  }

  /**
   * Check if the flashcard has "Show more" button (text is truncated)
   */
  async isTruncated(): Promise<boolean> {
    return await this.expandButton.isVisible();
  }

  /**
   * Get full flashcard data
   */
  async getData(): Promise<{
    id: string | null;
    front: string;
    back: string;
    source: string;
    isSelected: boolean;
  }> {
    return {
      id: await this.getId(),
      front: await this.getFrontText(),
      back: await this.getBackText(),
      source: await this.getSource(),
      isSelected: await this.isSelected(),
    };
  }
}
