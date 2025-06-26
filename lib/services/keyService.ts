import { prisma } from "@/lib/db/client";
import crypto from "crypto";

class KeyService {
  private algorithm = "aes-256-gcm";
  private keyLength = 32;
  private ivLength = 16;
  private tagLength = 16;
  private saltLength = 64;
  private pbkdf2Iterations = 100000;

  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, this.pbkdf2Iterations, this.keyLength, "sha256");
  }

  encrypt(text: string, password: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;
    
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    
    return combined.toString("base64");
  }

  decrypt(encryptedData: string, password: string): string {
    const combined = Buffer.from(encryptedData, "base64");
    
    const salt = combined.slice(0, this.saltLength);
    const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
    const tag = combined.slice(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.tagLength);
    const encrypted = combined.slice(this.saltLength + this.ivLength + this.tagLength);
    
    const key = this.deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString("utf8");
  }

  async getDecryptedKey(keyId: string): Promise<string | null> {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId }
      });

      if (!apiKey || !apiKey.key) {
        return null;
      }

      // For now, return the key directly - in production, implement proper decryption
      return apiKey.key;
    } catch (error) {
      console.error("Error getting decrypted key:", error);
      return null;
    }
  }

  async getFirstActiveKeyForProvider(provider: string): Promise<{ id: string; key: string } | null> {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          provider,
          isActive: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (!apiKey || !apiKey.key) {
        return null;
      }

      return {
        id: apiKey.id,
        key: apiKey.key
      };
    } catch (error) {
      console.error("Error getting first active key for provider:", error);
      return null;
    }
  }
}

export const keyService = new KeyService();