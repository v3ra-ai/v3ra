/**
 * Script to set up database functions for AI models
 * Run with: npx tsx scripts/setup-model-functions.ts
 */

import { prisma } from '../lib/db/client';

async function setupModelFunctions() {
  console.log('Setting up database functions...');
  
  try {
    // Create the get_blind_test_pair function
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION get_blind_test_pair(
        p_strategy TEXT DEFAULT 'SMART'
      )
      RETURNS TABLE(
        model1 JSONB,
        model2 JSONB
      ) AS $$
      BEGIN
        -- Implementation varies based on strategy
        -- For now, return random pair
        RETURN QUERY
        WITH random_models AS (
          SELECT 
            jsonb_build_object(
              'id', id::text,
              'model_path', model_path,
              'name', name,
              'provider', provider,
              'category', category,
              'is_active', is_active
            ) as model_data
          FROM ai_models
          WHERE is_active = true
          ORDER BY RANDOM()
          LIMIT 2
        )
        SELECT 
          (array_agg(model_data))[1] as model1,
          (array_agg(model_data))[2] as model2
        FROM random_models;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    console.log('Function get_blind_test_pair created successfully');
    
    // Create indexes if they don't exist
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_ai_models_active ON ai_models(is_active);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON ai_models(provider);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_ai_models_category ON ai_models(category);
    `;
    
    console.log('Indexes created successfully');
    
    // Create the update trigger for updated_at
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    
    await prisma.$executeRaw`
      CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE
          ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    console.log('Triggers created successfully');
    
    // Create a view for active models
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW active_ai_models AS
      SELECT 
        id,
        model_path,
        name,
        provider,
        category,
        capabilities,
        strengths,
        cost_per_comparison,
        icon
      FROM ai_models
      WHERE is_active = true
      ORDER BY provider, name;
    `;
    
    console.log('View created successfully');
    
    console.log('All database functions set up successfully!');
    
  } catch (error) {
    console.error('Error setting up functions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupModelFunctions();