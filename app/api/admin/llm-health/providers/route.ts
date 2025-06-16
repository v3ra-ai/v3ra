import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('[API] Getting provider-specific health data');
    
    // Get provider health metrics grouped by provider
    const metrics = await prisma.lLMHealthMetric.groupBy({
      by: ['providerName'],
      _count: {
        modelName: true
      },
      _sum: {
        totalRequests: true,
        failedRequests: true
      }
    });

    // Get status counts for each provider
    const providerStatuses = await prisma.lLMHealthMetric.groupBy({
      by: ['providerName', 'status'],
      _count: {
        modelName: true
      }
    });

    // Transform data into provider summaries
    const providers = metrics.map(metric => {
      const statuses = providerStatuses.filter(s => s.providerName === metric.providerName);
      const statusCounts = {
        healthy: 0,
        degraded: 0,
        deprecated: 0,
        offline: 0
      };

      statuses.forEach(s => {
        statusCounts[s.status] = s._count.modelName;
      });

      const totalRequests = metric._sum.totalRequests || 0;
      const failedRequests = metric._sum.failedRequests || 0;
      const successRate = totalRequests > 0 
        ? ((totalRequests - failedRequests) / totalRequests) * 100 
        : 0;

      return {
        provider: metric.providerName,
        totalModels: metric._count.modelName,
        ...statusCounts,
        totalRequests,
        failedRequests,
        successRate: Math.round(successRate * 100) / 100
      };
    });

    return NextResponse.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('[API] Error fetching provider health data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch provider data' 
      },
      { status: 500 }
    );
  }
}