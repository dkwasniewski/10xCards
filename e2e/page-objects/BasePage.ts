import { Page } from "@playwright/test";

/**
 * Base Page Object Model class
 * Following Playwright best practices for maintainable tests
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path = "/") {
    await this.page.goto(path);
    await this.page.waitForLoadState("networkidle");
  }

  async getTitle() {
    return await this.page.title();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
