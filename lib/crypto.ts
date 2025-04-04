import crypto from 'crypto';

// AES-256-CBC requires a 32-byte key and 16-byte IV
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'verafy-default-encryption-key-32chars!!';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'verafy-default-iv!';

// Ensure key and IV are the correct length
function normalizeKey(key: string): Buffer {
  return crypto.createHash('sha256').update(String(key)).digest();
}

function normalizeIV(iv: string): Buffer {
  return Buffer.from(iv.padEnd(16, '!').slice(0, 16));
}

/**
 * Encrypts a plain text key using AES-256-CBC
 */
export function encryptKey(plainKey: string): string {
  try {
    const key = normalizeKey(ENCRYPTION_KEY);
    const iv = normalizeIV(ENCRYPTION_IV);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plainKey, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt key');
  }
}

/**
 * Decrypts an encrypted key using AES-256-CBC
 */
export function decryptKey(encryptedKey: string): string | null {
  try {
    const key = normalizeKey(ENCRYPTION_KEY);
    const iv = normalizeIV(ENCRYPTION_IV);

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedKey, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Tests if the encryption environment is properly configured
 */
export function testEncryptionEnv(): boolean {
  try {
    const testValue = 'test-encryption-123';
    const encrypted = encryptKey(testValue);
    const decrypted = decryptKey(encrypted);
    return decrypted === testValue;
  } catch (error) {
    console.error('Encryption environment test failed:', error);
    return false;
  }
}
