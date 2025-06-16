import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import LLMHealthService from '@/lib/services/llm-health-service';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resolved = searchParams.get('resolved') === 'true';
    
    console.log('[API] Getting deprecation alerts', { resolved });
    
    // Get alerts based on resolved status
    const alerts = await prisma.modelDeprecationAlert.findMany({
      where: resolved ? {} : { resolvedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    // Get affected validators for each alert
    const alertsWithDetails = await Promise.all(
      alerts.map(async (alert) => {
        const affectedValidators = await prisma.validator.findMany({
          where: {
            provider: alert.providerName,
            modelName: alert.modelName,
            active: true
          },
          select: {
            id: true,
            profileName: true,
            publicKey: true
          }
        });

        return {
          ...alert,
          affectedValidators: affectedValidators
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: alertsWithDetails
    });
  } catch (error) {
    console.error('[API] Error fetching alerts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch alerts' 
      },
      { status: 500 }
    );
  }
}