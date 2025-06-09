#!/usr/bin/env ts-node
/**
 * Update secure functions to handle text-based user IDs
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function updateSecureFunctions() {
  console.log('🔧 Updating Secure Functions for Text IDs');
  console.log('========================================\n');
  
  const functions = [
    {
      name: 'decrement_free_credits',
      sql: `
        CREATE OR REPLACE FUNCTION security.decrement_free_credits(
          p_user_id TEXT,
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
            p_user_id::uuid,
            jsonb_build_object('freeCredits', v_current_credits),
            jsonb_build_object('freeCredits', v_new_credits),
            jsonb_build_object('amount', p_amount, 'reason', p_reason)
          );
          
          RETURN v_new_credits;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'add_free_credits',
      sql: `
        CREATE OR REPLACE FUNCTION security.add_free_credits(
          p_user_id TEXT,
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
            p_user_id::uuid,
            jsonb_build_object('freeCredits', v_current_credits),
            jsonb_build_object('freeCredits', v_new_credits),
            jsonb_build_object('amount', p_amount, 'reason', p_reason)
          );
          
          RETURN v_new_credits;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'reset_free_credits',
      sql: `
        CREATE OR REPLACE FUNCTION security.reset_free_credits(
          p_user_id TEXT,
          p_new_amount INTEGER DEFAULT 10,
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
            p_user_id::uuid,
            jsonb_build_object('freeCredits', v_old_credits),
            jsonb_build_object('freeCredits', p_new_amount),
            jsonb_build_object('reason', p_reason)
          );
          
          RETURN TRUE;
        END;
        $$ LANGUAGE plpgsql;
      `
    }
  ];
  
  try {
    for (const func of functions) {
      console.log(`📝 Updating ${func.name}...`);
      await prisma.$executeRawUnsafe(func.sql);
      console.log(`   ✅ ${func.name} updated`);
    }
    
    console.log('\n✅ All functions updated to handle text-based user IDs!');
    
  } catch (error) {
    console.error('❌ Error updating functions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSecureFunctions();
