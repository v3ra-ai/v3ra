import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { keyService } from "@/lib/services/keyService";
import crypto from 'crypto';

/**
 * API endpoint to diagnose API key issues
 * 
 * This endpoint performs a comprehensive diagnostic on API keys,
 * checking encryption, validator links, and more.
 */
export async function GET(request: NextRequest) {
  try {
    const results = {
      apiKeys: [],
      validators: [],
      tests: [],
      summary: {
        totalKeys: 0,
        activeKeys: 0,
        decryptableKeys: 0,
        validatorsWithKeys: 0,
        totalValidators: 0,
        activeValidators: 0
      }
    };
    
    // -------------------
    // Test API Keys
    // -------------------
    const apiKeys = await prisma.apiKey.findMany();
    results.summary.totalKeys = apiKeys.length;
    results.summary.activeKeys = apiKeys.filter(key => key.isActive).length;
    
    // Test each API key
    for (const key of apiKeys) {
      const keyResult = {
        id: key.id,
        name: key.name,
        provider: key.provider,
        isActive: key.isActive,
        decryptable: false,
        keyPattern: null,
        linkedValidators: 0
      };
      
      // Test decryption
      try {
        const decryptedKey = await keyService.getKeyValue(key.id);
        if (decryptedKey) {
          keyResult.decryptable = true;
          results.summary.decryptableKeys++;
          
          // Store the pattern (first/last few chars) for verification
          keyResult.keyPattern = `${decryptedKey.substring(0, 3)}...${decryptedKey.substring(decryptedKey.length - 3)}`;
        }
      } catch (error) {
        console.error(`Error decrypting key ${key.id}:`, error);
      }
      
      // Count linked validators
      const linkedValidatorCount = await prisma.validatorKey.count({
        where: { apiKeyId: key.id }
      });
      keyResult.linkedValidators = linkedValidatorCount;
      
      results.apiKeys.push(keyResult);
    }
    
    // -------------------
    // Test Validators
    // -------------------
    const validators = await prisma.validator.findMany({
      include: { apiKeys: true }
    });
    results.summary.totalValidators = validators.length;
    results.summary.activeValidators = validators.filter(v => v.active).length;
    
    // Count validators with keys
    for (const validator of validators) {
      const validatorResult = {
        id: validator.id,
        name: validator.profileName,
        provider: validator.provider,
        modelName: validator.modelName || 'unknown',
        validatorType: validator.validatorType || 'Standard',
        active: validator.active,
        hasKey: validator.apiKeys.length > 0,
        keyIds: validator.apiKeys.map(vk => vk.apiKeyId)
      };
      
      if (validator.active && validator.apiKeys.length > 0) {
        results.summary.validatorsWithKeys++;
      }
      
      results.validators.push(validatorResult);
    }
    
    // -------------------
    // Run Diagnostic Tests
    // -------------------
    // Test 1: Check if all active validators have API keys
    const allActiveValidatorsHaveKeys = validators
      .filter(v => v.active)
      .every(v => v.apiKeys.length > 0);
      
    results.tests.push({
      name: "All active validators have API keys",
      passed: allActiveValidatorsHaveKeys,
      details: allActiveValidatorsHaveKeys 
        ? "All active validators have associated API keys" 
        : "Some active validators are missing API keys"
    });
    
    // Test 2: Check if API keys can be decrypted
    const allKeysDecryptable = results.summary.decryptableKeys === results.summary.totalKeys;
    results.tests.push({
      name: "API key decryption test",
      passed: allKeysDecryptable,
      details: allKeysDecryptable 
        ? "All API keys can be decrypted successfully" 
        : `${results.summary.totalKeys - results.summary.decryptableKeys} of ${results.summary.totalKeys} keys cannot be decrypted`
    });
    
    // Test 3: Check environment variables
    const envKeyLength = process.env.ENCRYPTION_KEY?.length || 0;
    const envIvLength = process.env.ENCRYPTION_IV?.length || 0;
    
    const envVarsConfigured = envKeyLength >= 32 && envIvLength >= 16;
    results.tests.push({
      name: "Encryption environment variables",
      passed: envVarsConfigured,
      details: envVarsConfigured 
        ? "Encryption environment variables are properly configured" 
        : `Encryption variables may be misconfigured: Key length=${envKeyLength}, IV length=${envIvLength}`
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error diagnosing API keys:", error);
    return NextResponse.json(
      { error: "Failed to diagnose API keys", details: String(error) },
      { status: 500 }
    );
  }
}
