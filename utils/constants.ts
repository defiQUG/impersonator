/**
 * Application constants
 * Centralized location for all magic numbers and configuration values
 */

// Security Constants
export const SECURITY = {
  // Rate Limiting
  DEFAULT_RATE_LIMIT_REQUESTS: 10,
  DEFAULT_RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  
  // Message Replay Protection
  MESSAGE_REPLAY_WINDOW_MS: 1000, // 1 second
  MESSAGE_TIMESTAMP_CLEANUP_INTERVAL_MS: 300000, // 5 minutes
  MESSAGE_TIMESTAMP_RETENTION_MS: 300000, // 5 minutes
  
  // Transaction
  TRANSACTION_EXPIRATION_MS: 3600000, // 1 hour
  MAX_TRANSACTION_DATA_LENGTH: 10000, // bytes
  MAX_TRANSACTION_VALUE_ETH: 1000000, // 1M ETH
  MIN_GAS_LIMIT: 21000,
  MAX_GAS_LIMIT: 10000000, // 10M
  MIN_GAS_PRICE_GWEI: 1,
  MAX_GAS_PRICE_GWEI: 1000,
  
  // Timeouts
  GAS_ESTIMATION_TIMEOUT_MS: 15000, // 15 seconds
  TOKEN_BALANCE_TIMEOUT_MS: 10000, // 10 seconds
  RELAYER_REQUEST_TIMEOUT_MS: 30000, // 30 seconds
  
  // Encryption
  PBKDF2_ITERATIONS: 100000,
  ENCRYPTION_KEY_LENGTH: 32, // bytes
  AES_GCM_IV_LENGTH: 12, // bytes
} as const;

// Network Constants
export const NETWORKS = {
  SUPPORTED_NETWORK_IDS: [1, 5, 137, 42161, 10, 8453, 100, 56, 250, 43114],
  MAINNET: 1,
  GOERLI: 5,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  GNOSIS: 100,
  BSC: 56,
  FANTOM: 250,
  AVALANCHE: 43114,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  SMART_WALLETS: "impersonator_smart_wallets",
  ACTIVE_WALLET: "impersonator_active_wallet",
  TRANSACTIONS: "impersonator_transactions",
  DEFAULT_EXECUTION_METHOD: "impersonator_default_execution_method",
  ENCRYPTION_KEY: "encryption_key",
  ADDRESS_BOOK: "address-book",
  // UI Preferences (stored in sessionStorage)
  SHOW_ADDRESS: "showAddress",
  APP_URL: "appUrl",
  TENDERLY_FORK_ID: "tenderlyForkId",
} as const;

// Default Values
export const DEFAULTS = {
  EXECUTION_METHOD: "SIMULATION" as const,
  THRESHOLD: 1,
  MIN_OWNERS: 1,
} as const;

// Validation Constants
export const VALIDATION = {
  ADDRESS_MAX_LENGTH: 42,
  ENS_MAX_LENGTH: 255,
  TOKEN_DECIMALS_MIN: 0,
  TOKEN_DECIMALS_MAX: 255,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_ADDRESS: "Invalid Ethereum address",
  INVALID_NETWORK: "Network not supported",
  INVALID_TRANSACTION: "Invalid transaction data",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please wait before creating another transaction.",
  DUPLICATE_TRANSACTION: "Duplicate transaction detected",
  TRANSACTION_EXPIRED: "Transaction has expired",
  INSUFFICIENT_APPROVALS: "Insufficient approvals for transaction execution",
  UNAUTHORIZED: "Unauthorized: Caller is not a wallet owner",
  WALLET_NOT_FOUND: "Wallet not found",
  OWNER_EXISTS: "Owner already exists",
  CANNOT_REMOVE_LAST_OWNER: "Cannot remove last owner",
  THRESHOLD_EXCEEDS_OWNERS: "Threshold cannot exceed owner count",
  INVALID_THRESHOLD: "Threshold must be at least 1",
  CONTRACT_AS_OWNER: "Cannot add contract address as owner",
  ENCRYPTION_FAILED: "Failed to encrypt data",
  DECRYPTION_FAILED: "Failed to decrypt data",
  PROVIDER_NOT_AVAILABLE: "Provider not available",
  SIGNER_NOT_AVAILABLE: "No signer available for direct execution",
  RELAYER_NOT_AVAILABLE: "No enabled relayer available",
  GAS_ESTIMATION_FAILED: "Gas estimation failed",
  TRANSACTION_EXECUTION_FAILED: "Transaction execution failed",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CREATED: "Wallet created successfully",
  WALLET_CONNECTED: "Wallet connected successfully",
  OWNER_ADDED: "Owner added successfully",
  OWNER_REMOVED: "Owner removed successfully",
  THRESHOLD_UPDATED: "Threshold updated successfully",
  TRANSACTION_CREATED: "Transaction created successfully",
  TRANSACTION_APPROVED: "Transaction approved successfully",
  TRANSACTION_REJECTED: "Transaction rejected successfully",
  TRANSACTION_EXECUTED: "Transaction executed successfully",
  TOKEN_ADDED: "Token added successfully",
} as const;
