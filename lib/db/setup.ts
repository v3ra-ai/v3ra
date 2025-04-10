import { prisma } from "./client";
import crypto from "crypto";

/**
 * Initialize the database with required configuration
 * This runs on server start to ensure database is ready
 */
export async function initializeDatabase() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("🚀 Database connection established");

    // Check if we need to add any default records (for dev environment)
    await ensureDefaultApiKeys();

    return { success: true };
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return { success: false, error };
  }
}

/**
 * Ensure default API keys exist for development
 */
async function ensureDefaultApiKeys() {
  const defaultKeys = [
    {
      name: "Default OpenAI",
      provider: "OpenAI",
      key: process.env.OPENAI_API_KEY || "sk-placeholder",
    },
    {
      name: "Default Anthropic",
      provider: "Anthropic",
      key: process.env.ANTHROPIC_API_KEY || "sk-ant-placeholder",
    },
    {
      name: "Default Google",
      provider: "Google",
      key: process.env.GEMINI_API_KEY || "ai-placeholder",
    },
    {
      name: "Default Grok",
      provider: "Grok",
      key: process.env.GROK_API_KEY || "xai-placeholder",
    },
  ];

  for (const keyData of defaultKeys) {
    // Check if key exists for this provider
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        provider: keyData.provider,
        name: keyData.name,
      },
    });

    // Only create if it doesn't exist
    if (
      !existingKey &&
      keyData.key !== "sk-placeholder" &&
      keyData.key !== "sk-ant-placeholder" &&
      keyData.key !== "ai-placeholder" &&
      keyData.key !== "xai-placeholder"
    ) {
      await prisma.apiKey.create({
        data: {
          name: keyData.name,
          provider: keyData.provider,
          key: encryptApiKey(keyData.key),
        },
      });
      console.log(`✅ Created default ${keyData.provider} API key`);
    }
  }
}

/**
 * Encrypt an API key for storage
 * In a production system, use a more secure method (e.g., KMS)
 */
export function encryptApiKey(apiKey: string): string {
  // For demo purposes, we'll use a simple encryption
  // In production, use a proper encryption service
  try {
    const encryptionKey =
      process.env.ENCRYPTION_KEY || "verafy-demo-encryption-key-32bytes";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(encryptionKey.padEnd(32).slice(0, 32)),
      iv,
    );

    let encrypted = cipher.update(apiKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Prepend IV to encrypted data for decryption later
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Error encrypting API key:", error);
    return apiKey; // Fallback to unencrypted in case of error
  }
}

/**
 * Decrypt an API key for use
 */
export function decryptApiKey(encryptedKey: string): string {
  try {
    const encryptionKey =
      process.env.ENCRYPTION_KEY || "verafy-demo-encryption-key-32bytes";

    // Extract IV and encrypted data
    const [ivHex, encryptedData] = encryptedKey.split(":");
    if (!ivHex || !encryptedData) {
      return encryptedKey; // Not encrypted in the expected format
    }

    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(encryptionKey.padEnd(32).slice(0, 32)),
      iv,
    );

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Error decrypting API key:", error);
    return encryptedKey; // Return encrypted version in case of error
  }
}
