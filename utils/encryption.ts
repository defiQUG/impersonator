/**
 * Encryption utilities for sensitive data storage
 * Note: Client-side encryption is not as secure as server-side
 * but provides basic protection against XSS and casual inspection
 */

/**
 * Simple encryption using Web Crypto API
 */
export async function encryptData(
  data: string,
  key: string
): Promise<string> {
  if (typeof window === "undefined" || !window.crypto) {
    // Fallback for Node.js or environments without crypto
    return btoa(data); // Base64 encoding (not secure, but better than plaintext)
  }

  try {
    // Derive key from password
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = encoder.encode(key);

    // Import key
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    // Derive encryption key
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("impersonator-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      cryptoKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    // Generate IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      derivedKey,
      dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    // Fallback to base64
    return btoa(data);
  }
}

/**
 * Decrypt data
 */
export async function decryptData(
  encrypted: string,
  key: string
): Promise<string> {
  if (typeof window === "undefined" || !window.crypto) {
    // Fallback
    try {
      return atob(encrypted);
    } catch {
      throw new Error("Decryption failed");
    }
  }

  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Decode base64
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Derive key
    const keyBuffer = encoder.encode(key);
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("impersonator-salt"),
        iterations: 100000,
        hash: "SHA-256",
      },
      cryptoKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // Decrypt
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      derivedKey,
      encryptedData
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Decryption failed");
  }
}

/**
 * Generate encryption key from user session
 */
export function generateEncryptionKey(): string {
  if (typeof window === "undefined") {
    return "default-key-change-in-production";
  }

  // Try to get from sessionStorage
  let key = sessionStorage.getItem("encryption_key");

  if (!key) {
    // Generate new key
    if (window.crypto) {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      key = Array.from(array, (byte) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
      sessionStorage.setItem("encryption_key", key);
    } else {
      // Fallback
      key = Math.random().toString(36).substring(2, 34);
      sessionStorage.setItem("encryption_key", key);
    }
  }

  return key;
}

/**
 * Secure storage wrapper
 */
export class SecureStorage {
  private key: string;

  constructor() {
    this.key = generateEncryptionKey();
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await encryptData(value, this.key);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error("Failed to encrypt data:", error);
      // Fallback to plaintext with warning
      console.warn("Storing data unencrypted due to encryption failure");
      localStorage.setItem(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) {
      return null;
    }

    try {
      return await decryptData(encrypted, this.key);
    } catch (error) {
      console.error("Failed to decrypt data:", error);
      // Try to read as plaintext (for migration)
      return encrypted;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}
