import { test, expect } from "@playwright/test";
import { LandingPage } from "./page-objects";

/**
 * Landing Page E2E Tests
 * Tests the public landing page for unauthenticated users
 */

test.describe("Landing Page", () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
  });

  test("should load successfully and display page title", async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify the page title
    await expect(page).toHaveTitle(/10xCards.*Create Flashcards Effortlessly with AI/i);
  });

  test("should have navigation header with brand and CTAs", async ({ page }) => {
    // Use role-based locators for better accessibility
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();

    // Verify brand name is visible
    const brandName = page.getByText("10xCards");
    await expect(brandName).toBeVisible();

    // Verify Sign In and Sign Up buttons are in header
    const headerSignIn = page.getByRole("link", { name: /sign in/i }).first();
    const headerSignUp = page.getByRole("link", { name: /sign up/i });
    await expect(headerSignIn).toBeVisible();
    await expect(headerSignUp).toBeVisible();
  });

  test("should display hero section with headline and CTAs", async () => {
    await landingPage.waitForPageLoad();

    // Verify hero headline
    await expect(landingPage.heroHeadline).toBeVisible();
    await expect(landingPage.heroHeadline).toHaveText(/create flashcards effortlessly with ai/i);

    // Verify subheadline
    await expect(landingPage.heroSubheadline).toBeVisible();

    // Verify CTAs
    await expect(landingPage.getStartedButton).toBeVisible();
    await expect(landingPage.signInButton).toBeVisible();
  });

  test("should display visual examples of flashcards", async () => {
    await landingPage.waitForPageLoad();

    // Verify example flashcards are visible
    await expect(landingPage.flashcardExample1).toBeVisible();
    await expect(landingPage.flashcardExample2).toBeVisible();
  });

  test("should display all three feature cards", async () => {
    await landingPage.waitForPageLoad();

    // Verify features heading
    await expect(landingPage.featuresHeading).toBeVisible();

    // Verify all three feature cards
    await expect(landingPage.aiGenerationFeature).toBeVisible();
    await expect(landingPage.smartReviewFeature).toBeVisible();
    await expect(landingPage.organizedLibraryFeature).toBeVisible();
  });

  test("should display 'How It Works' section with 3 steps", async () => {
    await landingPage.waitForPageLoad();

    // Verify section heading
    await expect(landingPage.howItWorksHeading).toBeVisible();

    // Verify all three steps
    await expect(landingPage.step1).toBeVisible();
    await expect(landingPage.step2).toBeVisible();
    await expect(landingPage.step3).toBeVisible();
  });

  test("should display final CTA section", async () => {
    await landingPage.waitForPageLoad();

    // Verify final CTA heading
    await expect(landingPage.finalCtaHeading).toBeVisible();

    // Verify final CTA buttons
    await expect(landingPage.finalCtaGetStarted).toBeVisible();
    await expect(landingPage.finalCtaSignIn).toBeVisible();
  });

  test("should navigate to register page when clicking Get Started", async ({ page }) => {
    await landingPage.waitForPageLoad();

    // Click Get Started button
    await landingPage.clickGetStarted();

    // Verify navigation to register page
    await expect(page).toHaveURL(/\/register/);
  });

  test("should navigate to login page when clicking Sign In", async ({ page }) => {
    await landingPage.waitForPageLoad();

    // Click Sign In button
    await landingPage.clickSignIn();

    // Verify navigation to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should navigate to register page from final CTA", async ({ page }) => {
    await landingPage.waitForPageLoad();

    // Scroll to final CTA section
    await landingPage.finalCtaGetStarted.scrollIntoViewIfNeeded();

    // Click final Get Started button
    await landingPage.clickFinalGetStarted();

    // Verify navigation to register page
    await expect(page).toHaveURL(/\/register/);
  });

  test("should navigate to login page from final CTA", async ({ page }) => {
    await landingPage.waitForPageLoad();

    // Scroll to final CTA section
    await landingPage.finalCtaSignIn.scrollIntoViewIfNeeded();

    // Click final Sign In button
    await landingPage.clickFinalSignIn();

    // Verify navigation to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should display all sections in correct order", async () => {
    await landingPage.verifyAllSectionsVisible();

    // All sections should be visible
    await expect(landingPage.heroHeadline).toBeVisible();
    await expect(landingPage.featuresHeading).toBeVisible();
    await expect(landingPage.howItWorksHeading).toBeVisible();
    await expect(landingPage.finalCtaHeading).toBeVisible();
  });

  test("should have proper responsive layout on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await landingPage.waitForPageLoad();

    // Verify key elements are still visible on mobile
    await expect(landingPage.heroHeadline).toBeVisible();
    await expect(landingPage.getStartedButton).toBeVisible();
    await expect(landingPage.aiGenerationFeature).toBeVisible();
    await expect(landingPage.step1).toBeVisible();
  });

  test("should have proper responsive layout on tablet", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await landingPage.waitForPageLoad();

    // Verify all sections are visible on tablet
    await landingPage.verifyAllSectionsVisible();
  });
});
