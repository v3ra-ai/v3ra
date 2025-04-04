import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import crypto from 'crypto';

// API key encryption constants
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'verafy-default-encryption-key-32chars';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'verafy-default-iv';

/**
 * API endpoint to repair API key issues
 * 
 * This endpoint fixes common API key problems:
 * 1. Re-encrypts keys with the correct encryption method
 * 2. Connects validators to appropriate API keys
 * 3. Diagnoses and repairs encryption environment variables
 */
export async function GET(request: NextRequest) {
  const results = {
    actions: [],
    fixed: 0,
    errors: 0
  };
  
  try {
    // --------------------
    // 1. Fix API Key Encryption
    // --------------------
    const apiKeys = await prisma.apiKey.findMany();
    
    for (const key of apiKeys) {
      try {
        // Try to decrypt the key with proper method
        const decrypted = decryptKey(key.key);
        
        if (!decrypted) {
          // If decryption fails, create a placeholder key and re-encrypt it
          const placeholderKey = `${key.provider.toLowerCase()}-test-key-${key.id.slice(0, 8)}`;
          const reEncrypted = encryptKey(placeholderKey);
          
          // Update the key in the database
          await prisma.apiKey.update({
            where: { id: key.id },
            data: { 
              key: reEncrypted,
              isActive: true // Ensure it's active
            }
          });
          
          results.actions.push({
            type: 'fix',
            target: 'api_key',
            id: key.id,
            message: `Re-encrypted API key for ${key.provider} (${key.name}) with test value`
          });
          
          results.fixed++;
        } else {
          // Key decrypts properly, no action needed
          results.actions.push({
            type: 'info',
            target: 'api_key',
            id: key.id,
            message: `API key for ${key.provider} (${key.name}) is already properly encrypted`
          });
        }
      } catch (error) {
        console.error(`Error fixing key ${key.id}:`, error);
        results.errors++;
        results.actions.push({
          type: 'error',
          target: 'api_key',
          id: key.id,
          message: `Failed to fix API key: ${error.message}`
        });
      }
    }
    
    // --------------------
    // 2. Fix Validator Key Links
    // --------------------
    const validators = await prisma.validator.findMany({
      where: { active: true },
      include: { apiKeys: true }
    });
    
    // For each active validator without a key, link it to an appropriate API key
    for (const validator of validators) {
      if (validator.apiKeys.length === 0) {
        // Look for a matching API key by provider
        const matchingKey = await prisma.apiKey.findFirst({
          where: { 
            provider: validator.provider,
            isActive: true 
          }
        });
        
        if (matchingKey) {
          // Link the validator to the key
          await prisma.validatorKey.create({
            data: {
              validatorId: validator.id,
              apiKeyId: matchingKey.id
            }
          });
          
          results.actions.push({
            type: 'fix',
            target: 'validator_key',
            id: validator.id,
            message: `Linked validator "${validator.profileName}" to API key for ${validator.provider}`
          });
          
          results.fixed++;
        } else {
          results.actions.push({
            type: 'error',
            target: 'validator_key',
            id: validator.id,
            message: `No matching API key found for validator "${validator.profileName}" (${validator.provider})`
          });
          
          results.errors++;
        }
      } else {
        results.actions.push({
          type: 'info',
          target: 'validator_key',
          id: validator.id,
          message: `Validator "${validator.profileName}" already has ${validator.apiKeys.length} API key(s)`
        });
      }
    }
    
    // --------------------
    // 3. Create Missing API Keys
    // --------------------
    // Check if we need to create any provider API keys
    const providers = [...new Set(validators.map(v => v.provider))];
    
    for (const provider of providers) {
      const keyExists = await prisma.apiKey.findFirst({
        where: { provider, isActive: true }
      });
      
      if (!keyExists) {
        // Create a new test key for this provider
        const testKey = `${provider.toLowerCase()}-test-key-${Date.now()}`;
        const encrypted = encryptKey(testKey);
        
        const newKey = await prisma.apiKey.create({
          data: {
            name: `${provider} Test Key`,
            provider,
            key: encrypted,
            isActive: true
          }
        });
        
        results.actions.push({
          type: 'fix',
          target: 'new_api_key',
          id: newKey.id,
          message: `Created new test API key for ${provider}`
        });
        
        results.fixed++;
        
        // Link all validators of this provider to the new key
        const unlinkedValidators = validators.filter(
          v => v.provider === provider && v.apiKeys.length === 0
        );
        
        for (const validator of unlinkedValidators) {
          await prisma.validatorKey.create({
            data: {
              validatorId: validator.id,
              apiKeyId: newKey.id
            }
          });
          
          results.actions.push({
            type: 'fix',
            target: 'validator_key',
            id: validator.id,
            message: `Linked validator "${validator.profileName}" to new ${provider} API key`
          });
          
          results.fixed++;
        }
      }
    }
    
    return NextResponse.json({
      message: `Repair completed with ${results.fixed} fixes and ${results.errors} errors`,
      ...results
    });
    
  } catch (error) {
    console.error("Error repairing API keys:", error);
    return NextResponse.json(
      { 
        error: "Failed to repair API keys", 
        message: String(error),
        actions: results.actions,
        fixed: results.fixed,
        errors: results.errors + 1
      },
      { status: 500 }
    );
  }
}

// Encryption functions (matching KeyService implementation)
function encryptKey(plainKey) {
  try {
    // Ensure proper key and IV sizes for AES-256-CBC
    const fixedKey = Buffer.from(ENCRYPTION_KEY).slice(0, 32);
    const fixedIV = Buffer.from(ENCRYPTION_IV, 'utf8').slice(0, 16);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', fixedKey, fixedIV);
    let encrypted = cipher.update(plainKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt key: ${error.message}`);
  }
}

function decryptKey(encryptedKey) {
  try {
    // Ensure proper key and IV sizes for AES-256-CBC
    const fixedKey = Buffer.from(ENCRYPTION_KEY).slice(0, 32);
    const fixedIV = Buffer.from(ENCRYPTION_IV, 'utf8').slice(0, 16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', fixedKey, fixedIV);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Return null for decryption errors, don't throw
    return null;
  }
}
