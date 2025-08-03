/**
 * Update Gemini model IDs to correct OpenRouter format
 * Run with: npx tsx scripts/update-gemini-models.ts
 */

import 'dotenv/config';
import { prisma } from '../lib/db/client';

async function updateGeminiModels() {
  console.log('Updating Gemini model IDs...\n');
  
  try {
    // Update Gemini Pro to Gemini 2.5 Pro
    await prisma.$executeRaw`
      UPDATE ai_models 
      SET model_path = 'google/gemini-2.5-pro',
          name = 'Gemini 2.5 Pro'
      WHERE model_path = 'google/gemini-pro';
    `;
    console.log('✅ Updated Gemini Pro to Gemini 2.5 Pro');
    
    // Update Gemini Pro 1.5 to Gemini 2.5 Flash  
    await prisma.$executeRaw`
      UPDATE ai_models 
      SET model_path = 'google/gemini-2.5-flash',
          name = 'Gemini 2.5 Flash'
      WHERE model_path = 'google/gemini-pro-1.5';
    `;
    console.log('✅ Updated Gemini Pro 1.5 to Gemini 2.5 Flash');
    
    // Clear the model registry cache
    const { prismaModelRegistry } = await import('../lib/services/prisma-model-registry');
    prismaModelRegistry.clearCache();
    console.log('✅ Cleared model registry cache');
    
    console.log('\n✅ All Gemini models updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating models:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGeminiModels();