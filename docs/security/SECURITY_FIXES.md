# Security Fixes Implementation Guide

This document provides step-by-step instructions to fix the critical security vulnerabilities identified in the audit.

## Priority 1: Critical Fixes (Implement Immediately)

### Fix 1: Secure postMessage Communication

**File:** `helpers/communicator.ts`

**Current Code (Line 65):**
```typescript
this.iframeRef.current?.contentWindow?.postMessage(msg, "*");
```

**Fixed Code:**
```typescript
// Get target origin from appUrl
const getTargetOrigin = (appUrl: string | undefined): string => {
  if (!appUrl) return window.location.origin;
  try {
    const url = new URL(appUrl);
    return url.origin;
  } catch {
    return window.location.origin;
  }
};

// Use specific origin
const targetOrigin = getTargetOrigin(appUrl);
this.iframeRef.current?.contentWindow?.postMessage(msg, targetOrigin);
```

---

### Fix 2: Enhanced Message Validation

**File:** `helpers/communicator.ts`

**Add to class:**
```typescript
private messageTimestamps = new Map<string, number>();

private isValidMessage = (msg: SDKMessageEvent): boolean => {
  // Check iframe source
  if (this.iframeRef.current?.contentWindow !== msg.source) {
    return false;
  }

  // Validate message structure
  if (!msg.data || typeof msg.data !== 'object') {
    return false;
  }

  // Check for known method
  if (!Object.values(Methods).includes(msg.data.method)) {
    return false;
  }

  // Replay protection - check timestamp
  const messageId = `${msg.data.id}_${msg.data.method}`;
  const now = Date.now();
  const lastTimestamp = this.messageTimestamps.get(messageId) || 0;
  
  if (now - lastTimestamp < 1000) {
    // Reject messages within 1 second (potential replay)
    return false;
  }
  
  this.messageTimestamps.set(messageId, now);
  
  // Clean old timestamps (older than 5 minutes)
  if (this.messageTimestamps.size > 1000) {
    const fiveMinutesAgo = now - 300000;
    for (const [id, timestamp] of this.messageTimestamps.entries()) {
      if (timestamp < fiveMinutesAgo) {
        this.messageTimestamps.delete(id);
      }
    }
  }

  return true;
};
```

---

### Fix 3: Address Validation with Contract Detection

**File:** `components/SmartWallet/OwnerManagement.tsx`

**Replace handleAddOwner:**
```typescript
const handleAddOwner = async () => {
  // Validate address format
  const addressValidation = validateAddress(newOwnerAddress);
  if (!addressValidation.valid) {
    toast({
      title: "Invalid Address",
      description: addressValidation.error,
      status: "error",
      isClosable: true,
    });
    return;
  }

  const checksummedAddress = addressValidation.checksummed!;

  // Check if contract
  if (provider) {
    const isContract = await isContractAddress(checksummedAddress, provider);
    if (isContract) {
      toast({
        title: "Cannot Add Contract",
        description: "Contract addresses cannot be added as owners",
        status: "error",
        isClosable: true,
      });
      return;
    }
  }

  // Check for duplicates (case-insensitive)
  if (activeWallet.owners.some(
    o => o.toLowerCase() === checksummedAddress.toLowerCase()
  )) {
    toast({
      title: "Owner Exists",
      description: "This address is already an owner",
      status: "error",
      isClosable: true,
    });
    return;
  }

  try {
    await addOwner(activeWallet.id, { address: checksummedAddress });
    toast({
      title: "Owner Added",
      description: "Owner added successfully",
      status: "success",
      isClosable: true,
    });
    setNewOwnerAddress("");
    onClose();
  } catch (error: any) {
    toast({
      title: "Failed",
      description: error.message || "Failed to add owner",
      status: "error",
      isClosable: true,
    });
  }
};
```

**Add imports:**
```typescript
import { validateAddress, isContractAddress } from "../../utils/security";
```

---

### Fix 4: Race Condition Prevention in Approvals

**File:** `contexts/TransactionContext.tsx`

**Add at top of component:**
```typescript
const approvalLocks = new Map<string, boolean>();

const approveTransaction = useCallback(
  async (transactionId: string, approver: string) => {
    // Check lock
    if (approvalLocks.get(transactionId)) {
      throw new Error("Approval already in progress");
    }

    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) {
      throw new Error("Transaction not found");
    }

    // Set lock
    approvalLocks.set(transactionId, true);

    try {
      // Add approval atomically
      setApprovals((prev) => {
        const existing = prev[transactionId] || [];
        
        // Check if already approved by this address
        const alreadyApproved = existing.some(
          (a) => a.approver.toLowerCase() === approver.toLowerCase() && a.approved
        );
        
        if (alreadyApproved) {
          return prev; // No change needed
        }

        const newApproval: MultiSigApproval = {
          transactionId,
          approver,
          approved: true,
          timestamp: Date.now(),
        };

        const updated = {
          ...prev,
          [transactionId]: [...existing, newApproval],
        };

        // Check threshold atomically
        const approvalCount = [...existing, newApproval].filter((a) => a.approved).length;
        const requiredApprovals = activeWallet?.threshold || 1;

        if (approvalCount >= requiredApprovals) {
          // Use setTimeout to avoid state update conflicts
          setTimeout(() => {
            updateTransaction(transactionId, {
              status: TransactionStatus.APPROVED,
            });
          }, 0);
        }

        return updated;
      });
    } finally {
      // Release lock after a short delay
      setTimeout(() => {
        approvalLocks.delete(transactionId);
      }, 100);
    }
  },
  [transactions, activeWallet, updateTransaction]
);
```

---

### Fix 5: Encrypted Storage

**File:** `contexts/SmartWalletContext.tsx`

**Replace localStorage usage:**
```typescript
import { SecureStorage } from "../utils/encryption";

const secureStorage = new SecureStorage();

// Replace all localStorage.setItem calls:
// OLD: localStorage.setItem(STORAGE_KEY, JSON.stringify(smartWallets));
// NEW:
await secureStorage.setItem(STORAGE_KEY, JSON.stringify(smartWallets));

// Replace all localStorage.getItem calls:
// OLD: const stored = localStorage.getItem(STORAGE_KEY);
// NEW:
const stored = await secureStorage.getItem(STORAGE_KEY);
```

**Note:** This requires making the functions async. Update all callers accordingly.

---

### Fix 6: Transaction Replay Protection

**File:** `contexts/TransactionContext.tsx`

**Add nonce management:**
```typescript
import { NonceManager } from "../utils/security";

const nonceManager = new NonceManager(provider!);

const createTransaction = useCallback(
  async (tx: Omit<TransactionRequest, "id" | "status" | "createdAt">): Promise<TransactionRequest> => {
    // Get nonce
    const nonce = await nonceManager.getNextNonce(tx.from!);
    
    // Generate transaction hash for deduplication
    const txHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint256", "bytes", "uint256"],
        [tx.from, tx.to, tx.value || "0", tx.data || "0x", nonce]
      )
    );

    // Check for duplicates
    const existing = transactions.find(t => {
      const existingHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "address", "uint256", "bytes", "uint256"],
          [t.from, t.to, t.value || "0", t.data || "0x", t.nonce || 0]
        )
      );
      return existingHash === txHash;
    });

    if (existing) {
      throw new Error("Duplicate transaction detected");
    }

    const newTx: TransactionRequest = {
      ...tx,
      id: generateSecureId(), // Use secure ID generation
      status: TransactionStatus.PENDING,
      createdAt: Date.now(),
      method: (tx.method as TransactionExecutionMethod) || defaultExecutionMethod,
      nonce,
      expiresAt: Date.now() + 3600000, // 1 hour expiration
    };

    setTransactions((prev) => [...prev, newTx]);
    return newTx;
  },
  [defaultExecutionMethod, transactions, nonceManager]
);
```

---

### Fix 7: Provider Verification

**File:** `contexts/TransactionContext.tsx`

**Replace window.ethereum access:**
```typescript
const verifyProvider = (provider: any): boolean => {
  // Check for known provider signatures
  if (provider.isMetaMask || provider.isCoinbaseWallet || provider.isWalletConnect) {
    return true;
  }
  
  // Additional verification
  if (typeof provider.request !== 'function') {
    return false;
  }
  
  return true;
};

// In executeTransaction:
if (!signer) {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    const ethereum = (window as any).ethereum;
    
    if (!verifyProvider(ethereum)) {
      throw new Error("Unverified provider detected");
    }
    
    const web3Provider = new ethers.providers.Web3Provider(ethereum);
    const accounts = await web3Provider.listAccounts();
    
    // Verify account matches wallet
    if (accounts[0]?.toLowerCase() !== activeWallet.address.toLowerCase()) {
      throw new Error("Provider account does not match wallet address");
    }
    
    const web3Signer = web3Provider.getSigner();
    const txHash = await executeDirectTransaction(tx, provider, web3Signer);
    // ...
  }
}
```

---

### Fix 8: Access Control for Owner Management

**File:** `contexts/SmartWalletContext.tsx`

**Add owner verification:**
```typescript
const verifyCallerIsOwner = async (
  walletAddress: string,
  callerAddress: string
): Promise<boolean> => {
  if (!provider) return false;
  
  if (activeWallet?.type === SmartWalletType.GNOSIS_SAFE) {
    const { getSafeInfo } = await import("../helpers/smartWallet/gnosisSafe");
    const safeInfo = await getSafeInfo(walletAddress, provider);
    if (!safeInfo) return false;
    
    return safeInfo.owners.some(
      o => o.toLowerCase() === callerAddress.toLowerCase()
    );
  }
  
  // For other wallet types, check local state
  const wallet = smartWallets.find(
    w => w.address.toLowerCase() === walletAddress.toLowerCase()
  );
  
  return wallet?.owners.some(
    o => o.toLowerCase() === callerAddress.toLowerCase()
  ) || false;
};

const addOwner = useCallback(async (
  walletId: string,
  owner: OwnerInfo,
  callerAddress?: string
) => {
  const wallet = smartWallets.find(w => w.id === walletId);
  if (!wallet) {
    throw new Error("Wallet not found");
  }

  // Verify caller is owner
  if (callerAddress) {
    const isOwner = await verifyCallerIsOwner(wallet.address, callerAddress);
    if (!isOwner) {
      throw new Error("Unauthorized: Caller is not a wallet owner");
    }
  }

  // Validate new owner
  const validation = validateAddress(owner.address);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid address");
  }

  // Check for duplicates
  if (wallet.owners.some(
    o => o.toLowerCase() === validation.checksummed!.toLowerCase()
  )) {
    throw new Error("Owner already exists");
  }

  updateWallet(walletId, {
    owners: [...wallet.owners, validation.checksummed!],
  });
}, [smartWallets, updateWallet, provider]);
```

---

## Priority 2: High Priority Fixes

### Fix 9: Integer Overflow Prevention

**File:** `components/Body/index.tsx:459-461`

**Replace:**
```typescript
// OLD:
const txValue = params[0].value
  ? parseInt(params[0].value, 16).toString()
  : "0";

// NEW:
const txValue = params[0].value
  ? ethers.BigNumber.from(params[0].value).toString()
  : "0";
```

---

### Fix 10: Gas Limit Validation

**File:** `contexts/TransactionContext.tsx:316-346`

**Add to estimateGas:**
```typescript
const MAX_GAS_LIMIT = ethers.BigNumber.from("10000000"); // 10M

const estimateGas = useCallback(
  async (tx: Partial<TransactionRequest>): Promise<GasEstimate | null> => {
    if (!provider || !tx.to) {
      return null;
    }

    try {
      const gasLimit = await provider.estimateGas({
        to: tx.to,
        value: tx.value ? providers.BigNumber.from(tx.value) : undefined,
        data: tx.data || "0x",
      });

      // Validate gas limit
      if (gasLimit.gt(MAX_GAS_LIMIT)) {
        throw new Error(`Gas limit ${gasLimit.toString()} exceeds maximum ${MAX_GAS_LIMIT.toString()}`);
      }

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || providers.BigNumber.from(0);
      const estimatedCost = gasLimit.mul(gasPrice);

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        estimatedCost: estimatedCost.toString(),
      };
    } catch (error) {
      console.error("Failed to estimate gas", error);
      return null;
    }
  },
  [provider]
);
```

---

## Testing Checklist

After implementing fixes, test:

- [ ] Address validation rejects invalid inputs
- [ ] Contract addresses cannot be added as owners
- [ ] postMessage only sends to specific origins
- [ ] Message replay protection works
- [ ] Race conditions in approvals are prevented
- [ ] Encrypted storage works correctly
- [ ] Transaction nonces are managed properly
- [ ] Provider verification prevents fake providers
- [ ] Access control prevents unauthorized owner changes
- [ ] Integer overflow is prevented
- [ ] Gas limits are enforced
- [ ] All security tests pass

---

## Additional Recommendations

1. **Implement Content Security Policy (CSP)**
   - Add CSP headers to prevent XSS
   - Restrict script sources
   - Restrict iframe sources

2. **Add Rate Limiting**
   - Implement rate limiting on all user actions
   - Prevent DoS attacks
   - Use the RateLimiter class from utils/security.ts

3. **Implement Transaction Signing**
   - Require EIP-712 signatures for approvals
   - Store signatures with approvals
   - Verify signatures before execution

4. **Add Monitoring**
   - Log all security events
   - Monitor for suspicious activity
   - Alert on failed validations

5. **Regular Security Audits**
   - Schedule quarterly security reviews
   - Keep dependencies updated
   - Monitor for new vulnerabilities
