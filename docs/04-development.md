# Development Guide

This guide covers the development workflow, best practices, and common patterns used in the Impersonator project.

## Development Workflow

### 1. Starting Development

```bash
# Start development server
pnpm dev

# Server runs on http://localhost:3000
```

### 2. Making Changes

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run linter and tests
5. Commit changes
6. Push and create PR

### 3. Testing Changes

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run specific test suite
pnpm test:security
pnpm test:integration
```

### 4. Code Quality Checks

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint --fix
```

## Development Patterns

### Context Usage

#### Using SmartWalletContext

```typescript
import { useSmartWallet } from "@/contexts/SmartWalletContext";

function MyComponent() {
  const {
    activeWallet,
    smartWallets,
    connectToWallet,
    createWallet,
    addOwner,
    removeOwner,
    updateThreshold,
  } = useSmartWallet();

  // Use context values and methods
}
```

#### Using TransactionContext

```typescript
import { useTransaction } from "@/contexts/TransactionContext";

function MyComponent() {
  const {
    transactions,
    pendingTransactions,
    createTransaction,
    approveTransaction,
    executeTransaction,
    estimateGas,
  } = useTransaction();

  // Use context values and methods
}
```

#### Using SafeInjectContext

```typescript
import { useSafeInject } from "@/contexts/SafeInjectContext";

function MyComponent() {
  const {
    address,
    appUrl,
    setAddress,
    setAppUrl,
    iframeRef,
    latestTransaction,
  } = useSafeInject();

  // Use context values and methods
}
```

### Component Patterns

#### Functional Components with Hooks

```typescript
"use client";

import { useState, useEffect } from "react";
import { Box, Button } from "@chakra-ui/react";

export default function MyComponent() {
  const [state, setState] = useState<string>("");

  useEffect(() => {
    // Side effects
  }, []);

  return (
    <Box>
      <Button onClick={() => setState("new value")}>
        Click me
      </Button>
    </Box>
  );
}
```

#### Form Handling

```typescript
import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import { validateAddress } from "@/utils/security";

function AddressForm() {
  const [address, setAddress] = useState("");
  const toast = useToast();

  const handleSubmit = async () => {
    // Validate input
    const validation = validateAddress(address);
    if (!validation.valid) {
      toast({
        title: "Invalid Address",
        description: validation.error,
        status: "error",
      });
      return;
    }

    // Process valid address
    const checksummed = validation.checksummed!;
    // ... rest of logic
  };

  return (
    // Form JSX
  );
}
```

### Error Handling

#### Try-Catch Pattern

```typescript
try {
  const result = await someAsyncOperation();
  // Handle success
} catch (error: any) {
  console.error("Operation failed:", error);
  toast({
    title: "Error",
    description: error.message || "Operation failed",
    status: "error",
  });
}
```

#### Error Boundary

```typescript
import ErrorBoundary from "@/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Validation Patterns

#### Address Validation

```typescript
import { validateAddress } from "@/utils/security";

const validation = validateAddress(address);
if (!validation.valid) {
  throw new Error(validation.error);
}
const checksummed = validation.checksummed!;
```

#### Transaction Validation

```typescript
import { validateTransactionRequest } from "@/utils/security";

const validation = validateTransactionRequest({
  from: "0x...",
  to: "0x...",
  value: "1000000000000000000",
  data: "0x",
});

if (!validation.valid) {
  console.error("Validation errors:", validation.errors);
}
```

### Async Operations

#### Using Async/Await

```typescript
async function fetchData() {
  try {
    const data = await someAsyncCall();
    return data;
  } catch (error) {
    console.error("Failed to fetch:", error);
    throw error;
  }
}
```

#### Promise Handling

```typescript
someAsyncCall()
  .then((result) => {
    // Handle success
  })
  .catch((error) => {
    // Handle error
  });
```

### State Management

#### Local State

```typescript
const [value, setValue] = useState<string>("");
const [loading, setLoading] = useState<boolean>(false);
```

#### Context State

```typescript
// Access context state
const { activeWallet } = useSmartWallet();
```

#### Derived State

```typescript
const pendingCount = transactions.filter(
  (tx) => tx.status === TransactionStatus.PENDING
).length;
```

## Security Best Practices

### Input Validation

Always validate user input:

```typescript
import { validateAddress, validateTransactionValue } from "@/utils/security";

// Validate address
const addressValidation = validateAddress(userInput);
if (!addressValidation.valid) {
  // Handle invalid input
}

// Validate transaction value
const valueValidation = validateTransactionValue(value);
if (!valueValidation.valid) {
  // Handle invalid value
}
```

### Secure Storage

Use SecureStorage for sensitive data:

```typescript
import { SecureStorage } from "@/utils/encryption";

const storage = new SecureStorage();
await storage.setItem("key", JSON.stringify(sensitiveData));
const data = await storage.getItem("key");
```

### Rate Limiting

Respect rate limits:

```typescript
import { RateLimiter } from "@/utils/security";

const limiter = new RateLimiter();
if (!limiter.checkLimit(userAddress)) {
  throw new Error("Rate limit exceeded");
}
```

## Code Style Guidelines

### TypeScript

- Use strict mode
- Define types for all functions
- Use interfaces for object shapes
- Avoid `any` type
- Use type guards when needed

### Naming Conventions

- **Components**: PascalCase (`WalletManager`)
- **Functions**: camelCase (`validateAddress`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_GAS_LIMIT`)
- **Types/Interfaces**: PascalCase (`SmartWalletConfig`)
- **Files**: Match export name

### Code Formatting

- Use Prettier for formatting
- 2 spaces for indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in objects/arrays

### Comments

- Use JSDoc for public APIs
- Explain "why" not "what"
- Keep comments up to date
- Remove commented-out code

## Testing Patterns

### Unit Tests

```typescript
import { validateAddress } from "@/utils/security";

describe("validateAddress", () => {
  it("should validate correct addresses", () => {
    const result = validateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
    expect(result.valid).toBe(true);
  });

  it("should reject invalid addresses", () => {
    const result = validateAddress("invalid");
    expect(result.valid).toBe(false);
  });
});
```

### Component Tests

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

## Debugging

### Console Logging

```typescript
// Use monitoring service for production
import { monitoring } from "@/utils/monitoring";

monitoring.debug("Debug message", { context });
monitoring.info("Info message", { context });
monitoring.warn("Warning message", { context });
monitoring.error("Error message", error, { context });
```

### React DevTools

- Install React DevTools browser extension
- Inspect component tree
- View props and state
- Profile performance

### Browser DevTools

- Use Network tab for API calls
- Use Console for errors
- Use Application tab for storage
- Use Sources for debugging

## Performance Optimization

### Memoization

```typescript
import { useMemo, useCallback } from "react";

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);
```

### Lazy Loading

```typescript
import { lazy, Suspense } from "react";

const HeavyComponent = lazy(() => import("./HeavyComponent"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Code Splitting

Next.js automatically code-splits by route. For manual splitting:

```typescript
import dynamic from "next/dynamic";

const DynamicComponent = dynamic(() => import("./Component"), {
  ssr: false,
});
```

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Refactoring
- `docs/description` - Documentation
- `test/description` - Test additions

### Commit Messages

Follow conventional commits:

```
feat: add wallet connection
fix: resolve address validation bug
docs: update API documentation
test: add integration tests
refactor: extract constants
```

### Pull Request Process

1. Create feature branch
2. Make changes and commit
3. Write/update tests
4. Run tests and linter
5. Create PR with description
6. Address review comments
7. Merge after approval

## Common Tasks

### Adding a New Wallet Type

1. Create helper in `helpers/smartWallet/`
2. Add type to `types.ts`
3. Update `SmartWalletContext`
4. Add UI component
5. Write tests

### Adding a New Transaction Type

1. Update `TransactionRequest` type
2. Add validation in `utils/security.ts`
3. Update execution logic
4. Add UI component
5. Write tests

### Adding a New Network

1. Add to `NETWORKS` in `utils/constants.ts`
2. Update network validation
3. Add to network list component
4. Test connection

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Chakra UI Docs](https://chakra-ui.com/)
- [ethers.js Docs](https://docs.ethers.org/)
