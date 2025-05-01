import crypto from "crypto";
import { sanitizeError } from "@/utils/security-utils";

// AES-256-CBC requires a 32-byte key and 16-byte IV
const AES_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_IV = process.env.ENCRYPTION_IV;

// Validate environment variables and assign to typed constants
if (!AES_ENCRYPTION_KEY || !ENCRYPTION_IV) {
  throw new Error("Encryption key and IV must be set in environment variables");
}
const encryptionKey: string = AES_ENCRYPTION_KEY;
const encryptionIV: string = ENCRYPTION_IV;

// Ensure key is 32 bytes for AES-256-CBC
function normalizeKey(key: string): Buffer {
  return crypto.createHash("sha256").update(String(key)).digest();
}

// Ensure IV is 16 bytes for AES-256-CBC
function normalizeIV(iv: string): Buffer {
  return Buffer.from(iv.padEnd(16, "!").slice(0, 16));
}

/**
 * Encrypts a plain text key using AES-256-CBC
 */
export function encryptKey(plainKey: string): string {
  try {
    // Normalize key and IV for encryption
    const key = normalizeKey(encryptionKey);
    const iv = normalizeIV(encryptionIV);

    // Encrypt using AES-256-CBC
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(plainKey, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  } catch (error) {
    console.error(sanitizeError(error));
    throw new Error("Failed to encrypt key");
  }
}

/**
 * Decrypts an encrypted key using AES-256-CBC
 */
export function decryptKey(encryptedKey: string): string | null {
  try {
    // Normalize key and IV for decryption
    const key = normalizeKey(encryptionKey);
    const iv = normalizeIV(encryptionIV);

    // Decrypt using AES-256-CBC
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedKey, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error(sanitizeError(error));
    return null;
  }
}

/**
 * Tests if the encryption environment is properly configured
 */
export function testEncryptionEnv(): boolean {
  try {
    // Test encryption and decryption with a sample value
    const testValue = "test-encryption-123";
    const encrypted = encryptKey(testValue);
    const decrypted = decryptKey(encrypted);
    return decrypted === testValue;
  } catch (error) {
    console.error(sanitizeError(error));
    return false;
  }
}