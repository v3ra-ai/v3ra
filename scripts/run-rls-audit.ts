#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AuditSection {
  title: string;
  query: string;
}

const auditSections: AuditSection[] = [
  {
    title: 'CURRENT RLS STATUS',
    query: `
      SELECT 
        schemaname,
        tablename,
        CASE 
          WHEN rowsecurity THEN '✅ ENABLED'
          ELSE '❌ DISABLED'
        END as rls_status,
        tableowner
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `
  },
  {
    title: 'EXISTING RLS POLICIES',
    query: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `
  },
  {
    title: 'TABLES WITH USER-RELATED COLUMNS',
    query: `
      SELECT DISTINCT
        t.table_name,
        array_agg(DISTINCT c.column_name) FILTER (WHERE c.column_name IN ('user_id', 'owner_id', 'created_by', 'userId', 'walletPublicKey')) as user_columns,
        array_agg(DISTINCT c.column_name) FILTER (WHERE c.column_name LIKE '%credit%' OR c.column_name LIKE '%Credit%') as credit_columns
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
      HAVING 
        array_agg(DISTINCT c.column_name) FILTER (WHERE c.column_name IN ('user_id', 'owner_id', 'created_by', 'userId', 'walletPublicKey')) IS NOT NULL
        OR array_agg(DISTINCT c.column_name) FILTER (WHERE c.column_name LIKE '%credit%' OR c.column_name LIKE '%Credit%') IS NOT NULL
      ORDER BY t.table_name;
    `
  },
  {
    title: 'INDEXES ON USER-RELATED COLUMNS',
    query: `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (
          indexdef LIKE '%user_id%'
          OR indexdef LIKE '%userId%'
          OR indexdef LIKE '%owner_id%'
          OR indexdef LIKE '%created_by%'
          OR indexdef LIKE '%walletPublicKey%'
        )
      ORDER BY tablename, indexname;
    `
  },
  {
    title: 'TABLE SIZES AND ROW COUNTS',
    query: `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        n_live_tup as approximate_row_count,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `
  },
  {
    title: 'CRITICAL TABLES RISK ASSESSMENT',
    query: `
      WITH critical_tables AS (
        SELECT 
          table_name,
          CASE 
            WHEN table_name IN ('User', 'UserCredit') THEN 'CRITICAL'
            WHEN table_name IN ('PaymentLog') THEN 'HIGH'
            WHEN table_name IN ('Validator', 'ValidatorKey', 'VoteSession', 'ValidatorResponse') THEN 'MEDIUM'
            ELSE 'LOW'
          END as risk_level,
          CASE 
            WHEN table_name = 'User' THEN 'Contains freeCredits - MUST use security definer'
            WHEN table_name = 'UserCredit' THEN 'Financial data - strict access control'
            WHEN table_name IN ('Validator', 'ValidatorKey') THEN 'Recently cached - verify invalidation'
            WHEN table_name = 'PaymentLog' THEN 'Payment history - user isolation required'
            WHEN table_name = 'VoteSession' THEN 'User queries - data isolation needed'
            ELSE 'Standard RLS policies'
          END as notes
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
      )
      SELECT * FROM critical_tables
      ORDER BY 
        CASE risk_level
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          ELSE 4
        END,
        table_name;
    `
  }
];

async function runAudit() {
  console.log('🔍 Running RLS Security Audit\n');
  console.log('=' .repeat(80));
  console.log(`Database: ${supabaseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('=' .repeat(80) + '\n');

  const results: any[] = [];

  for (const section of auditSections) {
    console.log(`\n📋 ${section.title}`);
    console.log('-'.repeat(section.title.length + 3));

    try {
      // Execute raw SQL query
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: section.query
      }).single();

      if (error) {
        // Try direct query if exec_sql doesn't exist
        console.log('⚠️  exec_sql function not found, skipping section');
        results.push({
          section: section.title,
          error: 'exec_sql function not available',
          note: 'Run the query manually in Supabase SQL editor'
        });
        continue;
      }

      if (data && Array.isArray(data)) {
        console.log(`Found ${data.length} results\n`);
        
        // Pretty print results
        data.forEach((row: any) => {
          Object.entries(row).forEach(([key, value]) => {
            if (value !== null) {
              console.log(`  ${key}: ${value}`);
            }
          });
          console.log('');
        });

        results.push({
          section: section.title,
          data: data,
          count: data.length
        });
      }
    } catch (err) {
      console.error(`❌ Error: ${err}`);
      results.push({
        section: section.title,
        error: String(err)
      });
    }
  }

  // Save results to file
  const reportPath = path.join(process.cwd(), 'rls-audit-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    database: supabaseUrl,
    results: results
  }, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('✅ Audit complete! Results saved to: rls-audit-results.json');
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('1. If exec_sql is not available, run the queries manually in Supabase SQL editor');
  console.log('2. Save the SQL queries from scripts/rls-audit.sql');
  console.log('3. Review all results before proceeding with RLS implementation');
  console.log('4. Ensure you have a complete database backup');
}

// Add alternative method using Prisma raw queries
async function runAuditViaPrisma() {
  console.log('\n📊 Alternative: Running audit via Prisma (if Supabase RPC fails)\n');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Get basic table information
    const tables = await prisma.$queryRaw`
      SELECT 
        tablename,
        CASE 
          WHEN rowsecurity THEN 'ENABLED'
          ELSE 'DISABLED'
        END as rls_status
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log('Tables and RLS Status:');
    console.log(tables);

    await prisma.$disconnect();
  } catch (err) {
    console.log('Prisma method also failed:', err);
  }
}

// Run the audit
runAudit()
  .then(() => runAuditViaPrisma())
  .catch(console.error);
