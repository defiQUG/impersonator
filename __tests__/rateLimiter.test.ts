/**
 * Rate limiter tests
 */

import { RateLimiter } from "../utils/security";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(5, 1000); // 5 requests per 1000ms
  });

  it("should allow requests within limit", () => {
    const key = "test-key";
    
    expect(limiter.checkLimit(key)).toBe(true);
    expect(limiter.checkLimit(key)).toBe(true);
    expect(limiter.checkLimit(key)).toBe(true);
    expect(limiter.checkLimit(key)).toBe(true);
    expect(limiter.checkLimit(key)).toBe(true);
  });

  it("should reject requests exceeding limit", () => {
    const key = "test-key";
    
    // Make 5 requests (at limit)
    for (let i = 0; i < 5; i++) {
      expect(limiter.checkLimit(key)).toBe(true);
    }
    
    // 6th request should be rejected
    expect(limiter.checkLimit(key)).toBe(false);
  });

  it("should reset after window expires", async () => {
    const key = "test-key";
    
    // Fill up the limit
    for (let i = 0; i < 5; i++) {
      limiter.checkLimit(key);
    }
    
    // Should be at limit
    expect(limiter.checkLimit(key)).toBe(false);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should allow requests again
    expect(limiter.checkLimit(key)).toBe(true);
  });

  it("should track different keys independently", () => {
    const key1 = "key1";
    const key2 = "key2";
    
    // Fill up key1
    for (let i = 0; i < 5; i++) {
      limiter.checkLimit(key1);
    }
    
    // key1 should be at limit
    expect(limiter.checkLimit(key1)).toBe(false);
    
    // key2 should still have full limit
    expect(limiter.checkLimit(key2)).toBe(true);
  });

  it("should reset specific key", () => {
    const key = "test-key";
    
    // Fill up the limit
    for (let i = 0; i < 5; i++) {
      limiter.checkLimit(key);
    }
    
    expect(limiter.checkLimit(key)).toBe(false);
    
    // Reset
    limiter.reset(key);
    
    // Should allow requests again
    expect(limiter.checkLimit(key)).toBe(true);
  });

  it("should handle rapid requests", () => {
    const key = "test-key";
    
    // Make rapid requests
    const results: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(limiter.checkLimit(key));
    }
    
    // First 5 should be true, rest false
    expect(results.slice(0, 5).every(r => r === true)).toBe(true);
    expect(results.slice(5).every(r => r === false)).toBe(true);
  });
});
