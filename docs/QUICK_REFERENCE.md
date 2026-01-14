# Quick Reference Guide

Quick reference for common tasks and patterns in the Impersonator Smart Wallet system.

## Common Code Patterns

### Validate Address

```typescript
import { validateAddress } from "@/utils/security";

const validation = validateAddress(address);
if (!validation.valid) {
  throw new Error(validation.error);
}
const checksummed = validation.checksummed!;
```

### Create Transaction

```typescript
import { useTransaction } from "@/contexts/TransactionContext";

const { createTransaction } = useTransaction();
const tx = await createTransaction({
  from: walletAddress,
  to: recipientAddress,
  value: ethers.utils.parseEther("1.0").toHexString(),
  data: "0x",
  method: TransactionExecutionMethod.DIRECT_ONCHAIN,
});
```

### Use Secure Storage

```typescript
import { SecureStorage } from "@/utils/encryption";

const storage = new SecureStorage();
await storage.setItem("key", JSON.stringify(data));
const data = await storage.getItem("key");
```

### Rate Limiting

```typescript
import { RateLimiter } from "@/utils/security";

const limiter = new RateLimiter();
if (!limiter.checkLimit(userAddress)) {
  throw new Error("Rate limit exceeded");
}
```

### Monitor Events

```typescript
import { monitoring } from "@/utils/monitoring";

monitoring.info("Event occurred", { context });
monitoring.error("Error occurred", error, { context });
```

## File Locations

### Key Files
- **Main App:** `app/page.tsx`
- **Providers:** `app/providers.tsx`
- **Types:** `types.ts`
- **Constants:** `utils/constants.ts`

### Contexts
- **Smart Wallet:** `contexts/SmartWalletContext.tsx`
- **Transaction:** `contexts/TransactionContext.tsx`
- **Safe Inject:** `contexts/SafeInjectContext.tsx`

### Utilities
- **Security:** `utils/security.ts`
- **Encryption:** `utils/encryption.ts`
- **Monitoring:** `utils/monitoring.ts`

### Helpers
- **Communicator:** `helpers/communicator.ts`
- **Gnosis Safe:** `helpers/smartWallet/gnosisSafe.ts`
- **Transaction:** `helpers/transaction/execution.ts`
- **Balance:** `helpers/balance/index.ts`

## Common Tasks

### Add New Network
1. Add to `NETWORKS.SUPPORTED_NETWORK_IDS` in `utils/constants.ts`
2. Update network list component
3. Test connection

### Add New Validation
1. Add function to `utils/security.ts`
2. Add JSDoc comment
3. Write tests
4. Use in components

### Add New Component
1. Create in appropriate `components/` subdirectory
2. Export component
3. Add to parent
4. Write tests

## Testing Commands

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test __tests__/security.test.ts

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Environment Variables

```env
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
TENDERLY_API_KEY=your_tenderly_key
```

## Useful Links

- [Full Documentation](./README.md)
- [API Reference](./05-api-reference.md)
- [Security Guide](./06-security.md)
- [Recommendations](./RECOMMENDATIONS_AND_NEXT_STEPS.md)
