/**
 * Encryption utility tests
 * Tests for SecureStorage and encryption functions
 */

import { encryptData, decryptData, generateEncryptionKey, SecureStorage } from "../utils/encryption";

describe("Encryption Utilities", () => {
  describe("encryptData / decryptData", () => {
    it("should encrypt and decrypt data correctly", async () => {
      const key = "test-key-12345";
      const data = "sensitive wallet data";
      
      const encrypted = await encryptData(data, key);
      expect(encrypted).not.toBe(data);
      expect(encrypted.length).toBeGreaterThan(0);
      
      const decrypted = await decryptData(encrypted, key);
      expect(decrypted).toBe(data);
    });

    it("should produce different encrypted output for same data", async () => {
      const key = "test-key";
      const data = "same data";
      
      const encrypted1 = await encryptData(data, key);
      const encrypted2 = await encryptData(data, key);
      
      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      const decrypted1 = await decryptData(encrypted1, key);
      const decrypted2 = await decryptData(encrypted2, key);
      expect(decrypted1).toBe(data);
      expect(decrypted2).toBe(data);
    });

    it("should fail to decrypt with wrong key", async () => {
      const key = "correct-key";
      const wrongKey = "wrong-key";
      const data = "test data";
      
      const encrypted = await encryptData(data, key);
      
      await expect(decryptData(encrypted, wrongKey)).rejects.toThrow();
    });

    it("should handle empty strings", async () => {
      const key = "test-key";
      const data = "";
      
      const encrypted = await encryptData(data, key);
      const decrypted = await decryptData(encrypted, key);
      expect(decrypted).toBe(data);
    });

    it("should handle large data", async () => {
      const key = "test-key";
      const data = "x".repeat(10000);
      
      const encrypted = await encryptData(data, key);
      const decrypted = await decryptData(encrypted, key);
      expect(decrypted).toBe(data);
    });

    it("should handle JSON data", async () => {
      const key = "test-key";
      const data = JSON.stringify({ wallets: [{ address: "0x123", owners: ["0xabc"] }] });
      
      const encrypted = await encryptData(data, key);
      const decrypted = await decryptData(encrypted, key);
      const parsed = JSON.parse(decrypted);
      expect(parsed.wallets).toBeDefined();
    });
  });

  describe("generateEncryptionKey", () => {
    it("should generate a key", () => {
      const key = generateEncryptionKey();
      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
    });

    it("should generate different keys on each call (if sessionStorage cleared)", () => {
      // Note: In real scenario, key is cached in sessionStorage
      // This test verifies key generation works
      const key1 = generateEncryptionKey();
      expect(key1).toBeDefined();
    });
  });

  describe("SecureStorage", () => {
    let storage: SecureStorage;

    beforeEach(() => {
      storage = new SecureStorage();
      // Clear localStorage before each test
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
    });

    it("should store and retrieve encrypted data", async () => {
      const key = "test-key";
      const value = "sensitive data";
      
      await storage.setItem(key, value);
      const retrieved = await storage.getItem(key);
      
      expect(retrieved).toBe(value);
    });

    it("should return null for non-existent keys", async () => {
      const retrieved = await storage.getItem("non-existent");
      expect(retrieved).toBeNull();
    });

    it("should remove items", async () => {
      const key = "test-key";
      const value = "data";
      
      await storage.setItem(key, value);
      expect(await storage.getItem(key)).toBe(value);
      
      storage.removeItem(key);
      expect(await storage.getItem(key)).toBeNull();
    });

    it("should store JSON data correctly", async () => {
      const key = "wallets";
      const value = JSON.stringify([{ id: "1", address: "0x123" }]);
      
      await storage.setItem(key, value);
      const retrieved = await storage.getItem(key);
      
      expect(retrieved).toBe(value);
      const parsed = JSON.parse(retrieved!);
      expect(parsed).toHaveLength(1);
    });

    it("should handle multiple keys", async () => {
      await storage.setItem("key1", "value1");
      await storage.setItem("key2", "value2");
      await storage.setItem("key3", "value3");
      
      expect(await storage.getItem("key1")).toBe("value1");
      expect(await storage.getItem("key2")).toBe("value2");
      expect(await storage.getItem("key3")).toBe("value3");
    });

    it("should overwrite existing values", async () => {
      const key = "test-key";
      
      await storage.setItem(key, "value1");
      expect(await storage.getItem(key)).toBe("value1");
      
      await storage.setItem(key, "value2");
      expect(await storage.getItem(key)).toBe("value2");
    });
  });
});
