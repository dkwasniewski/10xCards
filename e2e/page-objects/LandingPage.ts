import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Landing Page Object Model
 * Represents the public landing page at / for unauthenticated users
 */
export class LandingPage extends BasePage {
  // Hero section
  readonly heroHeadline: Locator;
  readonly heroSubheadline: Locator;
  readonly getStartedButton: Locator;
  readonly signInButton: Locator;

  // Visual example section
  readonly flashcardExample1: Locator;
  readonly flashcardExample2: Locator;

  // Features section
  readonly featuresHeading: Locator;
  readonly aiGenerationFeature: Locator;
  readonly smartReviewFeature: Locator;
  readonly organizedLibraryFeature: Locator;

  // How it works section
  readonly howItWorksHeading: Locator;
  readonly step1: Locator;
  readonly step2: Locator;
  readonly step3: Locator;

  // Final CTA section
  readonly finalCtaHeading: Locator;
  readonly finalCtaGetStarted: Locator;
  readonly finalCtaSignIn: Locator;

  constructor(page: Page) {
    super(page);

    // Hero section
    this.heroHeadline = page.getByRole("heading", { name: /create flashcards effortlessly with ai/i });
    this.heroSubheadline = page.getByText(/transform any text into study-ready flashcards/i);
    this.getStartedButton = page.getByRole("link", { name: /get started free/i }).first();
    this.signInButton = page.getByRole("link", { name: /sign in/i }).first();

    // Visual example section - using text content to identify cards
    this.flashcardExample1 = page.getByText(/what is photosynthesis/i);
    this.flashcardExample2 = page.getByText(/define mitosis/i);

    // Features section
    this.featuresHeading = page.getByRole("heading", {
      name: /everything you need to create flashcards efficiently/i,
    });
    this.aiGenerationFeature = page.getByRole("heading", { name: /ai-powered generation/i });
    this.smartReviewFeature = page.getByRole("heading", { name: /smart review & editing/i });
    this.organizedLibraryFeature = page.getByRole("heading", { name: /organized library/i });

    // How it works section
    this.howItWorksHeading = page.getByRole("heading", { name: /^how it works$/i });
    this.step1 = page.getByRole("heading", { name: /paste your text/i });
    this.step2 = page.getByRole("heading", { name: /review ai suggestions/i });
    this.step3 = page.getByRole("heading", { name: /manage your library/i });

    // Final CTA section
    this.finalCtaHeading = page.getByRole("heading", { name: /ready to supercharge your studying/i });
    this.finalCtaGetStarted = page.getByRole("link", { name: /get started free/i }).last();
    this.finalCtaSignIn = page.getByRole("link", { name: /sign in/i }).last();
  }

  async goto() {
    await super.goto("/");
  }

  /**
   * Click "Get Started Free" button in hero section
   */
  async clickGetStarted() {
    await this.getStartedButton.click();
  }

  /**
   * Click "Sign In" button in hero section
   */
  async clickSignIn() {
    await this.signInButton.click();
  }

  /**
   * Click "Get Started Free" button in final CTA section
   */
  async clickFinalGetStarted() {
    await this.finalCtaGetStarted.click();
  }

  /**
   * Click "Sign In" button in final CTA section
   */
  async clickFinalSignIn() {
    await this.finalCtaSignIn.click();
  }

  /**
   * Wait for landing page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.heroHeadline.waitFor({ state: "visible" });
  }

  /**
   * Verify all main sections are visible
   */
  async verifyAllSectionsVisible() {
    await this.heroHeadline.waitFor({ state: "visible" });
    await this.featuresHeading.waitFor({ state: "visible" });
    await this.howItWorksHeading.waitFor({ state: "visible" });
    await this.finalCtaHeading.waitFor({ state: "visible" });
  }
}
