import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Login Page Object Model
 * Demonstrates resilient element selection with locators
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Use role-based and label-based locators for resilience
    this.emailInput = page.getByLabel(/email/i);
    // Use getByRole with name to avoid matching the "Show password" button
    this.passwordInput = page.getByRole("textbox", { name: /password/i });
    this.submitButton = page.getByRole("button", { name: /log in|sign in/i });
    this.errorMessage = page.getByRole("alert");
  }

  async goto() {
    await super.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  async isErrorVisible() {
    return await this.errorMessage.isVisible();
  }
}
