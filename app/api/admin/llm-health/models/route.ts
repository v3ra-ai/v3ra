import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, LLMHealthStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider');
    const status = searchParams.get('status');
    
    console.log('[API] Getting model-specific health data', { provider, status });
    
    // Build where clause
    const where: {
      providerName?: string;
      status?: LLMHealthStatus;
    } = {};
    if (provider) where.providerName = provider;
    if (status) where.status = status as LLMHealthStatus;
    
    // Get model health metrics with detailed info
    const models = await prisma.lLMHealthMetric.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { providerName: 'asc' },
        { modelName: 'asc' }
      ]
    });

    // Get recent probes for each model
    const modelProbes = await Promise.all(
      models.map(async (model) => {
        const recentProbes = await prisma.lLMHealthProbe.findMany({
          where: {
            providerName: model.providerName,
            modelName: model.modelName
          },
          take: 5,
          orderBy: { testedAt: 'desc' }
        });

        return {
          ...model,
          recentProbes: recentProbes.map(probe => ({
            success: probe.success,
            responseTimeMs: probe.responseTimeMs,
            testedAt: probe.testedAt,
            error: probe.errorMessage
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: modelProbes
    });
  } catch (error) {
    console.error('[API] Error fetching model health data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch model data' 
      },
      { status: 500 }
    );
  }
}