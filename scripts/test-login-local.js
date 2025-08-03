const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔍 Testing Login Functionality\n');

  // Use a real test email
  const testEmail = 'test@v3ra.ai';
  const testPassword = 'TestPassword123!';

  // Test 1: Try to sign in with test credentials
  console.log('1️⃣ Testing sign in:');
  console.log(`   Email: ${testEmail}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.log('❌ Sign in failed:', error.message);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('   → User doesn\'t exist or wrong password');
        
        // Try to create the user
        console.log('\n2️⃣ Attempting to create test user:');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            data: {
              username: 'testuser'
            }
          }
        });

        if (signUpError) {
          console.log('❌ Sign up failed:', signUpError.message);
          
          if (signUpError.message.includes('Email rate limit exceeded')) {
            console.log('   → Too many sign up attempts. Wait a few minutes.');
          } else if (signUpError.message.includes('Email signups are disabled')) {
            console.log('   → Email signups are disabled in Supabase Dashboard');
            console.log('   → Go to: Authentication > Providers > Email');
          }
        } else if (signUpData?.user) {
          console.log('✅ Test user created successfully!');
          console.log('   User ID:', signUpData.user.id);
          console.log('   Email:', signUpData.user.email);
          
          if (signUpData.user.confirmed_at) {
            console.log('   ✅ Email confirmed automatically');
          } else {
            console.log('   ⚠️  Email confirmation required');
            console.log('   → Check your email or disable confirmation in Supabase');
          }
        }
      }
    } else if (data?.user) {
      console.log('✅ Sign in successful!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Session:', data.session ? 'Active' : 'None');
      
      // Sign out for cleanup
      await supabase.auth.signOut();
      console.log('   → Signed out successfully');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }

  // Test 3: Check Supabase auth settings
  console.log('\n3️⃣ Auth Configuration Tips:');
  console.log('   1. Go to Supabase Dashboard > Authentication > Providers');
  console.log('   2. Ensure "Email" is enabled');
  console.log('   3. Under "Email Auth" settings, you can:');
  console.log('      - Disable "Confirm email" for easier testing');
  console.log('      - Enable "Secure email change" for production');
  console.log('   4. Check rate limits under "Settings"');
  
  console.log('\n4️⃣ Testing database user creation:');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Check if we have any test users
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'test'
        }
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });
    
    console.log(`   Found ${testUsers.length} test users`);
    testUsers.forEach(user => {
      console.log(`   - ${user.email} (created: ${user.createdAt.toISOString()})`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database query failed:', error.message);
  }

  console.log('\n✨ Login test complete!');
}

testLogin().catch(console.error);