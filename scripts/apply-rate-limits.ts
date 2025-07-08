#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Map endpoints to their appropriate rate limit tier
const RATE_LIMIT_MAP = {
  // Auth endpoints - strict limits
  'auth/session': 'rateLimitAuth',
  'auth/create-user': 'rateLimitAuth',
  
  // Read operations - relaxed limits
  'validators/': 'rateLimitRelaxed',
  'vote-session/': 'rateLimitRelaxed',
  'predictions/route': 'rateLimitRelaxed',
  'predictions/metrics': 'rateLimitRelaxed',
  'leaderboard/': 'rateLimitRelaxed',
  
  // Write operations - normal limits
  'truth-market-v2': 'rateLimitNormal',
  'user/custom-llms': 'rateLimitNormal',
  'headlines/daily': 'rateLimitNormal',
  'predictions/[id]/bet': 'rateLimitNormal',
  'predictions/[id]/stake': 'rateLimitNormal',
  'predictions/[id]/market': 'rateLimitNormal',
  
  // Admin/cron - no rate limit needed
  'cron/': 'skip',
  'dev/': 'skip',
  'headlines/resolve': 'skip', // Has API key auth
};

function getRateLimitForPath(filePath: string): string {
  for (const [pattern, limit] of Object.entries(RATE_LIMIT_MAP)) {
    if (filePath.includes(pattern)) {
      return limit;
    }
  }
  return 'rateLimitNormal'; // Default
}

async function applyRateLimits() {
  console.log('Finding API routes without rate limiting...\n');
  
  const files = glob.sync('app/api/**/route.ts');
  let updated = 0;
  let skipped = 0;
  
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    
    // Skip if already has rate limiting
    if (content.includes('rateLimit')) {
      console.log(`✓ ${file} - already has rate limiting`);
      continue;
    }
    
    const rateLimit = getRateLimitForPath(file);
    
    if (rateLimit === 'skip') {
      console.log(`⊘ ${file} - skipping (admin/cron endpoint)`);
      skipped++;
      continue;
    }
    
    console.log(`→ ${file} - applying ${rateLimit}`);
    
    // Add import if not present
    let newContent = content;
    if (!content.includes('lib/middleware/rate-limit')) {
      const importLine = `import { ${rateLimit} } from "@/lib/middleware/rate-limit";\n`;
      
      // Add after last import
      const lastImportIndex = content.lastIndexOf('import ');
      const lineEnd = content.indexOf('\n', lastImportIndex);
      newContent = content.slice(0, lineEnd + 1) + importLine + content.slice(lineEnd + 1);
    }
    
    // Wrap exported functions
    const functionPatterns = [
      /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g,
      /export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*async\s*\(/g,
    ];
    
    for (const pattern of functionPatterns) {
      newContent = newContent.replace(pattern, (match, method) => {
        return `export const ${method} = ${rateLimit}(async (`;
      });
    }
    
    // Fix function endings
    // Count opening and closing braces to find the right closing brace
    let braceCount = 0;
    let inString = false;
    let inComment = false;
    let lastFunctionEnd = -1;
    
    for (let i = 0; i < newContent.length; i++) {
      const char = newContent[i];
      const nextChar = newContent[i + 1];
      
      // Track strings and comments
      if (char === '"' && newContent[i - 1] !== '\\\\') inString = !inString;
      if (char === '/' && nextChar === '/' && !inString) inComment = true;
      if (char === '\\n' && inComment) inComment = false;
      
      if (!inString && !inComment) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            lastFunctionEnd = i;
          }
        }
      }
    }
    
    // Add closing parenthesis and semicolon
    if (lastFunctionEnd > -1 && !newContent.includes('});', lastFunctionEnd)) {
      newContent = newContent.slice(0, lastFunctionEnd + 1) + ');' + newContent.slice(lastFunctionEnd + 1);
    }
    
    writeFileSync(file, newContent);
    updated++;
  }
  
  console.log(`\n✅ Updated ${updated} files`);
  console.log(`⊘ Skipped ${skipped} admin/cron endpoints`);
  console.log(`\nDone! Remember to test the updated endpoints.`);
}

// Run the script
applyRateLimits().catch(console.error);