/**
 * Nonce manager tests
 * Note: These tests require a mock provider
 */

import { NonceManager } from "../utils/security";
import { ethers } from "ethers";

// Mock provider
class MockProvider extends ethers.providers.BaseProvider {
  private transactionCounts: Map<string, number> = new Map();

  constructor() {
    super(ethers.providers.getNetwork(1)); // Mainnet network
  }

  setTransactionCount(address: string, count: number) {
    this.transactionCounts.set(address.toLowerCase(), count);
  }

  async getTransactionCount(address: string, blockTag?: string): Promise<number> {
    return this.transactionCounts.get(address.toLowerCase()) || 0;
  }

  // Required by BaseProvider
  async perform(method: string, params: any): Promise<any> {
    throw new Error("Not implemented");
  }
}

describe("NonceManager", () => {
  let provider: MockProvider;
  let nonceManager: NonceManager;

  beforeEach(() => {
    provider = new MockProvider();
    nonceManager = new NonceManager(provider as any);
  });

  it("should get next nonce for new address", async () => {
    const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    provider.setTransactionCount(address, 0);
    
    const nonce = await nonceManager.getNextNonce(address);
    expect(nonce).toBe(0);
  });

  it("should increment nonce after use", async () => {
    const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    provider.setTransactionCount(address, 5);
    
    const nonce1 = await nonceManager.getNextNonce(address);
    expect(nonce1).toBe(5);
    
    const nonce2 = await nonceManager.getNextNonce(address);
    expect(nonce2).toBe(6);
    
    const nonce3 = await nonceManager.getNextNonce(address);
    expect(nonce3).toBe(7);
  });

  it("should use higher value between stored and on-chain", async () => {
    const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    
    // Set stored nonce to 10
    await nonceManager.getNextNonce(address);
    await nonceManager.getNextNonce(address);
    // Now stored should be 2
    
    // Set on-chain to 5
    provider.setTransactionCount(address, 5);
    
    // Should use 5 (higher)
    const nonce = await nonceManager.getNextNonce(address);
    expect(nonce).toBe(5);
  });

  it("should refresh nonce from chain", async () => {
    const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    
    // Set initial nonce
    provider.setTransactionCount(address, 3);
    await nonceManager.getNextNonce(address);
    
    // Update on-chain
    provider.setTransactionCount(address, 10);
    
    // Refresh
    const refreshed = await nonceManager.refreshNonce(address);
    expect(refreshed).toBe(10);
    
    // Next nonce should be 11
    const next = await nonceManager.getNextNonce(address);
    expect(next).toBe(11);
  });

  it("should track multiple addresses independently", async () => {
    const address1 = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    const address2 = "0x8ba1f109551bD432803012645Hac136c22C9e8";
    
    provider.setTransactionCount(address1, 0);
    provider.setTransactionCount(address2, 5);
    
    const nonce1 = await nonceManager.getNextNonce(address1);
    const nonce2 = await nonceManager.getNextNonce(address2);
    
    expect(nonce1).toBe(0);
    expect(nonce2).toBe(5);
  });
});
