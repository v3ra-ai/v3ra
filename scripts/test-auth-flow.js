const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  console.log('🔍 Testing Authentication Flow\n');

  // Test 1: Check current session
  console.log('1️⃣ Checking current session:');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.log('❌ Session error:', sessionError.message);
  } else if (session) {
    console.log('✅ Active session found');
    console.log('   User:', session.user.email);
    console.log('   ID:', session.user.id);
  } else {
    console.log('ℹ️  No active session');
  }

  // Test 2: Check auth configuration
  console.log('\n2️⃣ Checking auth configuration:');
  try {
    // Try to get auth settings
    const { data, error } = await supabase.auth.getUser();
    
    if (error && error.message.includes('not authenticated')) {
      console.log('✅ Auth endpoint is reachable (no user logged in)');
    } else if (data?.user) {
      console.log('✅ Auth endpoint is reachable (user logged in)');
    } else {
      console.log('⚠️  Unexpected auth response');
    }
  } catch (error) {
    console.log('❌ Auth endpoint error:', error.message);
  }

  // Test 3: Check if email auth is enabled
  console.log('\n3️⃣ Testing sign up capability:');
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      if (error.message.includes('Email signups are disabled')) {
        console.log('❌ Email signups are disabled in Supabase');
        console.log('   Fix: Go to Supabase Dashboard > Authentication > Settings');
        console.log('   Enable "Email" under Authentication providers');
      } else if (error.message.includes('not authorized')) {
        console.log('❌ Email provider not configured properly');
      } else {
        console.log('❌ Sign up error:', error.message);
      }
    } else if (data?.user) {
      console.log('✅ Sign up capability is working');
      console.log('   Note: Test user created, check email confirmations settings');
      
      // Clean up - try to delete the test user
      if (data.session) {
        await supabase.auth.signOut();
      }
    }
  } catch (error) {
    console.log('❌ Sign up test failed:', error.message);
  }

  // Test 4: Check database connection
  console.log('\n4️⃣ Checking database connection:');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    
    const userCount = await prisma.user.count();
    console.log(`   Found ${userCount} users in database`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }

  console.log('\n✨ Auth flow test complete!');
  console.log('\n📋 Next steps:');
  console.log('1. If email signups are disabled, enable them in Supabase Dashboard');
  console.log('2. Check email confirmation settings (can disable for testing)');
  console.log('3. Make sure SMTP settings are configured if email confirmations are enabled');
}

testAuthFlow().catch(console.error);