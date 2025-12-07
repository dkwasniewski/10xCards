import { test, expect } from "@playwright/test";

/**
 * Example E2E test demonstrating Playwright best practices
 * Following guidelines: Page Object Model, locators, assertions
 */

test.describe("Homepage", () => {
  test("should load successfully", async ({ page }) => {
    // Navigate to the homepage
    await page.goto("/");

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify the page title or heading
    await expect(page).toHaveTitle(/10xCards/i);
  });

  test("should have navigation header", async ({ page }) => {
    await page.goto("/");

    // Use role-based locators for better accessibility
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();
  });
});

// Example of visual regression testing (uncomment when ready)
// test('visual regression - homepage', async ({ page }) => {
//   await page.goto('/');
//   await expect(page).toHaveScreenshot('homepage.png');
// });

