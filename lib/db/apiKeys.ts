import { prisma } from "./client";
import { encryptApiKey, decryptApiKey } from "./setup";
import crypto from "crypto";

/**
 * Add a new API key to the database
 */

export async function addApiKey(data: {
  name: string;
  provider: string;
  key: string;
}) {
  return prisma.apiKey.create({
    data: {
      name: data.name,
      provider: data.provider,
      key: encryptApiKey(data.key),
      isActive: true,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get an API key by ID
 */
export async function getApiKey(id: string) {
  const apiKey = await prisma.apiKey.findUnique({
    where: { id },
  });

  if (!apiKey) return null;

  // Don't decrypt here - only decrypt when needed for API calls
  return apiKey;
}

/**
 * Get API key value (decrypted) by ID
 */
export async function getApiKeyValue(id: string): Promise<string | null> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { id },
  });

  if (!apiKey) return null;

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id },
    data: { lastUsed: new Date() },
  });

  return decryptApiKey(apiKey.key);
}

/**
 * Get API keys by provider
 */
export async function getApiKeysByProvider(provider: string) {
  return prisma.apiKey.findMany({
    where: {
      provider,
      isActive: true,
    },
  });
}

/**
 * Get all API keys
 */
export async function getAllApiKeys() {
  return prisma.apiKey.findMany({
    orderBy: {
      provider: "asc",
    },
  });
}

/**
 * Update an API key
 */
export async function updateApiKey(
  id: string,
  data: {
    name?: string;
    isActive?: boolean;
    key?: string;
  },
) {
  const updates: Record<string, unknown> = {};

  if (data.name) updates.name = data.name;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  if (data.key) updates.key = encryptApiKey(data.key);

  return prisma.apiKey.update({
    where: { id },
    data: updates,
  });
}

/**
 * Delete an API key
 */
export async function deleteApiKey(id: string) {
  return prisma.apiKey.delete({
    where: { id },
  });
}

/**
 * Associate an API key with a validator
 */
export async function assignApiKeyToValidator(
  apiKeyId: string,
  validatorId: string,
) {
  return prisma.validatorKey.create({
    data: {
      id: crypto.randomUUID(),
      apiKeyId,
      validatorId,
    },
  });
}

/**
 * Remove API key association from validator
 */
export async function removeApiKeyFromValidator(
  apiKeyId: string,
  validatorId: string,
) {
  return prisma.validatorKey.deleteMany({
    where: {
      apiKeyId,
      validatorId,
    },
  });
}
