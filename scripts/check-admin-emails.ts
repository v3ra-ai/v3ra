// Simple script to check ADMIN_EMAILS configuration
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('🔐 Admin Email Configuration Check\n');

const adminEmails = process.env.ADMIN_EMAILS;

if (!adminEmails) {
  console.log('❌ ADMIN_EMAILS is not configured in .env file\n');
  console.log('To fix this, add the following to your .env file:');
  console.log('ADMIN_EMAILS=your-email@example.com\n');
  console.log('Or for multiple admins:');
  console.log('ADMIN_EMAILS=admin1@example.com,admin2@example.com\n');
} else {
  const emails = adminEmails.split(',').map(email => email.trim());
  console.log('✅ ADMIN_EMAILS is configured with:');
  emails.forEach(email => console.log(`   - ${email}`));
  console.log('\nMake sure you are logged in with one of these emails to access admin pages.');
}

console.log('\nAfter updating .env:');
console.log('1. Restart your development server (Ctrl+C and npm run dev)');
console.log('2. Log in with an admin email');
console.log('3. Visit http://localhost:3000/admin/llm-health');