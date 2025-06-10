import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RLSStatusRow {
  schemaname: string;
  table_name: string;
  rls_enabled: boolean;
  policy_count: bigint;
  has_service_role_policy: boolean;
}

interface AuditLogRow {
  id: string;
  table_name: string;
  operation: string;
  user_id: string;
  metadata: unknown;
  created_at: Date;
}

export async function GET() {
  try {
    // Get RLS status using Prisma raw query
    const rlsStatus = await prisma.$queryRaw<RLSStatusRow[]>`
      SELECT 
        t.schemaname,
        t.tablename as table_name,
        t.rowsecurity as rls_enabled,
        COALESCE(p.policy_count, 0) as policy_count,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM pg_policies pol 
            WHERE pol.tablename = t.tablename 
            AND pol.schemaname = t.schemaname
            AND pol.cmd IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')
            AND pol.qual LIKE '%service_role%'
          ) THEN true
          ELSE false
        END as has_service_role_policy
      FROM pg_tables t
      LEFT JOIN (
        SELECT 
          schemaname,
          tablename,
          COUNT(*) as policy_count
        FROM pg_policies
        GROUP BY schemaname, tablename
      ) p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
      WHERE t.schemaname = 'public'
      ORDER BY t.tablename;
    `;

    // Also get audit logs if they exist
    let auditLogs: AuditLogRow[] = [];
    try {
      const auditLogsResult = await prisma.$queryRaw<AuditLogRow[]>`
        SELECT 
          id,
          table_name,
          operation,
          user_id,
          metadata,
          created_at
        FROM security.audit_log
        ORDER BY created_at DESC
        LIMIT 50;
      `;
      auditLogs = auditLogsResult;
    } catch {
      // Audit log table might not exist yet
      console.log('Audit log table not found, skipping');
    }

    return NextResponse.json({
      success: true,
      data: {
        tables: rlsStatus,
        auditLogs
      }
    });
  } catch (error) {
    console.error('RLS status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
