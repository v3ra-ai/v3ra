import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !openRouterApiKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type: string | null;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number | null;
    is_moderated: boolean;
  };
  per_request_limits: {
    prompt_tokens: string;
    completion_tokens: string;
  } | null;
}

async function fetchOpenRouterModels() {
  try {
    console.log('Fetching models from OpenRouter API...');
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://v3ra.app',
        'X-Title': 'V3RA Model Sync'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data as OpenRouterModel[];
  } catch (error) {
    console.error('Error fetching models from OpenRouter:', error);
    throw error;
  }
}

async function syncModels() {
  try {
    // Fetch current models from OpenRouter
    const openRouterModels = await fetchOpenRouterModels();
    console.log(`Found ${openRouterModels.length} models on OpenRouter`);

    // Get existing models from database
    const { data: existingModels, error: fetchError } = await supabase
      .from('ai_models')
      .select('model_path, is_active');

    if (fetchError) {
      console.error('Error fetching existing models:', fetchError);
      return;
    }

    const existingModelPaths = new Set(existingModels?.map(m => m.model_path) || []);
    
    // Categorize models
    const categorizeModel = (model: OpenRouterModel): string => {
      const name = model.name.toLowerCase();
      const id = model.id.toLowerCase();
      
      if (id.includes('gpt-4') || id.includes('claude-3-opus')) return 'premium';
      if (id.includes('gpt-3.5') || id.includes('claude-3-sonnet') || id.includes('claude-3-haiku')) return 'standard';
      if (id.includes('llama') || id.includes('mistral') || id.includes('mixtral')) return 'open-source';
      if (id.includes('gemini')) return 'google';
      if (id.includes('command')) return 'cohere';
      if (id.includes('perplexity') || id.includes('sonar')) return 'specialist';
      return 'other';
    };

    // Extract provider from model ID
    const getProvider = (modelId: string): string => {
      const [provider] = modelId.split('/');
      return provider.charAt(0).toUpperCase() + provider.slice(1);
    };

    // Update or insert models
    for (const model of openRouterModels) {
      const isNewModel = !existingModelPaths.has(model.id);
      
      const modelData = {
        model_path: model.id,
        name: model.name,
        provider: getProvider(model.id),
        category: categorizeModel(model),
        context_length: model.context_length,
        max_tokens: model.top_provider.max_completion_tokens,
        is_active: true,
        is_available: true,
        updated_at: new Date().toISOString()
      };

      if (isNewModel) {
        console.log(`Adding new model: ${model.id}`);
        const { error } = await supabase
          .from('ai_models')
          .insert(modelData);
        
        if (error) {
          console.error(`Error inserting ${model.id}:`, error);
        }
      } else {
        // Update existing model to ensure it's available
        console.log(`Updating existing model: ${model.id}`);
        const { error } = await supabase
          .from('ai_models')
          .update({
            name: model.name,
            is_available: true,
            context_length: model.context_length,
            max_tokens: model.top_provider.max_completion_tokens,
            updated_at: new Date().toISOString()
          })
          .eq('model_path', model.id);
        
        if (error) {
          console.error(`Error updating ${model.id}:`, error);
        }
      }
    }

    // Mark models not in OpenRouter as unavailable
    const openRouterModelIds = new Set(openRouterModels.map(m => m.id));
    const modelsToDisable = existingModels?.filter(m => !openRouterModelIds.has(m.model_path)) || [];
    
    for (const model of modelsToDisable) {
      console.log(`Marking as unavailable: ${model.model_path}`);
      const { error } = await supabase
        .from('ai_models')
        .update({ 
          is_available: false,
          updated_at: new Date().toISOString()
        })
        .eq('model_path', model.model_path);
      
      if (error) {
        console.error(`Error disabling ${model.model_path}:`, error);
      }
    }

    console.log('\nSync completed successfully!');
    console.log(`- Added/Updated: ${openRouterModels.length} models`);
    console.log(`- Marked unavailable: ${modelsToDisable.length} models`);

  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Run the sync
syncModels();