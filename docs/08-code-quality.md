# Code Quality Guide

Standards and practices for maintaining high code quality in the Impersonator project.

## Code Standards

### TypeScript

- **Strict Mode:** Enabled
- **Type Safety:** All functions typed
- **No `any`:** Avoid `any` type
- **Interfaces:** Use interfaces for object shapes
- **Type Guards:** Use type guards when needed

### Code Style

- **Formatting:** Prettier
- **Indentation:** 2 spaces
- **Semicolons:** Required
- **Quotes:** Single quotes
- **Trailing Commas:** Yes

### Naming Conventions

- **Components:** PascalCase (`WalletManager`)
- **Functions:** camelCase (`validateAddress`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_GAS_LIMIT`)
- **Types/Interfaces:** PascalCase (`SmartWalletConfig`)
- **Files:** Match export name

## Linting

### ESLint Configuration

The project uses ESLint with Next.js configuration.

**Run Linter:**
```bash
pnpm lint
```

**Fix Issues:**
```bash
pnpm lint --fix
```

### Common Rules

- No unused variables
- No console.log in production
- Consistent return statements
- Proper error handling
- No magic numbers

## Formatting

### Prettier Configuration

Automatic formatting on save (VS Code).

**Manual Format:**
```bash
npx prettier --write .
```

### Formatting Rules

- 2 space indentation
- Single quotes
- Semicolons required
- Trailing commas
- 80 character line length (soft)

## Code Review Checklist

### Functionality

- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling present
- [ ] No breaking changes

### Code Quality

- [ ] Follows naming conventions
- [ ] Properly typed
- [ ] No magic numbers
- [ ] Comments where needed
- [ ] No code duplication

### Security

- [ ] Input validation
- [ ] Secure storage used
- [ ] Authorization checks
- [ ] No sensitive data exposed

### Testing

- [ ] Tests written
- [ ] Tests passing
- [ ] Coverage maintained
- [ ] Edge cases tested

### Documentation

- [ ] JSDoc comments
- [ ] README updated if needed
- [ ] Changelog updated
- [ ] Breaking changes documented

## Best Practices

### 1. Function Design

```typescript
// ✅ Good: Single responsibility, typed, documented
/**
 * Validates Ethereum address
 * @param address - Address to validate
 * @returns Validation result with checksummed address
 */
function validateAddress(address: string): ValidationResult {
  // Implementation
}

// ❌ Bad: Multiple responsibilities, no types
function process(address) {
  // Does too much
}
```

### 2. Error Handling

```typescript
// ✅ Good: Proper error handling
try {
  const result = await operation();
  return result;
} catch (error: any) {
  monitoring.error("Operation failed", error);
  throw new Error("Operation failed");
}

// ❌ Bad: Swallowed errors
try {
  await operation();
} catch (error) {
  // Silent failure
}
```

### 3. Constants

```typescript
// ✅ Good: Constants extracted
import { SECURITY } from "@/utils/constants";
const maxGas = SECURITY.MAX_GAS_LIMIT;

// ❌ Bad: Magic numbers
const maxGas = 10000000;
```

### 4. Type Safety

```typescript
// ✅ Good: Proper typing
interface Config {
  address: string;
  networkId: number;
}

function createWallet(config: Config): Promise<Wallet> {
  // Implementation
}

// ❌ Bad: No types
function createWallet(config) {
  // Implementation
}
```

### 5. Component Structure

```typescript
// ✅ Good: Clean component
export default function WalletManager() {
  const { activeWallet } = useSmartWallet();
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(async () => {
    // Implementation
  }, [dependencies]);

  return (
    <Box>
      {/* JSX */}
    </Box>
  );
}

// ❌ Bad: Messy component
export default function WalletManager() {
  // Too much logic
  // Unclear structure
  // No memoization
}
```

## Code Metrics

### Complexity

- **Cyclomatic Complexity:** < 10 per function
- **Function Length:** < 50 lines
- **File Length:** < 500 lines
- **Component Props:** < 10 props

### Maintainability

- **Code Duplication:** < 5%
- **Test Coverage:** > 80%
- **Documentation:** All public APIs
- **Comments:** Explain "why" not "what"

## Refactoring Guidelines

### When to Refactor

- Code duplication detected
- Function too long/complex
- Poor naming
- Hard to test
- Performance issues

### Refactoring Steps

1. Write tests first
2. Make small changes
3. Run tests frequently
4. Keep functionality same
5. Improve incrementally

## Documentation Standards

### JSDoc Comments

```typescript
/**
 * Validates Ethereum address with checksum verification
 * @param address - The Ethereum address to validate
 * @returns Validation result with checksummed address if valid
 * @example
 * const result = validateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
 * if (result.valid) {
 *   const checksummed = result.checksummed!;
 * }
 */
export function validateAddress(address: string): ValidationResult {
  // Implementation
}
```

### README Updates

Update README when:
- Adding new features
- Changing setup process
- Updating dependencies
- Breaking changes

## Performance Considerations

### Optimization

- Use `useMemo` for expensive calculations
- Use `useCallback` for callbacks
- Lazy load heavy components
- Code split by route
- Optimize images

### Monitoring

- Track performance metrics
- Monitor bundle size
- Check render times
- Profile slow operations

## Dependency Management

### Adding Dependencies

1. Check if already exists
2. Verify security
3. Check bundle size
4. Review documentation
5. Test thoroughly

### Updating Dependencies

```bash
# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Security audit
pnpm audit
```

## CI/CD Quality Gates

### Automated Checks

- Linting passes
- Tests pass
- Coverage maintained
- Build succeeds
- Security audit clean

### Manual Review

- Code review required
- Architecture review for large changes
- Security review for sensitive changes

## Tools

### VS Code Extensions

- ESLint
- Prettier
- TypeScript
- Jest
- GitLens

### Pre-commit Hooks

Consider adding:
- Linting
- Formatting
- Tests
- Type checking

## Resources

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [React Best Practices](https://react.dev/learn)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)
