import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import LLMHealthService from '@/lib/services/llm-health-service';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action } = body;
    
    console.log('[API] Resolving deprecation alert', { alertId, action });
    
    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const healthService = LLMHealthService.getInstance();
    
    if (action === 'resolve') {
      // Mark alert as resolved
      await healthService.resolveDeprecationAlert(alertId);
      
      return NextResponse.json({
        success: true,
        message: 'Alert resolved successfully'
      });
    } else if (action === 'migrate') {
      // Get alert details
      const alert = await prisma.modelDeprecationAlert.findUnique({
        where: { id: alertId }
      });
      
      if (!alert) {
        return NextResponse.json(
          { success: false, error: 'Alert not found' },
          { status: 404 }
        );
      }
      
      // Update all affected validators if replacement model is available
      if (alert.replacementModel) {
        const updateResult = await prisma.validator.updateMany({
          where: {
            provider: alert.providerName,
            modelName: alert.modelName,
            active: true
          },
          data: {
            modelName: alert.replacementModel,
            updatedAt: new Date()
          }
        });
        
        // Resolve the alert
        await healthService.resolveDeprecationAlert(alertId);
        
        return NextResponse.json({
          success: true,
          message: `Migrated ${updateResult.count} validators to ${alert.replacementModel}`
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'No replacement model available' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[API] Error resolving alert:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to resolve alert' 
      },
      { status: 500 }
    );
  }
}