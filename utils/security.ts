import { ethers, providers } from "ethers";
import { SECURITY, VALIDATION, ERROR_MESSAGES, NETWORKS } from "./constants";

/**
 * Security utility functions for input validation and security checks
 */

/**
 * Validates Ethereum address with checksum verification
 * @param address - The Ethereum address to validate
 * @returns Validation result with checksummed address if valid
 */
export function validateAddress(address: string): {
  valid: boolean;
  error?: string;
  checksummed?: string;
} {
  if (!address || typeof address !== "string") {
    return { valid: false, error: ERROR_MESSAGES.INVALID_ADDRESS };
  }

  if (address.length > VALIDATION.ADDRESS_MAX_LENGTH) {
    return { valid: false, error: "Address exceeds maximum length" };
  }

  if (!ethers.utils.isAddress(address)) {
    return { valid: false, error: "Invalid Ethereum address format" };
  }

  try {
    const checksummed = ethers.utils.getAddress(address);
    return { valid: true, checksummed };
  } catch (error: any) {
    return { valid: false, error: error.message || "Address validation failed" };
  }
}

/**
 * Checks if address is a contract (has code)
 * @param address - The address to check
 * @param provider - The Ethereum provider
 * @returns True if address is a contract, false if EOA
 */
export async function isContractAddress(
  address: string,
  provider: providers.Provider
): Promise<boolean> {
  try {
    const code = await provider.getCode(address);
    return code !== "0x" && code !== "0x0";
  } catch {
    return false;
  }
}

/**
 * Validates transaction data field
 */
export function validateTransactionData(data: string): {
  valid: boolean;
  error?: string;
} {
  if (!data) {
    return { valid: true }; // Empty data is valid
  }

  if (typeof data !== "string") {
    return { valid: false, error: "Data must be a string" };
  }

  if (!data.startsWith("0x")) {
    return { valid: false, error: "Data must start with 0x" };
  }

  if (data.length > SECURITY.MAX_TRANSACTION_DATA_LENGTH) {
    return { valid: false, error: `Data exceeds maximum length (${SECURITY.MAX_TRANSACTION_DATA_LENGTH} bytes)` };
  }

  if (!/^0x[0-9a-fA-F]*$/.test(data)) {
    return { valid: false, error: "Data contains invalid hex characters" };
  }

  return { valid: true };
}

/**
 * Validates transaction value
 */
export function validateTransactionValue(value: string): {
  valid: boolean;
  error?: string;
  parsed?: ethers.BigNumber;
} {
  if (!value || value === "0" || value === "0x0") {
    return { valid: true, parsed: ethers.BigNumber.from(0) };
  }

  try {
    const parsed = ethers.BigNumber.from(value);
    
    if (parsed.lt(0)) {
      return { valid: false, error: "Value cannot be negative" };
    }

    // Check for reasonable maximum
    const maxValue = ethers.utils.parseEther(SECURITY.MAX_TRANSACTION_VALUE_ETH.toString());
    if (parsed.gt(maxValue)) {
      return { valid: false, error: `Value exceeds maximum allowed (${SECURITY.MAX_TRANSACTION_VALUE_ETH} ETH)` };
    }

    return { valid: true, parsed };
  } catch (error: any) {
    return { valid: false, error: "Invalid value format" };
  }
}

/**
 * Validates gas limit
 */
/**
 * Validates gas limit
 * @param gasLimit - The gas limit to validate
 * @param maxGas - Maximum allowed gas limit (default: 10M)
 * @returns Validation result
 */
export function validateGasLimit(
  gasLimit: string,
  maxGas: string = SECURITY.MAX_GAS_LIMIT.toString()
): {
  valid: boolean;
  error?: string;
} {
  try {
    const limit = ethers.BigNumber.from(gasLimit);
    const max = ethers.BigNumber.from(maxGas);

    if (limit.lt(SECURITY.MIN_GAS_LIMIT)) {
      return { valid: false, error: `Gas limit too low (minimum ${SECURITY.MIN_GAS_LIMIT})` };
    }

    if (limit.gt(max)) {
      return { valid: false, error: `Gas limit exceeds maximum (${maxGas})` };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid gas limit format" };
  }
}

/**
 * Validates gas price
 */
export function validateGasPrice(
  gasPrice: string,
  networkId: number
): {
  valid: boolean;
  error?: string;
} {
  try {
    const price = ethers.BigNumber.from(gasPrice);
    
    // Minimum gas price (1 gwei)
    const minPrice = ethers.utils.parseUnits("1", "gwei");
    if (price.lt(minPrice)) {
      return { valid: false, error: "Gas price too low" };
    }

    // Maximum gas price (1000 gwei) - adjust per network
    const maxPrice = ethers.utils.parseUnits("1000", "gwei");
    if (price.gt(maxPrice)) {
      return { valid: false, error: "Gas price too high" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid gas price format" };
  }
}

/**
 * Validates network ID
 */
/**
 * Validates network ID
 * @param networkId - The network ID to validate
 * @returns Validation result
 */
export function validateNetworkId(networkId: number): {
  valid: boolean;
  error?: string;
} {
  if (!Number.isInteger(networkId) || networkId < 1) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_NETWORK };
  }

  if (!(NETWORKS.SUPPORTED_NETWORK_IDS as readonly number[]).includes(networkId)) {
    return {
      valid: false,
      error: `Network ${networkId} is not supported`,
    };
  }

  return { valid: true };
}

/**
 * Validates RPC URL
 */
export function validateRpcUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "RPC URL must be a non-empty string" };
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { valid: false, error: "RPC URL must use http or https protocol" };
    }

    // In production, should enforce HTTPS
    if (parsed.protocol !== "https:") {
      return {
        valid: false,
        error: "RPC URL must use HTTPS in production",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid RPC URL format" };
  }
}

/**
 * Generates cryptographically secure random ID
 */
export function generateSecureId(): string {
  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
  }
  // Fallback for Node.js
  const crypto = require("crypto");
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Validates message origin for postMessage
 */
export function validateMessageOrigin(
  origin: string,
  allowedOrigins: string[]
): boolean {
  try {
    const parsed = new URL(origin);
    return allowedOrigins.some((allowed) => {
      try {
        const allowedUrl = new URL(allowed);
        return (
          parsed.protocol === allowedUrl.protocol &&
          parsed.hostname === allowedUrl.hostname &&
          parsed.port === allowedUrl.port
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

/**
 * Rate limiter implementation
 * Prevents DoS attacks by limiting requests per time window
 */
export class RateLimiter {
  private requests: Map<string, number[]>;
  private maxRequests: number;
  private windowMs: number;

  /**
   * Creates a new rate limiter
   * @param maxRequests - Maximum requests allowed per window (default: 10)
   * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
   */
  constructor(
    maxRequests: number = SECURITY.DEFAULT_RATE_LIMIT_REQUESTS,
    windowMs: number = SECURITY.DEFAULT_RATE_LIMIT_WINDOW_MS
  ) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  checkLimit(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside window
    const recent = requests.filter((time) => now - time < this.windowMs);

    if (recent.length >= this.maxRequests) {
      return false;
    }

    recent.push(now);
    this.requests.set(key, recent);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Transaction nonce manager
 * Manages transaction nonces to prevent conflicts and ensure proper ordering
 */
export class NonceManager {
  private nonces: Map<string, number>;
  private provider: providers.Provider;

  /**
   * Creates a new nonce manager
   * @param provider - The Ethereum provider
   */
  constructor(provider: providers.Provider) {
    this.nonces = new Map();
    this.provider = provider;
  }

  async getNextNonce(address: string): Promise<number> {
    const current = await this.provider.getTransactionCount(address, "pending");
    const stored = this.nonces.get(address) || 0;
    const next = Math.max(current, stored + 1);
    this.nonces.set(address, next);
    return next;
  }

  async refreshNonce(address: string): Promise<number> {
    const nonce = await this.provider.getTransactionCount(address, "pending");
    this.nonces.set(address, nonce);
    return nonce;
  }
}

/**
 * Validates transaction request structure
 */
export function validateTransactionRequest(tx: {
  from?: string;
  to?: string;
  value?: string;
  data?: string;
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!tx.from) {
    errors.push("Missing 'from' address");
  } else {
    const fromValidation = validateAddress(tx.from);
    if (!fromValidation.valid) {
      errors.push(`Invalid 'from' address: ${fromValidation.error}`);
    }
  }

  if (!tx.to) {
    errors.push("Missing 'to' address");
  } else {
    const toValidation = validateAddress(tx.to);
    if (!toValidation.valid) {
      errors.push(`Invalid 'to' address: ${toValidation.error}`);
    }
  }

  if (tx.value) {
    const valueValidation = validateTransactionValue(tx.value);
    if (!valueValidation.valid) {
      errors.push(`Invalid value: ${valueValidation.error}`);
    }
  }

  if (tx.data) {
    const dataValidation = validateTransactionData(tx.data);
    if (!dataValidation.valid) {
      errors.push(`Invalid data: ${dataValidation.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
