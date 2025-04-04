import { prisma } from '../db/client';
import * as crypto from 'crypto';

// Encryption key and IV - in production, these would be in environment variables
// IMPORTANT: In a real production app, use a proper secret management system
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'verafy-default-encryption-key-32chars';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'verafy-default-iv';

// Define interfaces for better type safety
export interface ApiKey {
  id: string;
  name: string;
  provider: string;
  active: boolean;
  createdAt: Date;
}

export interface ApiKeyInput {
  name: string;
  provider: string;
  value: string;
  active?: boolean;
}

/**
 * Service for managing API keys securely in the database
 */
export class KeyService {
  /**
   * Encrypt an API key before storing it
   */
  private encryptKey(key: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY), 
      Buffer.from(ENCRYPTION_IV, 'utf8').slice(0, 16)
    );
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt an API key from the database
   */
  private decryptKey(encryptedKey: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY), 
      Buffer.from(ENCRYPTION_IV, 'utf8').slice(0, 16)
    );
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Add a new API key to the database
   */
  async addKey(data: ApiKeyInput): Promise<ApiKey> {
    const encryptedKey = this.encryptKey(data.value);
    
    const apiKey = await prisma.apiKey.create({
      data: {
        name: data.name,
        provider: data.provider,
        key: encryptedKey,
        isActive: data.active !== undefined ? data.active : true
      }
    });
    
    return {
      id: apiKey.id,
      name: apiKey.name,
      provider: apiKey.provider,
      active: apiKey.isActive,
      createdAt: apiKey.createdAt
    };
  }

  /**
   * Get all API keys from the database
   */
  async getAllKeys(): Promise<ApiKey[]> {
    const keys = await prisma.apiKey.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return keys.map(key => ({
      id: key.id,
      name: key.name,
      provider: key.provider,
      active: key.isActive,
      createdAt: key.createdAt
    }));
  }

  /**
   * Get a key by ID (without decrypting)
   */
  async getKey(id: string) {
    return prisma.apiKey.findUnique({
      where: { id }
    });
  }

  /**
   * Get the decrypted API key value by ID
   */
  async getKeyValue(id: string): Promise<string | null> {
    const key = await prisma.apiKey.findUnique({
      where: { id }
    });
    
    if (!key) return null;
    
    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id },
      data: { lastUsed: new Date() }
    });
    
    return this.decryptKey(key.key);
  }

  /**
   * List all keys (without exposing the actual key values)
   */
  async listKeys() {
    const keys = await prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        provider: true,
        isActive: true,
        createdAt: true,
        lastUsed: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return keys;
  }

  /**
   * Get keys by provider
   */
  async getKeysByProvider(provider: string) {
    return prisma.apiKey.findMany({
      where: { 
        provider,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        provider: true,
        isActive: true,
        createdAt: true,
        lastUsed: true
      }
    });
  }

  /**
   * Delete a key
   */
  async removeKey(id: string): Promise<boolean> {
    try {
      await prisma.apiKey.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting key:', error);
      return false;
    }
  }

  /**
   * Get the first active key for a provider
   */
  async getFirstActiveKeyForProvider(provider: string): Promise<string | null> {
    const key = await prisma.apiKey.findFirst({
      where: {
        provider,
        isActive: true
      },
      orderBy: {
        lastUsed: 'asc' // Use the least recently used key for load balancing
      }
    });
    
    return key ? this.decryptKey(key.key) : null;
  }
}

// Export singleton instance
export const keyService = new KeyService();
