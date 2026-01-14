# Security Testing Guide

This guide provides comprehensive testing procedures for all security aspects of the Impersonator Smart Wallet system.

## Pre-Testing Setup

1. Install testing dependencies:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

2. Set up test environment variables
3. Configure test database/storage mocks

---

## Test Categories

### 1. Input Validation Tests

#### Address Validation
```typescript
describe("Address Validation", () => {
  test("rejects malicious addresses", () => {
    const malicious = [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "../../etc/passwd",
      "0x" + "a".repeat(1000), // Too long
      "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // Invalid hex
    ];
    
    malicious.forEach(addr => {
      expect(validateAddress(addr).valid).toBe(false);
    });
  });
  
  test("detects contract addresses", async () => {
    const contractAddr = "0x..."; // Known contract
    const isContract = await isContractAddress(contractAddr, provider);
    expect(isContract).toBe(true);
  });
});
```

#### Transaction Data Validation
```typescript
describe("Transaction Data Validation", () => {
  test("rejects malicious bytecode", () => {
    const malicious = [
      "0x" + "00".repeat(50000), // Too large
      "0xdeadbeef<script>", // Invalid hex
      "javascript:alert(1)", // XSS attempt
    ];
    
    malicious.forEach(data => {
      expect(validateTransactionData(data).valid).toBe(false);
    });
  });
});
```

---

### 2. Access Control Tests

#### Owner Management
```typescript
describe("Owner Management Security", () => {
  test("prevents unauthorized owner addition", async () => {
    const wallet = createTestWallet();
    const unauthorized = "0xUnauthorizedAddress";
    
    await expect(
      addOwner(wallet.id, { address: unauthorized }, unauthorized)
    ).rejects.toThrow("Unauthorized");
  });
  
  test("prevents removing last owner", async () => {
    const wallet = createTestWallet({ owners: ["0xOwner1"] });
    
    await expect(
      removeOwner(wallet.id, "0xOwner1")
    ).rejects.toThrow("Cannot remove last owner");
  });
  
  test("prevents threshold > owners", async () => {
    const wallet = createTestWallet({ owners: ["0x1", "0x2"], threshold: 1 });
    
    await expect(
      updateThreshold(wallet.id, 5)
    ).rejects.toThrow("Threshold cannot exceed owner count");
  });
});
```

---

### 3. Race Condition Tests

#### Concurrent Approvals
```typescript
describe("Race Condition Tests", () => {
  test("handles concurrent approvals correctly", async () => {
    const tx = createTestTransaction();
    const approvers = ["0xApprover1", "0xApprover2", "0xApprover3"];
    
    // Approve simultaneously
    const promises = approvers.map(addr => 
      approveTransaction(tx.id, addr)
    );
    
    await Promise.all(promises);
    
    // Verify all approvals recorded
    const pending = getPendingTransaction(tx.id);
    expect(pending.approvalCount).toBe(3);
    expect(pending.approvals.length).toBe(3);
  });
  
  test("prevents duplicate approvals", async () => {
    const tx = createTestTransaction();
    const approver = "0xApprover1";
    
    await approveTransaction(tx.id, approver);
    
    // Try to approve again
    await expect(
      approveTransaction(tx.id, approver)
    ).rejects.toThrow("Already approved");
  });
});
```

---

### 4. Message Security Tests

#### postMessage Security
```typescript
describe("postMessage Security", () => {
  test("only sends to allowed origins", () => {
    const allowedOrigin = "https://app.example.com";
    const maliciousOrigin = "https://evil.com";
    
    const message = { method: "getSafeInfo", data: {} };
    
    // Should only send to allowed origin
    sendMessageToIFrame(message, allowedOrigin);
    
    // Should not send to malicious origin
    expect(() => {
      sendMessageToIFrame(message, maliciousOrigin);
    }).toThrow();
  });
  
  test("validates message structure", () => {
    const invalidMessages = [
      { method: "unknownMethod" },
      { data: "not an object" },
      null,
      undefined,
    ];
    
    invalidMessages.forEach(msg => {
      expect(isValidMessage(msg as any)).toBe(false);
    });
  });
  
  test("prevents message replay", () => {
    const message = createTestMessage();
    
    // First message should be valid
    expect(isValidMessage(message)).toBe(true);
    
    // Immediate replay should be rejected
    expect(isValidMessage(message)).toBe(false);
  });
});
```

---

### 5. Storage Security Tests

#### Encryption Tests
```typescript
describe("Storage Encryption", () => {
  test("encrypts sensitive data", async () => {
    const sensitive = JSON.stringify({
      owners: ["0xOwner1", "0xOwner2"],
      threshold: 2,
    });
    
    await secureStorage.setItem("test", sensitive);
    
    const stored = localStorage.getItem("test");
    expect(stored).not.toBe(sensitive);
    expect(stored).toContain("encrypted"); // Check encryption marker
  });
  
  test("decrypts data correctly", async () => {
    const original = "sensitive data";
    await secureStorage.setItem("test", original);
    
    const decrypted = await secureStorage.getItem("test");
    expect(decrypted).toBe(original);
  });
  
  test("handles tampered data", async () => {
    localStorage.setItem("test", "tampered-encrypted-data");
    
    await expect(
      secureStorage.getItem("test")
    ).rejects.toThrow("Decryption failed");
  });
});
```

---

### 6. Transaction Security Tests

#### Transaction Validation
```typescript
describe("Transaction Security", () => {
  test("prevents integer overflow", () => {
    const largeValue = "115792089237316195423570985008687907853269984665640564039457584007913129639936"; // Max uint256 + 1
    
    const result = validateTransactionValue(largeValue);
    expect(result.valid).toBe(false);
  });
  
  test("prevents duplicate transactions", async () => {
    const tx = {
      from: "0xFrom",
      to: "0xTo",
      value: "1000",
      data: "0x",
    };
    
    await createTransaction(tx);
    
    // Try to create duplicate
    await expect(
      createTransaction(tx)
    ).rejects.toThrow("Duplicate transaction");
  });
  
  test("enforces gas limits", () => {
    const excessiveGas = "20000000"; // 20M gas
    
    const result = validateGasLimit(excessiveGas);
    expect(result.valid).toBe(false);
  });
  
  test("validates transaction amounts", () => {
    const excessiveAmount = ethers.utils.parseEther("2000000").toString(); // 2M ETH
    
    const result = validateTransactionValue(excessiveAmount);
    expect(result.valid).toBe(false);
  });
});
```

---

### 7. Provider Security Tests

#### Provider Verification
```typescript
describe("Provider Security", () => {
  test("rejects unverified providers", () => {
    const fakeProvider = {
      request: () => Promise.resolve([]),
      // Missing isMetaMask, isCoinbaseWallet, etc.
    };
    
    expect(verifyProvider(fakeProvider)).toBe(false);
  });
  
  test("verifies account matches wallet", async () => {
    const wallet = createTestWallet({ address: "0xWallet" });
    const provider = createMockProvider({ accounts: ["0xDifferent"] });
    
    await expect(
      executeTransaction(txId, provider)
    ).rejects.toThrow("Account does not match");
  });
});
```

---

### 8. Network Security Tests

#### RPC URL Validation
```typescript
describe("Network Security", () => {
  test("rejects HTTP URLs in production", () => {
    const httpUrl = "http://malicious-rpc.com";
    
    const result = validateRpcUrl(httpUrl);
    expect(result.valid).toBe(false);
  });
  
  test("validates network IDs", () => {
    const invalidNetworks = [-1, 0, 99999, 1.5];
    
    invalidNetworks.forEach(networkId => {
      expect(validateNetworkId(networkId).valid).toBe(false);
    });
  });
});
```

---

### 9. Multi-Sig Security Tests

#### Approval Workflow
```typescript
describe("Multi-Sig Security", () => {
  test("requires threshold approvals", async () => {
    const wallet = createTestWallet({ threshold: 3, owners: ["0x1", "0x2", "0x3", "0x4"] });
    const tx = createTestTransaction();
    
    // Approve with 2 owners (below threshold)
    await approveTransaction(tx.id, "0x1");
    await approveTransaction(tx.id, "0x2");
    
    const pending = getPendingTransaction(tx.id);
    expect(pending.canExecute).toBe(false);
    
    // Third approval should enable execution
    await approveTransaction(tx.id, "0x3");
    
    const updated = getPendingTransaction(tx.id);
    expect(updated.canExecute).toBe(true);
  });
  
  test("prevents execution without threshold", async () => {
    const wallet = createTestWallet({ threshold: 2 });
    const tx = createTestTransaction();
    
    // Only one approval
    await approveTransaction(tx.id, "0x1");
    
    // Try to execute
    await expect(
      executeTransaction(tx.id)
    ).rejects.toThrow("Insufficient approvals");
  });
});
```

---

### 10. Integration Security Tests

#### End-to-End Security
```typescript
describe("Integration Security", () => {
  test("complete attack scenario: XSS + CSRF", async () => {
    // Simulate XSS attack
    const maliciousScript = "<script>stealData()</script>";
    const address = maliciousScript + "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    
    // Should sanitize and extract valid address
    const result = validateAddress(address);
    expect(result.valid).toBe(false);
  });
  
  test("prevents transaction manipulation", async () => {
    const originalTx = createTestTransaction();
    
    // Try to modify transaction
    const modifiedTx = {
      ...originalTx,
      to: "0xAttacker",
      value: "1000000000000000000000", // 1000 ETH
    };
    
    // Should reject or require re-approval
    await expect(
      updateTransaction(originalTx.id, modifiedTx)
    ).rejects.toThrow("Cannot modify approved transaction");
  });
});
```

---

## Penetration Testing Scenarios

### Scenario 1: XSS Attack
1. Inject `<script>alert(document.cookie)</script>` in address field
2. Verify it's sanitized/blocked
3. Check localStorage is not accessible

### Scenario 2: CSRF Attack
1. Create malicious site that sends transaction requests
2. Verify origin validation prevents execution
3. Check CSRF tokens are required

### Scenario 3: Replay Attack
1. Capture transaction request
2. Replay same transaction
3. Verify nonce prevents duplicate execution

### Scenario 4: Race Condition Attack
1. Send 100 concurrent approval requests
2. Verify all are processed correctly
3. Check threshold is not bypassed

### Scenario 5: Integer Overflow
1. Send transaction with value > max uint256
2. Verify BigNumber handles correctly
3. Check no precision loss

---

## Automated Security Scanning

### 1. Dependency Scanning
```bash
npm audit
npm audit fix
```

### 2. Code Scanning
```bash
# Use ESLint security plugin
npm install --save-dev eslint-plugin-security

# Run security linting
npm run lint:security
```

### 3. Static Analysis
```bash
# Use SonarQube or similar
sonar-scanner
```

---

## Manual Testing Checklist

### Input Validation
- [ ] All address inputs validated
- [ ] Contract addresses rejected as owners
- [ ] Transaction data sanitized
- [ ] Value inputs use BigNumber
- [ ] Network IDs validated

### Access Control
- [ ] Only owners can modify wallet
- [ ] Threshold changes verified
- [ ] Owner additions require authorization
- [ ] Transaction approvals tracked correctly

### Message Security
- [ ] postMessage uses specific origins
- [ ] Message validation prevents injection
- [ ] Replay protection works
- [ ] Timestamp validation active

### Storage Security
- [ ] Sensitive data encrypted
- [ ] Keys not stored in localStorage
- [ ] Data can be decrypted correctly
- [ ] Tampered data rejected

### Transaction Security
- [ ] Nonces managed correctly
- [ ] Duplicate transactions prevented
- [ ] Gas limits enforced
- [ ] Amount limits enforced
- [ ] Expiration checked

### Provider Security
- [ ] Providers verified
- [ ] Accounts match wallets
- [ ] No fake providers accepted
- [ ] Signer validation works

---

## Performance Under Attack

### Load Testing
```typescript
describe("Performance Under Attack", () => {
  test("handles spam transactions", async () => {
    // Create 1000 transactions rapidly
    const promises = Array(1000).fill(0).map((_, i) =>
      createTransaction({
        from: "0xFrom",
        to: "0xTo",
        value: "0",
        data: "0x",
      })
    );
    
    const start = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - start;
    
    // Should complete in reasonable time
    expect(duration).toBeLessThan(10000); // 10 seconds
  });
  
  test("rate limiting prevents DoS", async () => {
    const limiter = new RateLimiter(10, 60000);
    const key = "test-key";
    
    // First 10 should succeed
    for (let i = 0; i < 10; i++) {
      expect(limiter.checkLimit(key)).toBe(true);
    }
    
    // 11th should fail
    expect(limiter.checkLimit(key)).toBe(false);
  });
});
```

---

## Reporting Security Issues

If you find security vulnerabilities:

1. **DO NOT** create public issues
2. Email security team directly
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix

---

## Continuous Security Monitoring

### Daily Checks
- [ ] Review error logs for suspicious activity
- [ ] Check for failed validations
- [ ] Monitor transaction patterns

### Weekly Checks
- [ ] Review dependency updates
- [ ] Check for new CVEs
- [ ] Review access logs

### Monthly Checks
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Code review

---

## Security Metrics to Track

1. **Failed Validations**: Count of rejected inputs
2. **Rate Limit Hits**: Number of rate-limited requests
3. **Suspicious Transactions**: Transactions flagged for review
4. **Provider Verification Failures**: Failed provider checks
5. **Encryption Failures**: Failed encryption/decryption attempts
6. **Message Replay Attempts**: Blocked replay attacks

---

## Conclusion

Regular security testing is essential. Run these tests:
- Before every release
- After major changes
- Monthly as part of security review
- After security incidents

Keep this guide updated as new threats emerge.
