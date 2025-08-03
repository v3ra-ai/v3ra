import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { createSupabaseServerClient } from '@/lib/supabase-client';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      supabase: 'unknown',
    },
    version: process.env.npm_package_version || '0.1.0',
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Supabase connection
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.getSession();
    health.services.supabase = error ? 'unhealthy' : 'healthy';
    if (error) health.status = 'degraded';
  } catch (error) {
    health.services.supabase = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  
  return NextResponse.json(health, { status: statusCode });
}