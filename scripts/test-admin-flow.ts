#!/usr/bin/env ts-node
/**
 * Test script to verify admin authentication flow
 * Usage: npm run ts-node scripts/test-admin-flow.ts
 */

const { config } = require('dotenv');
config();

console.log('Testing Admin Authentication Flow');
console.log('==================================\n');

// Check environment variables
console.log('1. Environment Variables Check:');
console.log('-------------------------------');

const adminEmails = process.env.ADMIN_EMAILS;
console.log('ADMIN_EMAILS configured:', adminEmails ? 'YES' : 'NO');
if (adminEmails) {
  const emails = adminEmails.split(',').map(e => e.trim());
  console.log('Admin emails:', emails);
  console.log('Total admin users:', emails.length);
}

const betaEmails = process.env.BETA_LIST_EMAILS;
console.log('\nBETA_LIST_EMAILS configured:', betaEmails ? 'YES' : 'NO');
if (betaEmails) {
  const emails = betaEmails.split(',').map(e => e.trim());
  console.log('Beta emails count:', emails.length);
}

console.log('\n2. Admin Flow Summary:');
console.log('---------------------');
console.log('1. User visits /admin');
console.log('2. Middleware allows admin routes (no beta check)');
console.log('3. Admin layout checks authentication');
console.log('4. If not logged in → redirect to /login with returnTo=/admin');
console.log('5. After login → auth callback checks returnTo');
console.log('6. Redirect back to /admin');
console.log('7. Admin layout verifies user email is in ADMIN_EMAILS');
console.log('8. If authorized → show admin dashboard');
console.log('9. If not authorized → redirect to home with error');

console.log('\n3. Debugging Tips:');
console.log('-----------------');
console.log('- Check browser console for [AdminLayout] logs');
console.log('- Verify your email is in ADMIN_EMAILS env var');
console.log('- Check localStorage for "authReturnTo" key');
console.log('- Monitor network tab for redirect chains');

console.log('\n4. Common Issues:');
console.log('----------------');
console.log('- ADMIN_EMAILS not set in .env file');
console.log('- Email case sensitivity (emails are trimmed but case-sensitive)');
console.log('- Browser blocking cookies or localStorage');
console.log('- Cached authentication state');

console.log('\nDone!');