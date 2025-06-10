#!/usr/bin/env ts-node
/**
 * Safe RLS Migration Script
 * Applies migrations by executing individual SQL commands
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Split SQL file into individual commands
function splitSQLCommands(sql: string): string[] {
  // Remove comments and split by semicolons
  const cleanSQL = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  const commands: string[] = [];
  let currentCommand = '';
  let inFunction = false;
  let dollarQuoteTag = '';
  
  const lines = cleanSQL.split('\n');
  
  for (const line of lines) {
    // Check for function start/end
    if (line.includes('$$') && !inFunction) {
      inFunction = true;
      const match = line.match(/\$([^$]*)\$/);
      dollarQuoteTag = match ? match[0] : '$$';
    } else if (inFunction && line.includes(dollarQuoteTag)) {
      inFunction = false;
    }
    
    currentCommand += line + '\n';
    
    // If we're not in a function and line ends with semicolon, it's end of command
    if (!inFunction && line.trim().endsWith(';')) {
      const trimmedCommand = currentCommand.trim();
      if (trimmedCommand && trimmedCommand !== ';') {
        commands.push(trimmedCommand);
      }
      currentCommand = '';
    }
  }
  
  // Add any remaining command
  if (currentCommand.trim()) {
    commands.push(currentCommand.trim());
  }
  
  return commands;
}

async function executePhase1() {
  console.log('\n📋 Phase 1: Security Infrastructure');
  console.log('===================================');
  
  const commands = [
    // Create security schema
    `CREATE SCHEMA IF NOT EXISTS security;`,
    
    // Create audit log table
    `CREATE TABLE IF NOT EXISTS security.audit_log (
      id BIGSERIAL PRIMARY KEY,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      user_id UUID,
      old_data JSONB,
      new_data JSONB,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    
    // Create index on audit log
    `CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON security.audit_log(created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation ON security.audit_log(table_name, operation);`,
    
    // Decrement free credits function
    `CREATE OR REPLACE FUNCTION security.decrement_free_credits(
      p_user_id UUID,
      p_amount INTEGER,
      p_reason TEXT DEFAULT NULL
    ) RETURNS INTEGER
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
      v_current_credits INTEGER;
      v_new_credits INTEGER;
    BEGIN
      -- Get current credits with row lock
      SELECT "freeCredits" INTO v_current_credits
      FROM "User"
      WHERE id = p_user_id
      FOR UPDATE;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
      END IF;
      
      -- Check sufficient credits
      IF v_current_credits < p_amount THEN
        RAISE EXCEPTION 'Insufficient credits. Current: %, Required: %', v_current_credits, p_amount;
      END IF;
      
      -- Calculate new credits
      v_new_credits := v_current_credits - p_amount;
      
      -- Update credits
      UPDATE "User"
      SET "freeCredits" = v_new_credits
      WHERE id = p_user_id;
      
      -- Log the operation
      INSERT INTO security.audit_log (table_name, operation, user_id, old_data, new_data, metadata)
      VALUES (
        'User',
        'decrement_credits',
        p_user_id,
        jsonb_build_object('freeCredits', v_current_credits),
        jsonb_build_object('freeCredits', v_new_credits),
        jsonb_build_object('amount', p_amount, 'reason', p_reason)
      );
      
      RETURN v_new_credits;
    END;
    $$ LANGUAGE plpgsql;`,
    
    // Reset free credits function
    `CREATE OR REPLACE FUNCTION security.reset_free_credits(
      p_user_id UUID,
      p_new_amount INTEGER DEFAULT 100,
      p_reason TEXT DEFAULT NULL
    ) RETURNS BOOLEAN
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
      v_old_credits INTEGER;
    BEGIN
      -- Get current credits
      SELECT "freeCredits" INTO v_old_credits
      FROM "User"
      WHERE id = p_user_id;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
      END IF;
      
      -- Update credits
      UPDATE "User"
      SET "freeCredits" = p_new_amount
      WHERE id = p_user_id;
      
      -- Log the operation
      INSERT INTO security.audit_log (table_name, operation, user_id, old_data, new_data, metadata)
      VALUES (
        'User',
        'reset_credits',
        p_user_id,
        jsonb_build_object('freeCredits', v_old_credits),
        jsonb_build_object('freeCredits', p_new_amount),
        jsonb_build_object('reason', p_reason)
      );
      
      RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql;`,
    
    // Add free credits function
    `CREATE OR REPLACE FUNCTION security.add_free_credits(
      p_user_id UUID,
      p_amount INTEGER,
      p_reason TEXT DEFAULT NULL
    ) RETURNS INTEGER
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
      v_current_credits INTEGER;
      v_new_credits INTEGER;
    BEGIN
      -- Get current credits with row lock
      SELECT "freeCredits" INTO v_current_credits
      FROM "User"
      WHERE id = p_user_id
      FOR UPDATE;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
      END IF;
      
      -- Calculate new credits
      v_new_credits := v_current_credits + p_amount;
      
      -- Update credits
      UPDATE "User"
      SET "freeCredits" = v_new_credits
      WHERE id = p_user_id;
      
      -- Log the operation
      INSERT INTO security.audit_log (table_name, operation, user_id, old_data, new_data, metadata)
      VALUES (
        'User',
        'add_credits',
        p_user_id,
        jsonb_build_object('freeCredits', v_current_credits),
        jsonb_build_object('freeCredits', v_new_credits),
        jsonb_build_object('amount', p_amount, 'reason', p_reason)
      );
      
      RETURN v_new_credits;
    END;
    $$ LANGUAGE plpgsql;`
  ];
  
  let successCount = 0;
  for (const command of commands) {
    try {
      await prisma.$executeRawUnsafe(command);
      successCount++;
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`   ⏭️  Skipping (already exists)`);
        successCount++;
      } else {
        console.error(`   ❌ Error: ${error.message}`);
        throw error;
      }
    }
  }
  
  console.log(`   ✅ Phase 1 complete: ${successCount}/${commands.length} commands executed`);
}

async function executePhase2() {
  console.log('\n📋 Phase 2: Low-Risk Tables');
  console.log('===========================');
  
  const tables = ['Feedback', 'Thread', 'Reply', 'GraphEdge'];
  
  for (const table of tables) {
    console.log(`   🔄 Enabling RLS on ${table}...`);
    
    try {
      // Enable RLS
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      
      // Create basic policies
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "${table.toLowerCase()}_select_authenticated" ON "${table}"
          FOR SELECT
          USING (auth.uid() IS NOT NULL);
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "${table.toLowerCase()}_service_role" ON "${table}"
          FOR ALL
          USING (auth.jwt()->>'role' = 'service_role');
      `);
      
      console.log(`   ✅ ${table} protected`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`   ⏭️  ${table} already protected`);
      } else {
        console.error(`   ❌ Error on ${table}: ${error.message}`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Safe RLS Migration Process');
  console.log('============================');
  
  try {
    // Check initial status
    const initialStatus = await prisma.$queryRaw<any[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('User', 'UserCredit', 'PaymentLog', 'Feedback', 'Thread', 'Reply', 'GraphEdge')
      ORDER BY tablename;
    `;
    
    console.log('\n📊 Initial Status:');
    initialStatus.forEach((t: any) => {
      console.log(`   ${t.tablename}: RLS ${t.rowsecurity ? '✅' : '❌'}`);
    });
    
    // Execute Phase 1
    await executePhase1();
    
    // Execute Phase 2
    await executePhase2();
    
    // Final status check
    const finalStatus = await prisma.$queryRaw<any[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('User', 'UserCredit', 'PaymentLog', 'Feedback', 'Thread', 'Reply', 'GraphEdge')
      ORDER BY tablename;
    `;
    
    console.log('\n📊 Final Status:');
    finalStatus.forEach((t: any) => {
      console.log(`   ${t.tablename}: RLS ${t.rowsecurity ? '✅' : '❌'}`);
    });
    
    // Check secure functions
    const functions = await prisma.$queryRaw<any[]>`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'security'
        AND routine_name IN ('decrement_free_credits', 'reset_free_credits', 'add_free_credits');
    `;
    
    console.log(`\n💳 Secure credit functions: ${functions.length}/3`);
    functions.forEach((fn: any) => {
      console.log(`   ✅ ${fn.routine_name}`);
    });
    
    console.log('\n✅ Phase 1 & 2 Complete!');
    console.log('\n📋 Next: Run Phase 3 for critical tables:');
    console.log('   npx ts-node scripts/apply-rls-phase3.ts');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
