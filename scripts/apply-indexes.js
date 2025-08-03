#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applyIndexes() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Applying database indexes...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = [];
    
    // Handle regular CREATE INDEX statements
    const indexStatements = sql.match(/CREATE INDEX[^;]+;/gi);
    if (indexStatements) {
      statements.push(...indexStatements.map(s => s.trim()));
    }
    
    // Handle the DO block as a single statement
    const doBlockMatch = sql.match(/DO \$\$[\s\S]*?\$\$;/);
    if (doBlockMatch) {
      statements.push(doBlockMatch[0]);
    }
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`  Executing: ${statement.substring(0, 50)}...`);
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message.includes('already exists')) {
            console.log(`  ⚠️  Index already exists, skipping...`);
          } else {
            throw err;
          }
        }
      }
    }
    
    console.log('✅ Indexes applied successfully!');
    
    // Verify indexes were created
    const indexes = await prisma.$queryRaw`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `;
    
    console.log('\n📊 Created indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.indexname} on ${idx.tablename}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to apply indexes:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes();