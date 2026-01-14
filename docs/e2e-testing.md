# E2E Testing Guide

This guide explains how to run and write E2E tests using Playwright.

## Setup

### Installation

E2E tests use Playwright. Install dependencies:

```bash
pnpm install
pnpm exec playwright install
```

## Running Tests

### Run All Tests

```bash
pnpm test:e2e
```

### Run Tests in UI Mode

```bash
pnpm test:e2e:ui
```

### Run Tests in Debug Mode

```bash
pnpm test:e2e:debug
```

### Run Specific Test File

```bash
pnpm exec playwright test e2e/wallet-connection.spec.ts
```

### Run Tests in Specific Browser

```bash
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit
```

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Test code here
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Common Patterns

#### Navigation

```typescript
await page.goto('/');
await page.goto('/smart-wallet');
```

#### Element Interaction

```typescript
// Click
await page.click('button');

// Fill input
await page.fill('input[name="address"]', '0x123...');

// Select option
await page.selectOption('select', 'value');
```

#### Assertions

```typescript
// Visibility
await expect(page.locator('.element')).toBeVisible();

// Text content
await expect(page.locator('h1')).toHaveText('Title');

// Value
await expect(page.locator('input')).toHaveValue('value');
```

#### Waiting

```typescript
// Wait for element
await page.waitForSelector('.element');

// Wait for navigation
await page.waitForNavigation();

// Wait for network
await page.waitForLoadState('networkidle');
```

## Test Files

### Current Test Files

- `e2e/example.spec.ts` - Basic application tests
- `e2e/wallet-connection.spec.ts` - Wallet connection flow
- `e2e/smart-wallet.spec.ts` - Smart wallet functionality

### Adding New Tests

1. Create a new file in `e2e/` directory
2. Name it `feature-name.spec.ts`
3. Write tests following the structure above
4. Run tests to verify

## CI/CD Integration

E2E tests run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Manual workflow dispatch

See `.github/workflows/e2e.yml` for configuration.

## Best Practices

### 1. Use Descriptive Test Names

```typescript
// Good
test('should display error when address is invalid', ...);

// Bad
test('test1', ...);
```

### 2. Use Data Attributes for Selectors

```typescript
// Good
await page.click('[data-testid="connect-button"]');

// Avoid
await page.click('.btn-primary');
```

### 3. Keep Tests Independent

Each test should be able to run independently without relying on other tests.

### 4. Clean Up After Tests

```typescript
test.afterEach(async ({ page }) => {
  // Cleanup code
});
```

### 5. Use Page Object Model for Complex Flows

```typescript
class WalletPage {
  constructor(private page: Page) {}
  
  async connectWallet(address: string) {
    await this.page.fill('[data-testid="address-input"]', address);
    await this.page.click('[data-testid="connect-button"]');
  }
}
```

## Debugging

### Visual Debugging

```bash
pnpm test:e2e:ui
```

### Screenshots

Screenshots are automatically taken on test failure.

### Videos

Videos are recorded for failed tests.

### Trace Viewer

```bash
pnpm exec playwright show-trace trace.zip
```

## Performance Testing

### Measure Load Time

```typescript
test('should load quickly', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Configuration](../playwright.config.ts)
