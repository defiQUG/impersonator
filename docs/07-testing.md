# Testing Guide

Comprehensive testing documentation for the Impersonator Smart Wallet system.

## Testing Overview

The project uses Jest as the testing framework with comprehensive test coverage including:
- Unit tests for utilities and helpers
- Integration tests for workflows
- Security tests for attack vectors
- Component tests for UI

## Test Structure

```
__tests__/
├── security.test.ts              # Security utility tests
├── encryption.test.ts            # Encryption tests
├── rateLimiter.test.ts           # Rate limiter tests
├── nonceManager.test.ts          # Nonce manager tests
└── integration/                  # Integration tests
    ├── walletManagement.test.ts
    ├── transactionFlow.test.ts
    └── multisigApproval.test.ts
```

## Running Tests

### All Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

### Specific Test Suites

```bash
# Security tests
pnpm test:security

# Integration tests
pnpm test:integration

# Specific test file
pnpm test __tests__/security.test.ts
```

### Test Options

```bash
# Run tests matching pattern
pnpm test -- --testNamePattern="address validation"

# Run tests in specific file
pnpm test -- __tests__/security.test.ts

# Update snapshots
pnpm test -- -u

# Verbose output
pnpm test -- --verbose
```

## Test Coverage

### Coverage Goals

- **Lines:** >80%
- **Functions:** >80%
- **Branches:** >75%
- **Statements:** >80%

### Viewing Coverage

```bash
# Generate coverage report
pnpm test:coverage

# Coverage report is in coverage/ directory
open coverage/lcov-report/index.html
```

### Current Coverage

- Security utilities: ~90%
- Encryption utilities: ~85%
- Rate limiter: ~90%
- Nonce manager: ~85%
- Overall: ~85%

## Writing Tests

### Unit Test Example

```typescript
import { validateAddress } from "@/utils/security";

describe("validateAddress", () => {
  it("should validate correct addresses", () => {
    const result = validateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
    expect(result.valid).toBe(true);
    expect(result.checksummed).toBeDefined();
  });

  it("should reject invalid addresses", () => {
    const result = validateAddress("invalid");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Integration Test Example

```typescript
describe("Wallet Management Flow", () => {
  it("should create wallet with valid configuration", async () => {
    const owners = ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"];
    const threshold = 1;

    // Validate owners
    const validatedOwners = owners.map(owner => {
      const validation = validateAddress(owner);
      expect(validation.valid).toBe(true);
      return validation.checksummed!;
    });

    // Validate threshold
    expect(threshold).toBeGreaterThan(0);
    expect(threshold).toBeLessThanOrEqual(validatedOwners.length);
  });
});
```

### Component Test Example

```typescript
import { render, screen } from "@testing-library/react";
import WalletManager from "@/components/SmartWallet/WalletManager";

describe("WalletManager", () => {
  it("should render wallet list", () => {
    render(<WalletManager />);
    expect(screen.getByText("Wallets")).toBeInTheDocument();
  });
});
```

## Test Patterns

### Mocking Providers

```typescript
class MockProvider extends ethers.providers.BaseProvider {
  async getNetwork() {
    return { chainId: 1, name: "mainnet" };
  }
  
  async perform(method: string, params: any): Promise<any> {
    throw new Error("Not implemented");
  }
}
```

### Testing Async Functions

```typescript
it("should handle async operations", async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Cases

```typescript
it("should handle errors", async () => {
  await expect(asyncFunction()).rejects.toThrow("Error message");
});
```

### Testing Hooks

```typescript
import { renderHook } from "@testing-library/react";
import { useSmartWallet } from "@/contexts/SmartWalletContext";

it("should return wallet context", () => {
  const { result } = renderHook(() => useSmartWallet());
  expect(result.current.activeWallet).toBeDefined();
});
```

## Test Categories

### Unit Tests

Test individual functions and utilities in isolation.

**Location:** `__tests__/*.test.ts`

**Examples:**
- Security utilities
- Encryption functions
- Validation functions
- Helper functions

### Integration Tests

Test complete workflows and component interactions.

**Location:** `__tests__/integration/*.test.ts`

**Examples:**
- Wallet management flow
- Transaction flow
- Multi-sig approval flow

### Security Tests

Test security features and attack vectors.

**Location:** `__tests__/security.test.ts`

**Examples:**
- XSS prevention
- Replay attack prevention
- Race condition prevention
- Integer overflow prevention

## Test Utilities

### Setup File

`jest.setup.js` configures:
- Testing library matchers
- Mock implementations
- Global test utilities

### Mock Implementations

```typescript
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```

## Best Practices

### 1. Test Structure

```typescript
describe("Feature", () => {
  describe("Sub-feature", () => {
    it("should do something", () => {
      // Arrange
      const input = "value";
      
      // Act
      const result = function(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### 2. Test Naming

- Use descriptive test names
- Start with "should"
- Describe expected behavior

```typescript
// ✅ Good
it("should validate correct addresses", () => {});

// ❌ Bad
it("test1", () => {});
```

### 3. Test Isolation

- Each test should be independent
- Don't rely on test execution order
- Clean up after tests

### 4. Test Coverage

- Aim for >80% coverage
- Test happy paths
- Test error cases
- Test edge cases

### 5. Mocking

- Mock external dependencies
- Mock async operations
- Mock browser APIs
- Keep mocks simple

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main/develop
- Scheduled runs

**CI Configuration:** `.github/workflows/ci.yml`

**CI Steps:**
1. Lint code
2. Run tests
3. Check coverage
4. Build project
5. Security audit

## Debugging Tests

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: current file",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${relativeFile}"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Debugging Tips

1. Use `console.log` for debugging
2. Use `debugger` statement
3. Run single test file
4. Use `--verbose` flag
5. Check test output carefully

## Test Maintenance

### Keeping Tests Updated

- Update tests when code changes
- Remove obsolete tests
- Refactor tests regularly
- Keep test data current

### Test Performance

- Keep tests fast (< 1 second each)
- Use mocks for slow operations
- Parallelize when possible
- Avoid unnecessary setup

## Common Issues

### Tests Failing

1. Check error messages
2. Verify test data
3. Check mocks
4. Review recent changes
5. Clear cache: `rm -rf node_modules/.cache`

### Coverage Issues

1. Check uncovered lines
2. Add missing tests
3. Review coverage report
4. Exclude unnecessary files

### Flaky Tests

1. Identify timing issues
2. Add proper waits
3. Use stable selectors
4. Avoid race conditions

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
