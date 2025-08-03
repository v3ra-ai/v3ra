const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function checkAndFixDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✓ Connected to database');
    
    // Check if ai_models table exists
    console.log('\nChecking if ai_models table exists...');
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ai_models'
        );
      `;
      
      const tableExists = result[0]?.exists;
      
      if (tableExists) {
        console.log('✓ ai_models table exists');
        
        // Check row count
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ai_models`;
        console.log(`  - Found ${count[0].count} rows in ai_models table`);
        
        // Check if get_blind_test_pair function exists
        const functionResult = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = 'get_blind_test_pair'
          );
        `;
        
        if (functionResult[0]?.exists) {
          console.log('✓ get_blind_test_pair function exists');
          
          // Test the function
          try {
            const testResult = await prisma.$queryRaw`SELECT * FROM get_blind_test_pair('SMART')`;
            console.log('✓ get_blind_test_pair function works');
          } catch (err) {
            console.log('✗ get_blind_test_pair function failed:', err.message);
          }
        } else {
          console.log('✗ get_blind_test_pair function does not exist');
        }
      } else {
        console.log('✗ ai_models table does not exist');
        console.log('\nTo fix this, run the following SQL in Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/rccfhomdmfbcywrlvgly/sql/new');
        console.log('\nCopy and paste the contents of:');
        console.log(path.join(__dirname, '../supabase/migrations/20250131_create_ai_models_table.sql'));
      }
    } catch (error) {
      console.error('Error checking ai_models table:', error.message);
    }
    
    // Check RLS policies
    console.log('\nChecking RLS policies...');
    try {
      const rlsResult = await prisma.$queryRaw`
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'ai_models' 
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `;
      
      if (rlsResult[0]?.relrowsecurity) {
        console.log('✓ RLS is enabled on ai_models table');
        
        // Check policies
        const policies = await prisma.$queryRaw`
          SELECT polname, polcmd 
          FROM pg_policy 
          WHERE polrelid = (
            SELECT oid FROM pg_class 
            WHERE relname = 'ai_models' 
            AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          );
        `;
        
        console.log(`  - Found ${policies.length} RLS policies`);
        policies.forEach(p => console.log(`    • ${p.polname}`));
      } else {
        console.log('✗ RLS is not enabled on ai_models table');
      }
    } catch (error) {
      console.error('Error checking RLS:', error.message);
    }
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.log('\nMake sure your DATABASE_URL is set correctly:');
    console.log('DATABASE_URL=postgresql://postgres:[PASSWORD]@db.rccfhomdmfbcywrlvgly.supabase.co:5432/postgres');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkAndFixDatabase();