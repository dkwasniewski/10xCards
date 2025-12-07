import { Page, Locator } from "@playwright/test";

/**
 * Candidate Row Component
 * Represents a single candidate flashcard row in the list
 */
export class CandidateRow {
  readonly page: Page;
  readonly row: Locator;
  readonly checkbox: Locator;
  readonly frontText: Locator;
  readonly backText: Locator;
  readonly acceptButton: Locator;
  readonly editButton: Locator;
  readonly rejectButton: Locator;

  constructor(page: Page, rowLocator: Locator) {
    this.page = page;
    this.row = rowLocator;

    // Elements within the row
    // The row has both mobile and desktop layouts with duplicate test IDs
    // We filter to only visible elements to get the correct layout for current viewport
    this.checkbox = this.row.getByTestId("candidate-checkbox");
    this.frontText = this.row.getByTestId("candidate-front").locator("visible=true").first();
    this.backText = this.row.getByTestId("candidate-back").locator("visible=true").first();
    this.acceptButton = this.row.getByTestId("candidate-accept-button").locator("visible=true").first();
    this.editButton = this.row.getByTestId("candidate-edit-button").locator("visible=true").first();
    this.rejectButton = this.row.getByTestId("candidate-reject-button").locator("visible=true").first();
  }

  /**
   * Get the front text of the candidate
   */
  async getFrontText(): Promise<string> {
    return (await this.frontText.textContent()) || "";
  }

  /**
   * Get the back text of the candidate
   */
  async getBackText(): Promise<string> {
    return (await this.backText.textContent()) || "";
  }

  /**
   * Check if the candidate is selected
   */
  async isSelected(): Promise<boolean> {
    return await this.checkbox.isChecked();
  }

  /**
   * Select the candidate
   */
  async select() {
    await this.checkbox.check();
  }

  /**
   * Deselect the candidate
   */
  async deselect() {
    await this.checkbox.uncheck();
  }

  /**
   * Toggle the selection state
   */
  async toggleSelection() {
    await this.checkbox.click();
  }

  /**
   * Accept the candidate (add to flashcards)
   */
  async accept() {
    await this.acceptButton.click();
  }

  /**
   * Edit the candidate
   */
  async edit() {
    await this.editButton.click();
  }

  /**
   * Reject the candidate
   */
  async reject() {
    await this.rejectButton.click();
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
   * Check if accept button is enabled
   */
  async isAcceptButtonEnabled(): Promise<boolean> {
    return await this.acceptButton.isEnabled();
  }

  /**
   * Check if edit button is enabled
   */
  async isEditButtonEnabled(): Promise<boolean> {
    return await this.editButton.isEnabled();
  }

  /**
   * Check if reject button is enabled
   */
  async isRejectButtonEnabled(): Promise<boolean> {
    return await this.rejectButton.isEnabled();
  }

  /**
   * Wait for the row to disappear (after accept/reject)
   * The row is removed from DOM after API call completes, not just hidden
   */
  async waitForDisappear(timeout: number = 10000) {
    await this.row.waitFor({ state: "detached", timeout });
  }
}


