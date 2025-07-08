#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

// Files to skip
const SKIP_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'scripts/**',
  '*.min.js',
  'public/**',
  '.git/**',
  'dist/**',
  'build/**'
];

async function replaceConsoleLogs() {
  console.log('🔍 Finding files with console.log statements...\n');
  
  // Find all TypeScript and JavaScript files
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: SKIP_PATTERNS
  });
  
  let totalFiles = 0;
  let totalReplacements = 0;
  
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    
    // Skip if no console.log found
    if (!content.includes('console.log')) {
      continue;
    }
    
    // Skip if already imports logger
    const hasLogger = content.includes("from '@/lib/logger'") || 
                     content.includes('from "@/lib/logger"');
    
    // Skip if it's a logger file itself
    if (file.includes('logger')) {
      continue;
    }
    
    let newContent = content;
    let fileModified = false;
    
    // Replace console.log with logger.info
    const consoleLogPattern = /console\.log\(/g;
    const matches = content.match(consoleLogPattern);
    
    if (matches && matches.length > 0) {
      newContent = content.replace(consoleLogPattern, 'logger.info(');
      
      // Add logger import if not present
      if (!hasLogger && newContent !== content) {
        // Find the last import statement
        const importMatch = newContent.match(/^import[^;]+;$/gm);
        if (importMatch) {
          const lastImport = importMatch[importMatch.length - 1];
          const lastImportIndex = newContent.lastIndexOf(lastImport);
          const insertPosition = lastImportIndex + lastImport.length;
          
          newContent = 
            newContent.slice(0, insertPosition) + 
            "\nimport { logger } from '@/lib/logger';" +
            newContent.slice(insertPosition);
        } else {
          // No imports found, add at the beginning after 'use client' if present
          if (newContent.startsWith('"use client"') || newContent.startsWith("'use client'")) {
            newContent = newContent.replace(/^(['"])use client\1;?\s*\n/, `$&\nimport { logger } from '@/lib/logger';\n`);
          } else {
            newContent = `import { logger } from '@/lib/logger';\n\n${newContent}`;
          }
        }
        
        fileModified = true;
      }
    }
    
    // Replace console.error with logger.error
    const consoleErrorPattern = /console\.error\(/g;
    if (content.match(consoleErrorPattern)) {
      newContent = newContent.replace(consoleErrorPattern, 'logger.error(');
      fileModified = true;
    }
    
    // Replace console.warn with logger.warn
    const consoleWarnPattern = /console\.warn\(/g;
    if (content.match(consoleWarnPattern)) {
      newContent = newContent.replace(consoleWarnPattern, 'logger.warn(');
      fileModified = true;
    }
    
    if (fileModified) {
      writeFileSync(file, newContent);
      totalFiles++;
      totalReplacements += (matches ? matches.length : 0);
      console.log(`✅ ${file} - Replaced ${matches ? matches.length : 0} console.log statements`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`- Updated ${totalFiles} files`);
  console.log(`- Replaced ${totalReplacements} console.log statements`);
  console.log(`\n✅ Done! Remember to test the changes.`);
}

// Run the script
replaceConsoleLogs().catch(console.error);