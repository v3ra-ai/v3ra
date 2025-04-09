/**
 * Secure Key Manager for Validator API Keys
 *
 * This module provides a secure way to store and retrieve API keys without exposing them to the client.
 * Keys are stored only on the server, and clients reference them via keyIds.
 */

import { v4 as uuidv4 } from "uuid";

// Types for key management
export interface ApiKey {
  id: string;
  name: string;
  provider: string;
  value: string;
  createdAt: number;
}

// In-memory storage for API keys (in production, use an encrypted database)
class KeyManager {
  private static instance: KeyManager;
  private keys: Map<string, ApiKey> = new Map();

  // Add default keys from environment variables
  constructor() {
    // Add default OpenAI key if available in env
    if (process.env.OPENAI_API_KEY) {
      this.addKey({
        name: "Default OpenAI Key",
        provider: "OpenAI",
        value: process.env.OPENAI_API_KEY,
      });
    }

    // Add default Anthropic key if available in env
    if (process.env.ANTHROPIC_API_KEY) {
      this.addKey({
        name: "Default Anthropic Key",
        provider: "Anthropic",
        value: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  // Singleton pattern
  public static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }

  // Add a new key
  public addKey({
    name,
    provider,
    value,
  }: {
    name: string;
    provider: string;
    value: string;
  }): string {
    const id = uuidv4();
    const key: ApiKey = {
      id,
      name,
      provider,
      value,
      createdAt: Date.now(),
    };

    this.keys.set(id, key);
    return id;
  }

  // Get a key by ID
  public getKey(id: string): ApiKey | undefined {
    return this.keys.get(id);
  }

  // Get the actual API key value by ID
  public getKeyValue(id: string): string | null {
    const key = this.keys.get(id);
    return key ? key.value : null;
  }

  // Remove a key
  public removeKey(id: string): boolean {
    return this.keys.delete(id);
  }

  // List all keys (without exposing the actual key values)
  public listKeys(): Array<Omit<ApiKey, "value">> {
    return Array.from(this.keys.values()).map(
      ({ id, name, provider, createdAt }) => ({
        id,
        name,
        provider,
        createdAt,
      }),
    );
  }

  // Get keys by provider
  public getKeysByProvider(provider: string): Array<Omit<ApiKey, "value">> {
    return this.listKeys().filter((key) => key.provider === provider);
  }
}

// Singleton instance
export const keyManager = KeyManager.getInstance();

// Helper function to check if a user has admin access
// In a real app, this would check auth tokens, user roles, etc.
export const isAdmin = (): boolean => {
  // For development, we'll assume admin access
  // In production, implement proper authentication checks
  return true;

  // Example of a more realistic check:
  // return req.session?.user?.role === 'admin';
};
