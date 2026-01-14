import { test, expect } from '@playwright/test';

/**
 * Example E2E Test
 * This is a template for creating E2E tests
 */

test.describe('Impersonator Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Impersonator/i);
    
    // Check that key elements are present
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display navbar', async ({ page }) => {
    // Check navbar is visible
    const navbar = page.locator('nav, [role="navigation"]').first();
    await expect(navbar).toBeVisible();
  });

  test('should have wallet connection options', async ({ page }) => {
    // Check that connection tabs/options are available
    // This is a placeholder - update based on actual UI
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
