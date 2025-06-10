#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface DatabaseOperation {
  file: string;
  line: number;
  operation: string;
  table?: string;
  type: 'query' | 'mutation' | 'transaction';
  hasUserId: boolean;
  context: string;
}

interface AuditReport {
  totalOperations: number;
  operationsByTable: Record<string, number>;
  operationsByType: Record<string, number>;
  creditOperations: DatabaseOperation[];
  userOperations: DatabaseOperation[];
  criticalOperations: DatabaseOperation[];
  files: string[];
}

// Patterns to detect database operations
const patterns = {
  prismaOperations: /prisma\.([\w]+)\.(create|update|delete|findMany|findUnique|findFirst|upsert|count|aggregate)/g,
  creditOperations: /(freeCredits|credits|UserCredit)/g,
  userOperations: /(user|User|userId|walletPublicKey)/g,
  transactionOperations: /prisma\.\$transaction/g,
};

function analyzeFile(filePath: string): DatabaseOperation[] {
  const operations: DatabaseOperation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for Prisma operations
    const prismaMatches = [...line.matchAll(patterns.prismaOperations)];
    prismaMatches.forEach(match => {
      const table = match[1];
      const method = match[2];
      const hasUserId = patterns.userOperations.test(line);
      
      operations.push({
        file: filePath,
        line: index + 1,
        operation: `${table}.${method}`,
        table,
        type: ['create', 'update', 'delete', 'upsert'].includes(method) ? 'mutation' : 'query',
        hasUserId,
        context: line.trim()
      });
    });

    // Check for transactions
    if (patterns.transactionOperations.test(line)) {
      operations.push({
        file: filePath,
        line: index + 1,
        operation: '$transaction',
        type: 'transaction',
        hasUserId: false,
        context: line.trim()
      });
    }
  });

  return operations;
}

function generateReport(operations: DatabaseOperation[]): AuditReport {
  const report: AuditReport = {
    totalOperations: operations.length,
    operationsByTable: {},
    operationsByType: {},
    creditOperations: [],
    userOperations: [],
    criticalOperations: [],
    files: [...new Set(operations.map(op => op.file))]
  };

  operations.forEach(op => {
    // Count by table
    if (op.table) {
      report.operationsByTable[op.table] = (report.operationsByTable[op.table] || 0) + 1;
    }

    // Count by type
    report.operationsByType[op.type] = (report.operationsByType[op.type] || 0) + 1;

    // Identify credit operations
    if (patterns.creditOperations.test(op.context)) {
      report.creditOperations.push(op);
      report.criticalOperations.push(op);
    }

    // Identify user operations
    if (op.hasUserId || (op.table && ['user', 'User', 'UserCredit'].includes(op.table))) {
      report.userOperations.push(op);
    }

    // Identify other critical operations
    if (op.table && ['PaymentLog', 'Validator', 'VoteSession'].includes(op.table)) {
      report.criticalOperations.push(op);
    }
  });

  return report;
}

function findFiles(dir: string, extensions: string[], ignore: string[] = []): string[] {
  const files: string[] = [];
  
  function walk(currentPath: string) {
    // Check if path should be ignored
    if (ignore.some(pattern => currentPath.includes(pattern))) {
      return;
    }

    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          walk(itemPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(path.relative(process.cwd(), itemPath));
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  walk(dir);
  return files;
}

async function main() {
  console.log('🔍 Analyzing Database Operations for RLS Implementation\n');
  console.log('=' .repeat(80));

  // Find all TypeScript files
  const files = findFiles(process.cwd(), ['.ts', '.tsx'], ['node_modules', '.next', '__tests__']);

  console.log(`Found ${files.length} TypeScript files to analyze\n`);

  // Analyze each file
  const allOperations: DatabaseOperation[] = [];
  files.forEach((file: string) => {
    const operations = analyzeFile(file);
    allOperations.push(...operations);
  });

  // Generate report
  const report = generateReport(allOperations);

  // Print report
  console.log('📊 AUDIT REPORT\n');
  console.log(`Total Database Operations: ${report.totalOperations}`);
  console.log(`Files with Database Operations: ${report.files.length}\n`);

  console.log('📈 Operations by Table:');
  Object.entries(report.operationsByTable)
    .sort(([,a], [,b]) => b - a)
    .forEach(([table, count]) => {
      console.log(`  - ${table}: ${count} operations`);
    });

  console.log('\n📈 Operations by Type:');
  Object.entries(report.operationsByType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count} operations`);
  });

  console.log('\n⚠️  CRITICAL: Credit System Operations:');
  if (report.creditOperations.length === 0) {
    console.log('  No direct credit operations found');
  } else {
    report.creditOperations.slice(0, 10).forEach(op => {
      console.log(`  - ${op.file}:${op.line}`);
      console.log(`    ${op.operation}: ${op.context}`);
    });
    if (report.creditOperations.length > 10) {
      console.log(`  ... and ${report.creditOperations.length - 10} more`);
    }
  }

  console.log('\n🔐 User-Related Operations:');
  console.log(`  Total: ${report.userOperations.length} operations`);
  const userTables = [...new Set(report.userOperations.map(op => op.table).filter(Boolean))];
  console.log(`  Tables: ${userTables.join(', ')}`);

  console.log('\n📋 Priority Tables for RLS:');
  const priorityTables = [
    { name: 'User', risk: 'CRITICAL', reason: 'Contains freeCredits field' },
    { name: 'UserCredit', risk: 'CRITICAL', reason: 'Financial data' },
    { name: 'PaymentLog', risk: 'HIGH', reason: 'Payment information' },
    { name: 'Validator', risk: 'MEDIUM', reason: 'Cached system' },
    { name: 'VoteSession', risk: 'MEDIUM', reason: 'User queries' },
  ];

  priorityTables.forEach(table => {
    const count = report.operationsByTable[table.name] || 0;
    console.log(`  - ${table.name}: ${table.risk} (${count} operations) - ${table.reason}`);
  });

  // Write detailed report to file
  const detailedReport = {
    ...report,
    timestamp: new Date().toISOString(),
    criticalOperations: report.criticalOperations.slice(0, 50), // Limit for readability
  };

  fs.writeFileSync(
    'rls-audit-report.json',
    JSON.stringify(detailedReport, null, 2)
  );

  console.log('\n✅ Detailed report saved to: rls-audit-report.json');
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  NEXT STEPS:');
  console.log('1. Review the SQL audit script output');
  console.log('2. Create backup of production database');
  console.log('3. Set up staging environment for testing');
  console.log('4. Begin with low-risk tables first');
  console.log('5. NEVER enable RLS without policies!');
}

// Run the script
main().catch(console.error);
