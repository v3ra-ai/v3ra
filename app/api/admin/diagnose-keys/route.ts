import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { keyService } from "@/lib/services/keyService";
import { createErrorResponse } from "@/lib/utils";

// Define types for the response structure
interface ApiKeyResult {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  decryptable: boolean;
  keyPattern: string | null; // Allow string or null
  linkedValidators: number;
}

interface ValidatorResult {
  id: string;
  name: string;
  provider: string;
  modelName: string;
  validatorType: string;
  active: boolean;
  hasKey: boolean;
  keyIds: string[];
}

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

interface Summary {
  totalKeys: number;
  activeKeys: number;
  decryptableKeys: number;
  validatorsWithKeys: number;
  totalValidators: number;
  activeValidators: number;
}

interface DiagnoseKeysResponse {
  apiKeys: ApiKeyResult[];
  validators: ValidatorResult[];
  tests: TestResult[];
  summary: Summary;
}

function areEncryptionEnvVarsValid(): boolean {
  const keyLength = process.env.ENCRYPTION_KEY?.length || 0;
  const ivLength = process.env.ENCRYPTION_IV?.length || 0;
  return keyLength >= 32 && ivLength >= 16;
}

/**
 * API endpoint to diagnose API key issues
 *
 * This endpoint performs a comprehensive diagnostic on API keys,
 * checking encryption, validator links, and more.
 */
export async function GET() {
  // Remove unused 'request'
  try {
    const results: DiagnoseKeysResponse = {
      apiKeys: [],
      validators: [],
      tests: [],
      summary: {
        totalKeys: 0,
        activeKeys: 0,
        decryptableKeys: 0,
        validatorsWithKeys: 0,
        totalValidators: 0,
        activeValidators: 0,
      },
    };

    // Test API Keys
    const apiKeys = await prisma.apiKey.findMany();
    results.summary.totalKeys = apiKeys.length;
    results.summary.activeKeys = apiKeys.filter((key) => key.isActive).length;

    for (const key of apiKeys) {
      const keyResult: ApiKeyResult = {
        id: key.id,
        name: key.name,
        provider: key.provider,
        isActive: key.isActive,
        decryptable: false,
        keyPattern: null,
        linkedValidators: 0,
      };

      try {
        const decryptedKey = await keyService.getKeyValue(key.id);
        if (decryptedKey) {
          keyResult.decryptable = true;
          results.summary.decryptableKeys++;
          keyResult.keyPattern = `${decryptedKey.substring(
            0,
            3
          )}...${decryptedKey.substring(decryptedKey.length - 3)}`;
        }
      } catch (error) {
        console.error(`Error decrypting key ${key.id}:`, error);
      }

      const linkedValidatorCount = await prisma.validatorKey.count({
        where: { apiKeyId: key.id },
      });
      keyResult.linkedValidators = linkedValidatorCount;

      results.apiKeys.push(keyResult);
    }

    // Test Validators
    const validators = await prisma.validator.findMany({
      include: { apiKeys: true },
    });
    results.summary.totalValidators = validators.length;
    results.summary.activeValidators = validators.filter(
      (v) => v.active
    ).length;

    for (const validator of validators) {
      const validatorResult: ValidatorResult = {
        id: validator.id,
        name: validator.profileName,
        provider: validator.provider,
        modelName: validator.modelName || "unknown",
        validatorType: validator.validatorType || "Standard",
        active: validator.active,
        hasKey: validator.apiKeys.length > 0,
        keyIds: validator.apiKeys.map((vk) => vk.apiKeyId),
      };

      if (validator.active && validator.apiKeys.length > 0) {
        results.summary.validatorsWithKeys++;
      }

      results.validators.push(validatorResult);
    }

    // Diagnostic Tests
    const allActiveValidatorsHaveKeys = validators
      .filter((v) => v.active)
      .every((v) => v.apiKeys.length > 0);
    results.tests.push({
      name: "All active validators have API keys",
      passed: allActiveValidatorsHaveKeys,
      details: allActiveValidatorsHaveKeys
        ? "All active validators have associated API keys"
        : "Some active validators are missing API keys",
    });

    const allKeysDecryptable =
      results.summary.decryptableKeys === results.summary.totalKeys;
    results.tests.push({
      name: "API key decryption test",
      passed: allKeysDecryptable,
      details: allKeysDecryptable
        ? "All API keys can be decrypted successfully"
        : `${results.summary.totalKeys - results.summary.decryptableKeys} of ${
            results.summary.totalKeys
          } keys cannot be decrypted`,
    });

    results.tests.push({
      name: "Encryption environment variables",
      passed: areEncryptionEnvVarsValid(),
      details: areEncryptionEnvVarsValid()
        ? "Encryption environment variables are properly configured"
        : `Encryption variables may be misconfigured: Key length=${
            process.env.ENCRYPTION_KEY?.length || 0
          }, IV length=${process.env.ENCRYPTION_IV?.length || 0}`,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error diagnosing API keys:", error);
    return createErrorResponse(error);
  }
}
