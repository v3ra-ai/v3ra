import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testVoteSubmission() {
  console.log('🔍 Testing Vote Submission Flow\n');

  // Test 1: Check if user is authenticated
  console.log('1️⃣ Checking authentication:');
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.log('❌ No authenticated user');
    console.log('Please login first at http://localhost:3001/login');
    return;
  }

  console.log('✅ Authenticated as:', user.email);
  console.log('   User ID:', user.id);

  // Test 2: Check CSRF token endpoint
  console.log('\n2️⃣ Testing CSRF token:');
  try {
    const response = await fetch('http://localhost:3001/api/csrf-token', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.log('❌ CSRF token fetch failed:', response.status);
      const error = await response.text();
      console.log('   Error:', error);
    } else {
      const data = await response.json();
      console.log('✅ CSRF token obtained:', data.csrfToken ? 'Present' : 'Missing');
    }
  } catch (error) {
    console.log('❌ CSRF token error:', error);
  }

  // Test 3: Check if submit_vote_with_reward function exists
  console.log('\n3️⃣ Checking database function:');
  const { data: funcCheck, error: funcError } = await supabase
    .rpc('submit_vote_with_reward', {
      p_vote_session_id: 'test-id',
      p_user_id: user.id,
      p_winning_validator_id: 'test-winner',
      p_losing_validator_id: 'test-loser',
      p_vote_reason: 'accuracy',
      p_vote_strength: 3,
      p_time_to_decide: 5
    });

  if (funcError) {
    if (funcError.message.includes('does not exist')) {
      console.log('❌ submit_vote_with_reward function missing');
      console.log('   Run database migrations to create it');
    } else if (funcError.message.includes('not found')) {
      console.log('⚠️  Function exists but vote session not found (expected)');
    } else {
      console.log('❌ Function error:', funcError.message);
    }
  } else {
    console.log('✅ Function exists and callable');
  }

  // Test 4: Check user points
  console.log('\n4️⃣ Checking user points:');
  const { data: points, error: pointsError } = await supabase
    .from('UserPoints')
    .select('*')
    .eq('userId', user.id)
    .single();

  if (pointsError) {
    console.log('❌ User points not found');
  } else {
    console.log('✅ User points found:');
    console.log('   Balance:', points.balance);
    console.log('   Total Earned:', points.totalEarned);
  }

  console.log('\n✨ Test complete!');
  console.log('\nIf authentication works here but not in the browser:');
  console.log('1. Clear browser cookies/cache');
  console.log('2. Login again at http://localhost:3001/login');
  console.log('3. Make sure cookies are not blocked');
}

testVoteSubmission().catch(console.error);