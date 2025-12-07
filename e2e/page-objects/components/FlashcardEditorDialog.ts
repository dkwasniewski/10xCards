import { Page, Locator } from "@playwright/test";

/**
 * Flashcard Editor Dialog Component
 * Handles both create and edit modes
 */
export class FlashcardEditorDialog {
  readonly page: Page;

  // Dialog elements
  readonly createDialog: Locator;
  readonly editDialog: Locator;
  readonly dialogTitle: Locator;
  readonly frontInput: Locator;
  readonly backInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;

    // Dialog containers
    this.createDialog = page.getByTestId("create-flashcard-dialog");
    this.editDialog = page.getByTestId("edit-flashcard-dialog");
    this.dialogTitle = page.getByTestId("dialog-title");

    // Form inputs
    this.frontInput = page.getByTestId("flashcard-front-input");
    this.backInput = page.getByTestId("flashcard-back-input");

    // Action buttons
    this.submitButton = page.getByTestId("create-flashcard-submit");
    this.cancelButton = page.getByTestId("dialog-cancel-button");
    this.loadingSpinner = page.getByTestId("submit-loading-spinner");
  }

  /**
   * Wait for dialog to open
   */
  async waitForDialogOpen(mode: "create" | "edit" = "create") {
    const dialog = mode === "create" ? this.createDialog : this.editDialog;
    await dialog.waitFor({ state: "visible" });
  }

  /**
   * Wait for dialog to close
   */
  async waitForDialogClose() {
    await Promise.race([this.createDialog.waitFor({ state: "hidden" }), this.editDialog.waitFor({ state: "hidden" })]);
  }

  /**
   * Check if create dialog is visible
   */
  async isCreateDialogVisible(): Promise<boolean> {
    return await this.createDialog.isVisible();
  }

  /**
   * Check if edit dialog is visible
   */
  async isEditDialogVisible(): Promise<boolean> {
    return await this.editDialog.isVisible();
  }

  /**
   * Fill the front input field
   */
  async fillFront(text: string) {
    await this.frontInput.fill(text);
  }

  /**
   * Fill the back input field
   */
  async fillBack(text: string) {
    await this.backInput.fill(text);
  }

  /**
   * Fill both front and back fields
   */
  async fillFlashcard(front: string, back: string) {
    await this.fillFront(front);
    await this.fillBack(back);
  }

  /**
   * Get the front input value
   */
  async getFrontValue(): Promise<string> {
    return await this.frontInput.inputValue();
  }

  /**
   * Get the back input value
   */
  async getBackValue(): Promise<string> {
    return await this.backInput.inputValue();
  }

  /**
   * Click the submit button (Create or Save)
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * Click the cancel button
   */
  async clickCancel() {
    await this.cancelButton.click();
    await this.waitForDialogClose();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if loading spinner is visible (indicates submission in progress)
   */
  async isSubmitting(): Promise<boolean> {
    return await this.loadingSpinner.isVisible().catch(() => false);
  }

  /**
   * Wait for submission to complete
   */
  async waitForSubmissionComplete() {
    // Wait for spinner to appear (if it does)
    await this.page.waitForTimeout(100);

    // Wait for spinner to disappear
    await this.loadingSpinner.waitFor({ state: "hidden" }).catch(() => {});
  }

  /**
   * Get the dialog title text
   */
  async getDialogTitle(): Promise<string> {
    return (await this.dialogTitle.textContent()) || "";
  }

  /**
   * Create a new flashcard (complete flow)
   */
  async createFlashcard(front: string, back: string) {
    await this.waitForDialogOpen("create");
    await this.fillFlashcard(front, back);
    await this.clickSubmit();
    await this.waitForSubmissionComplete();
    await this.waitForDialogClose();
  }

  /**
   * Edit an existing flashcard (complete flow)
   */
  async editFlashcard(front: string, back: string) {
    await this.waitForDialogOpen("edit");
    await this.fillFlashcard(front, back);
    await this.clickSubmit();
    await this.waitForSubmissionComplete();
    await this.waitForDialogClose();
  }

  /**
   * Get character count for front field (calculated)
   */
  async getFrontCharCount(): Promise<number> {
    const value = await this.getFrontValue();
    return value.length;
  }

  /**
   * Get character count for back field (calculated)
   */
  async getBackCharCount(): Promise<number> {
    const value = await this.getBackValue();
    return value.length;
  }

  /**
   * Check if front field is at max length (200 chars)
   */
  async isFrontAtMaxLength(): Promise<boolean> {
    return (await this.getFrontCharCount()) >= 200;
  }

  /**
   * Check if back field is at max length (500 chars)
   */
  async isBackAtMaxLength(): Promise<boolean> {
    return (await this.getBackCharCount()) >= 500;
  }
}

