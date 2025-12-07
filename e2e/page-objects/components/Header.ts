import { Page, Locator } from "@playwright/test";

/**
 * Header Component
 * Represents the application header with navigation
 */
export class Header {
  readonly page: Page;
  readonly logo: Locator;
  readonly generateNavLink: Locator;
  readonly myFlashcardsNavLink: Locator;
  readonly userMenuButton: Locator;
  readonly dropdownMyFlashcardsLink: Locator;
  readonly dropdownGenerateLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Logo
    this.logo = page.getByRole("link", { name: /10xCards/i });

    // Navigation links (visible on desktop)
    this.generateNavLink = page.getByRole("link", { name: /^Generate$/i }).first();
    this.myFlashcardsNavLink = page.getByTestId("nav-my-flashcards");

    // User menu
    this.userMenuButton = page.getByRole("button").filter({ hasText: /^[A-Z]$/ }); // Avatar with initial

    // Dropdown menu items
    this.dropdownGenerateLink = page.getByRole("menuitem", { name: /generate/i });
    this.dropdownMyFlashcardsLink = page.getByTestId("dropdown-my-flashcards");
    this.logoutButton = page.getByRole("menuitem", { name: /log out/i });
  }

  /**
   * Navigate to Generate page via nav link
   */
  async goToGenerate() {
    await this.generateNavLink.click();
  }

  /**
   * Navigate to My Flashcards page via nav link
   */
  async goToMyFlashcards() {
    await this.myFlashcardsNavLink.click();
  }

  /**
   * Open the user menu dropdown
   */
  async openUserMenu() {
    await this.userMenuButton.click();
  }

  /**
   * Navigate to My Flashcards via dropdown menu
   */
  async goToMyFlashcardsViaDropdown() {
    await this.openUserMenu();
    await this.dropdownMyFlashcardsLink.click();
  }

  /**
   * Navigate to Generate via dropdown menu
   */
  async goToGenerateViaDropdown() {
    await this.openUserMenu();
    await this.dropdownGenerateLink.click();
  }

  /**
   * Logout via dropdown menu
   */
  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
    // Wait for redirect
    await this.page.waitForURL("/", { timeout: 5000 });
  }

  /**
   * Check if user is logged in (user menu button is visible)
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.userMenuButton.isVisible();
  }

  /**
   * Check if navigation links are visible
   */
  async areNavLinksVisible(): Promise<boolean> {
    return await this.myFlashcardsNavLink.isVisible();
  }

  /**
   * Get the user's initial from the avatar
   */
  async getUserInitial(): Promise<string> {
    return (await this.userMenuButton.textContent()) || "";
  }
}

