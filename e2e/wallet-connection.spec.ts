import { test, expect } from '@playwright/test';

/**
 * Wallet Connection E2E Tests
 * Tests the wallet connection flow
 */

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display WalletConnect tab', async ({ page }) => {
    // Check that WalletConnect option is available
    // Update selectors based on actual UI
    const walletConnectTab = page.locator('text=WalletConnect').first();
    await expect(walletConnectTab).toBeVisible();
  });

  test('should display iFrame tab', async ({ page }) => {
    // Check that iFrame option is available
    const iframeTab = page.locator('text=iFrame, text=IFrame').first();
    await expect(iframeTab).toBeVisible();
  });

  test('should allow address input', async ({ page }) => {
    // Check that address input field exists
    const addressInput = page.locator('input[placeholder*="address"], input[placeholder*="Address"]').first();
    await expect(addressInput).toBeVisible();
    
    // Test address input
    await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    await expect(addressInput).toHaveValue('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  });
});
