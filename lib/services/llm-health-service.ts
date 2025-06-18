import { PrismaClient, LLMHealthStatus, Prisma } from '@prisma/client';
import { AIValidator } from '../validators/types';
import { OpenAIValidator } from '../validators/providers/openai';
import { AnthropicValidator } from '../validators/providers/anthropic';
import { GeminiValidator } from '../validators/providers/gemini';
import { OpenRouterValidator } from '../validators/providers/openrouter';
import { HuggingFaceValidator } from '../validators/providers/huggingface';
import { GrokValidator } from '../validators/providers/grok';

const prisma = new PrismaClient();

export interface HealthCheckResult {
  provider: string;
  model: string;
  status: LLMHealthStatus;
  latency?: number;
  error?: string;
  httpStatus?: number;
}

export interface ProviderHealthSummary {
  provider: string;
  totalModels: number;
  healthyModels: number;
  degradedModels: number;
  deprecatedModels: number;
  offlineModels: number;
  overallHealth: number; // 0-100 score
}

export interface SystemHealthReport {
  overallScore: number; // 0-100
  providers: ProviderHealthSummary[];
  activeIssues: ModelDeprecationAlert[];
  recentProbes: HealthCheckResult[];
}

interface ModelDeprecationAlert {
  id: string;
  modelName: string;
  providerName: string;
  deprecatedAt: Date;
  replacementModel: string | null;
  affectedValidators: number;
}

export class LLMHealthService {
  private static instance: LLMHealthService;
  
  private constructor() {}
  
  public static getInstance(): LLMHealthService {
    if (!LLMHealthService.instance) {
      LLMHealthService.instance = new LLMHealthService();
    }
    return LLMHealthService.instance;
  }

  /**
   * Run health checks for all active models
   */
  async runHealthChecks(): Promise<HealthCheckResult[]> {
    console.log('[LLM Health] Starting health checks for all active models');
    
    // Get all active validators
    const activeValidators = await prisma.validator.findMany({
      where: { active: true },
      include: { apiKeys: { include: { apiKey: true } } }
    });

    // Group by provider and model
    const modelGroups = new Map<string, Set<string>>();
    activeValidators.forEach(validator => {
      if (!modelGroups.has(validator.provider)) {
        modelGroups.set(validator.provider, new Set());
      }
      modelGroups.get(validator.provider)!.add(validator.modelName);
    });

    const results: HealthCheckResult[] = [];

    // Test each unique provider/model combination
    for (const [provider, models] of modelGroups.entries()) {
      for (const model of models) {
        const result = await this.testModel(provider, model);
        results.push(result);
        
        // Record the probe result
        await this.recordProbeResult(result);
        
        // Update health metrics
        await this.updateHealthMetrics(result);
      }
    }

    // Check for deprecations
    await this.detectDeprecatedModels(results);

    // Clean up orphaned health metrics
    await this.cleanupOrphanedMetrics();

    return results;
  }

  /**
   * Test a specific model
   */
  private async testModel(provider: string, modelName: string): Promise<HealthCheckResult> {
    const testPrompt = "Reply with 'OK' if you are operational.";
    const startTime = Date.now();
    
    try {
      // Get a validator instance for this provider/model
      const validator = await this.getValidatorInstance(provider, modelName);
      
      if (!validator) {
        return {
          provider,
          model: modelName,
          status: 'offline',
          error: 'No validator instance available'
        };
      }

      // Run the health check
      const response = await validator.validate({
        statement: testPrompt,
        context: 'Health check probe'
      });

      const latency = Date.now() - startTime;

      if (response.error) {
        // Check if it's a deprecation error
        const errorMessage = response.error.toLowerCase();
        const httpStatus = this.extractHttpStatus(response.error);
        
        if (errorMessage.includes('deprecated') || 
            errorMessage.includes('not a valid model') ||
            errorMessage.includes('model not found') ||
            httpStatus === 400) {
          return {
            provider,
            model: modelName,
            status: 'deprecated',
            error: response.error,
            latency,
            httpStatus
          };
        }

        return {
          provider,
          model: modelName,
          status: 'offline',
          error: response.error,
          latency,
          httpStatus
        };
      }

      // Check performance
      if (latency > 5000) {
        return {
          provider,
          model: modelName,
          status: 'degraded',
          latency
        };
      }

      return {
        provider,
        model: modelName,
        status: 'healthy',
        latency
      };

    } catch (error) {
      return {
        provider,
        model: modelName,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Get a validator instance for testing
   */
  private async getValidatorInstance(provider: string, modelName: string): Promise<AIValidator | null> {
    // Get the first active validator for this provider/model
    const validator = await prisma.validator.findFirst({
      where: {
        provider,
        modelName,
        active: true
      },
      include: {
        apiKeys: {
          include: { apiKey: true }
        }
      }
    });

    if (!validator) return null;

    // Find an active API key
    const apiKeyRelation = validator.apiKeys.find(k => k.apiKey.isActive);
    if (!apiKeyRelation) return null;

    const validatorOptions = {
      id: validator.id,
      name: validator.profileName,
      modelName: validator.modelName,
      active: validator.active,
      keyId: apiKeyRelation.apiKeyId
    };

    // Create validator instance based on provider
    switch (provider.toLowerCase()) {
      case 'openai':
        return new OpenAIValidator(validatorOptions);
      case 'anthropic':
        return new AnthropicValidator(validatorOptions);
      case 'gemini':
      case 'google':
        return new GeminiValidator(validatorOptions);
      case 'openrouter':
        return new OpenRouterValidator(validatorOptions);
      case 'huggingface':
        return new HuggingFaceValidator(validatorOptions);
      case 'grok':
      case 'xai':
        return new GrokValidator(validatorOptions);
      default:
        return null;
    }
  }

  /**
   * Record probe result in database
   */
  private async recordProbeResult(result: HealthCheckResult) {
    await prisma.lLMHealthProbe.create({
      data: {
        providerName: result.provider,
        modelName: result.model,
        probeType: 'health_check',
        success: result.status === 'healthy',
        responseTimeMs: result.latency,
        errorMessage: result.error,
        httpStatus: result.httpStatus
      }
    });
  }

  /**
   * Update health metrics based on probe result
   */
  private async updateHealthMetrics(result: HealthCheckResult) {
    const metric = await prisma.lLMHealthMetric.upsert({
      where: {
        providerName_modelName: {
          providerName: result.provider,
          modelName: result.model
        }
      },
      create: {
        providerName: result.provider,
        modelName: result.model,
        status: result.status,
        totalRequests: 1,
        failedRequests: result.status !== 'healthy' ? 1 : 0,
        avgLatency: result.latency,
        successRate: result.status === 'healthy' ? 100 : 0,
        lastSuccessAt: result.status === 'healthy' ? new Date() : null,
        lastErrorAt: result.status !== 'healthy' ? new Date() : null,
        lastErrorMessage: result.error
      },
      update: {
        status: result.status,
        totalRequests: { increment: 1 },
        failedRequests: result.status !== 'healthy' ? { increment: 1 } : undefined,
        avgLatency: result.latency,
        lastSuccessAt: result.status === 'healthy' ? new Date() : undefined,
        lastErrorAt: result.status !== 'healthy' ? new Date() : undefined,
        lastErrorMessage: result.error || undefined,
        updatedAt: new Date()
      }
    });

    // Calculate new success rate
    if (metric.totalRequests > 0) {
      const successRate = ((metric.totalRequests - metric.failedRequests) / metric.totalRequests) * 100;
      await prisma.lLMHealthMetric.update({
        where: { id: metric.id },
        data: { 
          successRate: new Prisma.Decimal(successRate.toFixed(2)),
          errorRate: new Prisma.Decimal((100 - successRate).toFixed(2))
        }
      });
    }
  }

  /**
   * Detect and alert on deprecated models
   */
  private async detectDeprecatedModels(results: HealthCheckResult[]) {
    const deprecatedModels = results.filter(r => r.status === 'deprecated');
    
    for (const model of deprecatedModels) {
      // Check if we already have an alert for this model
      const existingAlert = await prisma.modelDeprecationAlert.findFirst({
        where: {
          providerName: model.provider,
          modelName: model.model,
          resolvedAt: null
        }
      });

      if (!existingAlert) {
        // Count affected validators
        const affectedCount = await prisma.validator.count({
          where: {
            provider: model.provider,
            modelName: model.model,
            active: true
          }
        });

        // Create new alert
        await prisma.modelDeprecationAlert.create({
          data: {
            providerName: model.provider,
            modelName: model.model,
            deprecatedAt: new Date(),
            replacementModel: this.suggestReplacement(model.provider, model.model),
            errorSample: model.error,
            affectedValidators: affectedCount
          }
        });

        console.log(`[LLM Health] DEPRECATION ALERT: ${model.provider}/${model.model} is deprecated. ${affectedCount} validators affected.`);
      }
    }
  }

  /**
   * Suggest replacement for deprecated model
   */
  private suggestReplacement(provider: string, modelName: string): string | null {
    const replacements: Record<string, Record<string, string>> = {
      'openai': {
        'gpt-40': 'gpt-4o',
        'gpt-4-32k': 'gpt-4-turbo',
        'gpt-3.5-turbo-16k': 'gpt-3.5-turbo'
      },
      'google': {
        'gemini-1.5-pro': 'gemini-1.5-flash',
        'gemini-pro': 'gemini-1.5-flash',
        'chat-bison-001': 'gemini-1.5-flash'
      },
      'anthropic': {
        'claude-2': 'claude-3-sonnet-20240229',
        'claude-instant-1': 'claude-3-haiku-20240307'
      },
      'openrouter': {
        'google/gemini-1.5-pro': 'google/gemini-1.5-flash',
        'anthropic/claude-2': 'anthropic/claude-3-sonnet'
      }
    };

    return replacements[provider.toLowerCase()]?.[modelName] || null;
  }

  /**
   * Extract HTTP status from error message
   */
  private extractHttpStatus(error: string): number | undefined {
    const statusMatch = error.match(/\b(\d{3})\b/);
    return statusMatch ? parseInt(statusMatch[1]) : undefined;
  }

  /**
   * Get system health report
   */
  async getSystemHealthReport(): Promise<SystemHealthReport> {
    // Get all active validators to filter metrics
    const activeValidators = await prisma.validator.findMany({
      where: { active: true },
      select: { provider: true, modelName: true }
    });
    
    // Create a set of active provider:model combinations
    const activeModels = new Set(
      activeValidators.map(v => `${v.provider}:${v.modelName}`)
    );
    
    // Get all health metrics
    const allMetrics = await prisma.lLMHealthMetric.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    
    // Filter to only show metrics for active validators
    const metrics = allMetrics.filter(metric => {
      const key = `${metric.providerName}:${metric.modelName}`;
      return activeModels.has(key);
    });

    // Get active alerts
    const activeAlerts = await prisma.modelDeprecationAlert.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    // Get recent probes
    const recentProbes = await prisma.lLMHealthProbe.findMany({
      take: 50,
      orderBy: { testedAt: 'desc' }
    });

    // Calculate provider summaries
    const providerMap = new Map<string, ProviderHealthSummary>();
    
    metrics.forEach(metric => {
      if (!providerMap.has(metric.providerName)) {
        providerMap.set(metric.providerName, {
          provider: metric.providerName,
          totalModels: 0,
          healthyModels: 0,
          degradedModels: 0,
          deprecatedModels: 0,
          offlineModels: 0,
          overallHealth: 0
        });
      }

      const summary = providerMap.get(metric.providerName)!;
      summary.totalModels++;
      
      switch (metric.status) {
        case 'healthy':
          summary.healthyModels++;
          break;
        case 'degraded':
          summary.degradedModels++;
          break;
        case 'deprecated':
          summary.deprecatedModels++;
          break;
        case 'offline':
          summary.offlineModels++;
          break;
      }
    });

    // Calculate overall health scores
    const providers = Array.from(providerMap.values()).map(summary => {
      const healthScore = summary.totalModels > 0
        ? (summary.healthyModels / summary.totalModels) * 100
        : 0;
      
      return {
        ...summary,
        overallHealth: Math.round(healthScore)
      };
    });

    // Calculate system-wide health score
    const totalModels = providers.reduce((sum, p) => sum + p.totalModels, 0);
    const totalHealthy = providers.reduce((sum, p) => sum + p.healthyModels, 0);
    const overallScore = totalModels > 0 ? Math.round((totalHealthy / totalModels) * 100) : 0;

    return {
      overallScore,
      providers,
      activeIssues: activeAlerts.map(alert => ({
        id: alert.id,
        modelName: alert.modelName,
        providerName: alert.providerName,
        deprecatedAt: alert.deprecatedAt,
        replacementModel: alert.replacementModel,
        affectedValidators: alert.affectedValidators
      })),
      recentProbes: recentProbes.map(probe => ({
        provider: probe.providerName,
        model: probe.modelName,
        status: probe.success ? 'healthy' as LLMHealthStatus : 'offline' as LLMHealthStatus,
        latency: probe.responseTimeMs || undefined,
        error: probe.errorMessage || undefined,
        httpStatus: probe.httpStatus || undefined
      }))
    };
  }

  /**
   * Resolve a deprecation alert
   */
  async resolveDeprecationAlert(alertId: string): Promise<void> {
    await prisma.modelDeprecationAlert.update({
      where: { id: alertId },
      data: { resolvedAt: new Date() }
    });
  }

  /**
   * Get model recommendations
   */
  async getModelRecommendations(): Promise<Array<{
    currentModel: string;
    provider: string;
    recommendation: string;
    reason: string;
  }>> {
    const deprecatedAlerts = await prisma.modelDeprecationAlert.findMany({
      where: { resolvedAt: null }
    });

    const recommendations = deprecatedAlerts.map(alert => ({
      currentModel: alert.modelName,
      provider: alert.providerName,
      recommendation: alert.replacementModel || 'Contact provider for alternatives',
      reason: 'Model deprecated by provider'
    }));

    // Add cost optimization recommendations
    const metrics = await prisma.lLMHealthMetric.findMany({
      where: { status: 'healthy' }
    });

    // Add performance-based recommendations
    const slowModels = metrics.filter(m => m.avgLatency && m.avgLatency > 3000);
    slowModels.forEach(metric => {
      recommendations.push({
        currentModel: metric.modelName,
        provider: metric.providerName,
        recommendation: this.suggestFasterAlternative(metric.providerName, metric.modelName),
        reason: `High latency (${metric.avgLatency}ms average)`
      });
    });

    return recommendations;
  }

  /**
   * Suggest faster alternative models
   */
  private suggestFasterAlternative(provider: string, modelName: string): string {
    const fasterAlternatives: Record<string, Record<string, string>> = {
      'openai': {
        'gpt-4': 'gpt-3.5-turbo',
        'gpt-4-turbo': 'gpt-3.5-turbo'
      },
      'anthropic': {
        'claude-3-opus-20240229': 'claude-3-sonnet-20240229',
        'claude-3-sonnet-20240229': 'claude-3-haiku-20240307'
      },
      'google': {
        'gemini-1.5-pro': 'gemini-1.5-flash'
      }
    };

    return fasterAlternatives[provider.toLowerCase()]?.[modelName] || 'Consider using a smaller model variant';
  }

  /**
   * Clean up orphaned health metrics
   */
  private async cleanupOrphanedMetrics(): Promise<void> {
    console.log('[LLM Health] Cleaning up orphaned health metrics...');
    
    try {
      // Get all active validators
      const activeValidators = await prisma.validator.findMany({
        where: { active: true },
        select: { provider: true, modelName: true }
      });

      // Create a set of active provider:model combinations
      const activeModels = new Set(
        activeValidators.map(v => `${v.provider}:${v.modelName}`)
      );

      // Get all health metrics
      const allMetrics = await prisma.lLMHealthMetric.findMany();
      
      // Identify orphaned metrics
      const orphanedMetrics = allMetrics.filter(metric => {
        const key = `${metric.providerName}:${metric.modelName}`;
        return !activeModels.has(key);
      });

      if (orphanedMetrics.length > 0) {
        console.log(`[LLM Health] Found ${orphanedMetrics.length} orphaned metrics to clean up`);
        
        // Delete orphaned metrics
        for (const metric of orphanedMetrics) {
          await prisma.lLMHealthMetric.delete({
            where: { id: metric.id }
          });
          console.log(`[LLM Health] Cleaned up orphaned metric: ${metric.providerName}/${metric.modelName}`);
        }
        
        // Also clean up related probes
        for (const metric of orphanedMetrics) {
          await prisma.lLMHealthProbe.deleteMany({
            where: {
              providerName: metric.providerName,
              modelName: metric.modelName
            }
          });
        }
      }
    } catch (error) {
      console.error('[LLM Health] Error cleaning up orphaned metrics:', error);
      // Don't throw - we don't want cleanup failures to break health checks
    }
  }
}

export default LLMHealthService;