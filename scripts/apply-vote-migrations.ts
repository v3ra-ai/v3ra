import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  try {
    console.log('Applying vote submission migrations...');

    // Read migration files
    const migrations = [
      '20250131_create_vote_submission_function.sql',
      '20250131_create_model_matchup_functions.sql'
    ];

    for (const migration of migrations) {
      console.log(`\nApplying ${migration}...`);
      
      const sql = readFileSync(
        join(__dirname, '..', 'supabase', 'migrations', migration),
        'utf-8'
      );

      const { error } = await supabase.rpc('exec_sql', {
        sql_query: sql
      });

      if (error) {
        // If exec_sql doesn't exist, try direct query
        const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
        
        if (directError) {
          console.error(`Error checking migrations table:`, directError);
          console.log('\nPlease run these migrations manually in your Supabase SQL editor:');
          console.log(`\n--- ${migration} ---`);
          console.log(sql);
          console.log('\n---\n');
        } else {
          console.log(`Migration ${migration} needs to be applied manually in Supabase SQL editor.`);
        }
      } else {
        console.log(`✓ ${migration} applied successfully`);
      }
    }

    console.log('\nMigrations completed!');
    console.log('\nNote: If any migrations failed, please apply them manually in your Supabase dashboard SQL editor.');

  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

applyMigrations();