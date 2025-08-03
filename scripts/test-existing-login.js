const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testExistingLogin() {
  console.log('🔍 Testing Login with Existing Account\n');

  // You'll need to replace these with your actual credentials
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log('Usage: node scripts/test-existing-login.js <email> <password>');
    console.log('Example: node scripts/test-existing-login.js user@example.com mypassword');
    return;
  }

  console.log('1️⃣ Testing sign in:');
  console.log(`   Email: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('❌ Sign in failed:', error.message);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n   Possible issues:');
        console.log('   1. Wrong password');
        console.log('   2. Account doesn\'t exist in this Supabase project');
        console.log('   3. Account exists but email not confirmed');
      } else if (error.message.includes('Email not confirmed')) {
        console.log('\n   ⚠️  Your email is not confirmed');
        console.log('   → Check your email for confirmation link');
        console.log('   → Or ask admin to manually confirm in Supabase Dashboard');
      }
    } else if (data?.user) {
      console.log('✅ Sign in successful!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Confirmed:', data.user.confirmed_at ? 'Yes' : 'No');
      console.log('   Session:', data.session ? 'Active' : 'None');
      
      // Check if user exists in our database
      console.log('\n2️⃣ Checking database record:');
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: data.user.id },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            UserPoints: {
              select: {
                balance: true,
                totalEarned: true
              }
            }
          }
        });
        
        if (dbUser) {
          console.log('✅ User exists in database');
          console.log('   Name:', dbUser.name);
          console.log('   Created:', dbUser.createdAt.toISOString());
          if (dbUser.UserPoints) {
            console.log('   Points Balance:', dbUser.UserPoints.balance.toString());
          }
        } else {
          console.log('⚠️  User not found in database');
          console.log('   → Will be created on first login through the app');
        }
        
        await prisma.$disconnect();
      } catch (error) {
        console.log('❌ Database check failed:', error.message);
      }
      
      // Sign out for cleanup
      await supabase.auth.signOut();
      console.log('\n   → Signed out successfully');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }

  console.log('\n3️⃣ Next steps:');
  console.log('   If login works here but not in the app:');
  console.log('   1. Check browser console for errors');
  console.log('   2. Clear browser cookies/cache');
  console.log('   3. Check if CSRF token is being set');
  console.log('   4. Verify all environment variables match');
}

testExistingLogin().catch(console.error);