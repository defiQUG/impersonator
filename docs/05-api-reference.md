# API Reference

Complete API documentation for the Impersonator Smart Wallet system.

## Table of Contents

- [Context APIs](#context-apis)
- [Security Utilities](#security-utilities)
- [Encryption Utilities](#encryption-utilities)
- [Helper Functions](#helper-functions)
- [Monitoring Service](#monitoring-service)
- [Constants](#constants)

## Context APIs

### SmartWalletContext

Manages smart wallet configuration and state.

#### Hook

```typescript
const {
  smartWallets,
  activeWallet,
  balance,
  isLoadingBalance,
  provider,
  connectToWallet,
  createWallet,
  deleteWallet,
  addOwner,
  removeOwner,
  updateThreshold,
  refreshBalance,
  setProvider,
} = useSmartWallet();
```

#### Methods

##### `connectToWallet(address, networkId, type)`

Connect to an existing smart wallet.

**Parameters:**
- `address: string` - Wallet address
- `networkId: number` - Network ID
- `type: SmartWalletType` - Wallet type (GNOSIS_SAFE | ERC4337)

**Returns:** `Promise<SmartWalletConfig | null>`

**Example:**
```typescript
const wallet = await connectToWallet(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  1,
  SmartWalletType.GNOSIS_SAFE
);
```

##### `createWallet(config)`

Create a new wallet configuration.

**Parameters:**
- `config: { type, address, networkId, owners, threshold }`

**Returns:** `Promise<SmartWalletConfig>`

##### `addOwner(walletId, owner, callerAddress?)`

Add an owner to a wallet.

**Parameters:**
- `walletId: string` - Wallet ID
- `owner: OwnerInfo` - Owner information
- `callerAddress?: string` - Address of caller (for authorization)

**Returns:** `Promise<void>`

##### `removeOwner(walletId, ownerAddress, callerAddress?)`

Remove an owner from a wallet.

**Parameters:**
- `walletId: string` - Wallet ID
- `ownerAddress: string` - Owner address to remove
- `callerAddress?: string` - Address of caller (for authorization)

**Returns:** `Promise<void>`

##### `updateThreshold(walletId, threshold, callerAddress?)`

Update the threshold for a wallet.

**Parameters:**
- `walletId: string` - Wallet ID
- `threshold: number` - New threshold
- `callerAddress?: string` - Address of caller (for authorization)

**Returns:** `Promise<void>`

### TransactionContext

Manages transaction lifecycle and approvals.

#### Hook

```typescript
const {
  transactions,
  pendingTransactions,
  createTransaction,
  approveTransaction,
  rejectTransaction,
  executeTransaction,
  estimateGas,
  defaultExecutionMethod,
  setDefaultExecutionMethod,
} = useTransaction();
```

#### Methods

##### `createTransaction(tx)`

Create a new transaction request.

**Parameters:**
- `tx: Omit<TransactionRequest, "id" | "status" | "createdAt">`

**Returns:** `Promise<TransactionRequest>`

**Example:**
```typescript
const tx = await createTransaction({
  from: "0x...",
  to: "0x...",
  value: "1000000000000000000",
  data: "0x",
  method: TransactionExecutionMethod.DIRECT_ONCHAIN,
});
```

##### `approveTransaction(transactionId, approver)`

Approve a transaction.

**Parameters:**
- `transactionId: string` - Transaction ID
- `approver: string` - Approver address

**Returns:** `Promise<void>`

##### `executeTransaction(transactionId)`

Execute an approved transaction.

**Parameters:**
- `transactionId: string` - Transaction ID

**Returns:** `Promise<string | null>` - Transaction hash

##### `estimateGas(tx)`

Estimate gas for a transaction.

**Parameters:**
- `tx: Partial<TransactionRequest>`

**Returns:** `Promise<GasEstimate | null>`

### SafeInjectContext

Manages iframe communication and Safe App SDK integration.

#### Hook

```typescript
const {
  address,
  appUrl,
  rpcUrl,
  provider,
  latestTransaction,
  setAddress,
  setAppUrl,
  setRpcUrl,
  sendMessageToIFrame,
  iframeRef,
} = useSafeInject();
```

## Security Utilities

### Address Validation

#### `validateAddress(address)`

Validates an Ethereum address with checksum verification.

**Parameters:**
- `address: string` - Address to validate

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
  checksummed?: string;
}
```

**Example:**
```typescript
const result = validateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
if (result.valid) {
  const checksummed = result.checksummed!;
}
```

#### `isContractAddress(address, provider)`

Checks if an address is a contract.

**Parameters:**
- `address: string` - Address to check
- `provider: Provider` - Ethereum provider

**Returns:** `Promise<boolean>`

### Transaction Validation

#### `validateTransactionRequest(tx)`

Validates a complete transaction request.

**Parameters:**
- `tx: { from?, to?, value?, data? }`

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];
}
```

#### `validateTransactionData(data)`

Validates transaction data field.

**Parameters:**
- `data: string` - Transaction data (hex string)

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
}
```

#### `validateTransactionValue(value)`

Validates transaction value.

**Parameters:**
- `value: string` - Transaction value (hex string)

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
  parsed?: BigNumber;
}
```

#### `validateGasLimit(gasLimit, maxGas?)`

Validates gas limit.

**Parameters:**
- `gasLimit: string` - Gas limit
- `maxGas?: string` - Maximum gas (default: 10M)

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
}
```

### Network Validation

#### `validateNetworkId(networkId)`

Validates network ID.

**Parameters:**
- `networkId: number` - Network ID

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
}
```

### Rate Limiting

#### `RateLimiter`

Rate limiter class for preventing DoS attacks.

**Constructor:**
```typescript
new RateLimiter(maxRequests?, windowMs?)
```

**Parameters:**
- `maxRequests?: number` - Max requests per window (default: 10)
- `windowMs?: number` - Time window in ms (default: 60000)

**Methods:**
- `checkLimit(key: string): boolean` - Check if request is allowed
- `reset(key: string): void` - Reset limit for key

**Example:**
```typescript
const limiter = new RateLimiter(10, 60000);
if (limiter.checkLimit(userAddress)) {
  // Process request
}
```

### Nonce Management

#### `NonceManager`

Manages transaction nonces to prevent conflicts.

**Constructor:**
```typescript
new NonceManager(provider: Provider)
```

**Methods:**
- `getNextNonce(address: string): Promise<number>` - Get next nonce
- `refreshNonce(address: string): Promise<number>` - Refresh from chain

**Example:**
```typescript
const nonceManager = new NonceManager(provider);
const nonce = await nonceManager.getNextNonce(address);
```

## Encryption Utilities

### SecureStorage

Secure storage wrapper with encryption.

**Constructor:**
```typescript
new SecureStorage()
```

**Methods:**
- `setItem(key: string, value: string): Promise<void>` - Store encrypted value
- `getItem(key: string): Promise<string | null>` - Retrieve and decrypt value
- `removeItem(key: string): void` - Remove item

**Example:**
```typescript
const storage = new SecureStorage();
await storage.setItem("wallets", JSON.stringify(wallets));
const data = await storage.getItem("wallets");
```

### Encryption Functions

#### `encryptData(data, key)`

Encrypt data using AES-GCM.

**Parameters:**
- `data: string` - Data to encrypt
- `key: string` - Encryption key

**Returns:** `Promise<string>` - Encrypted data (base64)

#### `decryptData(encrypted, key)`

Decrypt data.

**Parameters:**
- `encrypted: string` - Encrypted data (base64)
- `key: string` - Encryption key

**Returns:** `Promise<string>` - Decrypted data

#### `generateEncryptionKey()`

Generate encryption key from session.

**Returns:** `string` - Encryption key

## Helper Functions

### Gnosis Safe Helpers

#### `getSafeInfo(safeAddress, provider)`

Get Safe contract information.

**Parameters:**
- `safeAddress: string` - Safe address
- `provider: Provider` - Ethereum provider

**Returns:** `Promise<SafeInfo | null>`

#### `connectToSafe(safeAddress, networkId, provider)`

Connect to an existing Safe.

**Parameters:**
- `safeAddress: string` - Safe address
- `networkId: number` - Network ID
- `provider: Provider` - Ethereum provider

**Returns:** `Promise<SmartWalletConfig | null>`

#### `deploySafe(owners, threshold, provider, signer)`

Deploy a new Safe.

**Parameters:**
- `owners: string[]` - Owner addresses
- `threshold: number` - Threshold
- `provider: Provider` - Ethereum provider
- `signer: Signer` - Signer for deployment

**Returns:** `Promise<string | null>` - Deployed Safe address

### Transaction Execution

#### `executeDirectTransaction(tx, provider, signer)`

Execute transaction directly on-chain.

**Parameters:**
- `tx: TransactionRequest` - Transaction request
- `provider: Provider` - Ethereum provider
- `signer: Signer` - Transaction signer

**Returns:** `Promise<string>` - Transaction hash

#### `executeRelayerTransaction(tx, relayerUrl, apiKey?)`

Execute transaction via relayer.

**Parameters:**
- `tx: TransactionRequest` - Transaction request
- `relayerUrl: string` - Relayer URL
- `apiKey?: string` - Optional API key

**Returns:** `Promise<string>` - Transaction hash

#### `simulateTransaction(tx, provider, from)`

Simulate transaction execution.

**Parameters:**
- `tx: TransactionRequest` - Transaction request
- `provider: Provider` - Ethereum provider
- `from: string` - From address

**Returns:**
```typescript
Promise<{
  success: boolean;
  gasUsed: string;
  error?: string;
}>
```

### Balance Helpers

#### `getNativeBalance(address, provider)`

Get native token balance.

**Parameters:**
- `address: string` - Wallet address
- `provider: Provider` - Ethereum provider

**Returns:** `Promise<string>` - Balance (wei)

#### `getTokenBalance(tokenAddress, walletAddress, provider)`

Get ERC20 token balance.

**Parameters:**
- `tokenAddress: string` - Token contract address
- `walletAddress: string` - Wallet address
- `provider: Provider` - Ethereum provider

**Returns:** `Promise<TokenBalance | null>`

#### `getWalletBalance(address, provider, tokens?)`

Get complete wallet balance.

**Parameters:**
- `address: string` - Wallet address
- `provider: Provider` - Ethereum provider
- `tokens?: string[]` - Optional token addresses

**Returns:** `Promise<WalletBalance>`

## Monitoring Service

### Monitoring

Centralized logging and error tracking service.

**Methods:**
- `debug(message, context?)` - Log debug message
- `info(message, context?)` - Log info message
- `warn(message, context?)` - Log warning
- `error(message, error?, context?)` - Log error
- `trackSecurityEvent(event, details)` - Track security event
- `trackRateLimit(key)` - Track rate limit hit
- `trackTransaction(event, txId, details?)` - Track transaction event

**Example:**
```typescript
import { monitoring } from "@/utils/monitoring";

monitoring.info("Transaction created", { txId: "0x..." });
monitoring.error("Transaction failed", error, { txId: "0x..." });
```

## Constants

### Security Constants

```typescript
SECURITY = {
  DEFAULT_RATE_LIMIT_REQUESTS: 10,
  DEFAULT_RATE_LIMIT_WINDOW_MS: 60000,
  MESSAGE_REPLAY_WINDOW_MS: 1000,
  TRANSACTION_EXPIRATION_MS: 3600000,
  MAX_TRANSACTION_DATA_LENGTH: 10000,
  MAX_TRANSACTION_VALUE_ETH: 1000000,
  MIN_GAS_LIMIT: 21000,
  MAX_GAS_LIMIT: 10000000,
  // ... more constants
}
```

### Network Constants

```typescript
NETWORKS = {
  SUPPORTED_NETWORK_IDS: [1, 5, 137, ...],
  MAINNET: 1,
  POLYGON: 137,
  // ... more networks
}
```

### Storage Keys

```typescript
STORAGE_KEYS = {
  SMART_WALLETS: "impersonator_smart_wallets",
  ACTIVE_WALLET: "impersonator_active_wallet",
  TRANSACTIONS: "impersonator_transactions",
  // ... more keys
}
```

## Type Definitions

See `types.ts` for complete type definitions including:
- `SmartWalletConfig`
- `TransactionRequest`
- `SafeInfo`
- `WalletBalance`
- `TransactionStatus`
- And more...
