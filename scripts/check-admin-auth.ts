import { createSupabaseServerClient } from '../lib/supabase-client';
import { ADMIN_EMAILS } from '../lib/constants';

async function checkAdminAuth() {
  console.log('🔐 Checking Admin Authentication Configuration\n');

  // Check ADMIN_EMAILS configuration
  console.log('1. ADMIN_EMAILS Configuration:');
  if (ADMIN_EMAILS.length === 0) {
    console.log('   ❌ No admin emails configured!');
    console.log('   Add ADMIN_EMAILS to your .env file:');
    console.log('   ADMIN_EMAILS=your-email@example.com,other-admin@example.com\n');
  } else {
    console.log('   ✅ Admin emails configured:');
    ADMIN_EMAILS.forEach(email => console.log(`      - ${email}`));
    console.log('');
  }

  // Check current user
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    console.log('2. Current User Status:');
    if (error) {
      console.log('   ❌ Error getting user:', error.message);
    } else if (!user) {
      console.log('   ⚠️  No user logged in');
      console.log('   Visit http://localhost:3000/login to authenticate');
    } else {
      console.log('   ✅ Logged in as:', user.email);
      
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        console.log('   ✅ User has admin access');
      } else {
        console.log('   ❌ User does NOT have admin access');
        console.log('   Add this email to ADMIN_EMAILS in .env file');
      }
    }
  } catch (error) {
    console.log('   ❌ Error checking authentication:', error);
  }

  console.log('\n3. Next Steps:');
  console.log('   1. Add your email to ADMIN_EMAILS in .env file');
  console.log('   2. Restart the development server');
  console.log('   3. Visit http://localhost:3000/admin/llm-health');
}

checkAdminAuth();