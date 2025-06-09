#!/usr/bin/env ts-node
/**
 * Quick RLS Status Check
 * Checks which tables have RLS enabled using Prisma
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkRLSStatus() {
  console.log('🔍 Checking RLS Status...\n');

  try {
    // Check if RLS is enabled on tables
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        tablename,
        rowsecurity,
        (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN (
          'User', 'UserCredit', 'PaymentLog', 'Validator', 
          'ValidatorKey', 'ApiKey', 'VoteSession', 'Feedback', 
          'Thread', 'Reply', 'GraphEdge', 'ValidatorResponse'
        )
      ORDER BY 
        CASE 
          WHEN tablename IN ('User', 'UserCredit', 'PaymentLog') THEN 1
          ELSE 2
        END,
        tablename;
    `;

    console.log('📊 RLS Status by Table:');
    console.log('========================\n');
    
    let enabledCount = 0;
    let criticalTablesProtected = 0;
    const criticalTables = ['User', 'UserCredit', 'PaymentLog'];
    
    result.forEach((row: any) => {
      const isCritical = criticalTables.includes(row.tablename);
      const status = row.rowsecurity ? '✅ Enabled' : '❌ Disabled';
      const marker = isCritical ? '🔴' : '⚪';
      
      console.log(`${marker} ${row.tablename.padEnd(20)} ${status} (${row.policy_count} policies)`);
      
      if (row.rowsecurity) {
        enabledCount++;
        if (isCritical) criticalTablesProtected++;
      }
    });

    console.log('\n📈 Summary:');
    console.log(`Total tables checked: ${result.length}`);
    console.log(`RLS enabled: ${enabledCount}/${result.length}`);
    console.log(`Critical tables protected: ${criticalTablesProtected}/3`);

    // Check if security schema exists
    const securitySchema = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'security'
      ) as exists;
    `;

    console.log(`\n🔐 Security schema: ${securitySchema[0].exists ? '✅ Exists' : '❌ Missing'}`);

    // Check if audit log table exists
    const auditTable = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'security' 
        AND table_name = 'audit_log'
      ) as exists;
    `;

    console.log(`📝 Audit log table: ${auditTable[0].exists ? '✅ Exists' : '❌ Missing'}`);

    // Check for secure credit functions
    const creditFunctions = await prisma.$queryRaw<any[]>`
      SELECT 
        routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'security'
        AND routine_name IN ('decrement_free_credits', 'reset_free_credits', 'add_free_credits');
    `;

    console.log(`\n💳 Secure credit functions: ${creditFunctions.length}/3 found`);
    if (creditFunctions.length > 0) {
      creditFunctions.forEach((fn: any) => {
        console.log(`  ✅ ${fn.routine_name}`);
      });
    }

    // Determine next steps
    console.log('\n📋 Next Steps:');
    if (!securitySchema[0].exists) {
      console.log('1. Apply Phase 1 migration (security infrastructure)');
    }
    if (enabledCount < 4) {
      console.log('2. Apply Phase 2 migration (low-risk tables)');
    }
    if (criticalTablesProtected < 3) {
      console.log('3. Apply Phase 3 migration (critical tables)');
    }
    if (criticalTablesProtected === 3) {
      console.log('✅ All critical tables are protected!');
    }

  } catch (error) {
    console.error('❌ Error checking RLS status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRLSStatus();
