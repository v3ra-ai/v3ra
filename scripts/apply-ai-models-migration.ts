#!/usr/bin/env node
/**
 * Apply the ai_models table migration directly to the production database
 * This fixes the issue where the migration exists in Supabase but not in Prisma
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  console.error('Please set these in your .env file or Vercel environment');
  process.exit(1);
}

// Create Supabase client with service key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function applyMigration() {
  console.log('Checking if ai_models table exists...');
  
  // Check if table exists
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'ai_models');

  if (tableError) {
    console.error('Error checking for table:', tableError);
    return;
  }

  if (tables && tables.length > 0) {
    console.log('ai_models table already exists');
    
    // Check if it has data
    const { count, error: countError } = await supabase
      .from('ai_models')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting rows:', countError);
    } else {
      console.log(`Table has ${count} rows`);
    }
    
    return;
  }

  console.log('ai_models table does not exist, applying migration...');
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250131_create_ai_models_table.sql');
  let migrationSQL: string;
  
  try {
    migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  } catch (err) {
    console.error('Error reading migration file:', err);
    console.error('Make sure the file exists at:', migrationPath);
    return;
  }

  // Execute the migration using the Supabase SQL editor endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({
      query: migrationSQL
    })
  });

  if (!response.ok) {
    console.error('Failed to execute migration:', await response.text());
    console.log('\nAlternative: Run this SQL directly in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/rccfhomdmfbcywrlvgly/sql/new');
    return;
  }

  console.log('Migration applied successfully!');
  
  // Verify the table was created
  const { count } = await supabase
    .from('ai_models')
    .select('*', { count: 'exact', head: true });
  
  console.log(`ai_models table created with ${count} initial rows`);
}

// Run the migration
applyMigration().catch(console.error);