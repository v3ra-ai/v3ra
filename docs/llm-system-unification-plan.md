# LLM System Unification Plan

## Executive Summary

The current LLM health monitoring system is disconnected from the validator management system, leading to orphaned health metrics for deleted/updated validators. This document outlines a comprehensive plan to unify these systems without breaking production.

## Current Issues

1. **Orphaned Health Metrics**: When validators are deleted or updated, their health metrics remain in the database
2. **No Cascade Deletion**: LLMHealthMetric table has no foreign key relationship with Validator table
3. **Outdated Models Display**: Health dashboard shows models that no longer exist (e.g., gemini-1.5-flash)
4. **No Synchronization**: Changes in validator configuration don't propagate to health monitoring

## Proposed Architecture Improvements

### Phase 1: Immediate Fixes (Non-Breaking)

#### 1.1 Add Cleanup Process to Health Checks
```typescript
// In LLMHealthService.runHealthChecks()
// After processing active validators, clean up orphaned metrics
const activeModels = new Set(
  activeValidators.map(v => `${v.provider}:${v.modelName}`)
);

const allMetrics = await prisma.lLMHealthMetric.findMany();
const orphanedMetrics = allMetrics.filter(
  m => !activeModels.has(`${m.providerName}:${m.modelName}`)
);

// Mark orphaned metrics as deprecated or delete them
for (const metric of orphanedMetrics) {
  await prisma.lLMHealthMetric.update({
    where: { id: metric.id },
    data: { status: 'deprecated' }
  });
}
```

#### 1.2 Add Validator Existence Check in Dashboard
```typescript
// In health dashboard API
const metrics = await prisma.lLMHealthMetric.findMany();
const activeValidators = await prisma.validator.findMany({
  where: { active: true },
  select: { provider: true, modelName: true }
});

const validModels = new Set(
  activeValidators.map(v => `${v.provider}:${v.modelName}`)
);

const validMetrics = metrics.filter(
  m => validModels.has(`${m.providerName}:${m.modelName}`)
);
```

#### 1.3 Create Synchronization Script
```typescript
// scripts/sync-llm-health-metrics.ts
// Run this periodically or on-demand
async function syncHealthMetrics() {
  // Get all active validators
  const validators = await prisma.validator.findMany({
    where: { active: true }
  });
  
  // Get unique provider/model combinations
  const activeModels = new Map();
  validators.forEach(v => {
    const key = `${v.provider}:${v.modelName}`;
    activeModels.set(key, { provider: v.provider, model: v.modelName });
  });
  
  // Remove metrics for non-existent models
  const allMetrics = await prisma.lLMHealthMetric.findMany();
  for (const metric of allMetrics) {
    const key = `${metric.providerName}:${metric.modelName}`;
    if (!activeModels.has(key)) {
      await prisma.lLMHealthMetric.delete({
        where: { id: metric.id }
      });
    }
  }
}
```

### Phase 2: Medium-Term Improvements

#### 2.1 Add Soft Delete to Health Metrics
Instead of hard deleting, add fields to track metric lifecycle:
```prisma
model LLMHealthMetric {
  // ... existing fields
  validatorExists Boolean @default(true)
  lastValidatorSeen DateTime @default(now())
  deprecatedAt DateTime?
}
```

#### 2.2 Create Unified Model Registry
```typescript
// lib/models/model-registry.ts
class ModelRegistry {
  private models: Map<string, ModelConfig>;
  
  async registerModel(provider: string, modelName: string) {
    // Register model in both validator and health systems
  }
  
  async unregisterModel(provider: string, modelName: string) {
    // Remove from both systems with proper cleanup
  }
  
  async updateModel(oldName: string, newName: string) {
    // Update across all systems
  }
}
```

#### 2.3 Add Event-Based Synchronization
```typescript
// Use event emitters for validator changes
validatorEvents.on('validator:deleted', async (validator) => {
  // Check if this was the last validator for this model
  const remaining = await prisma.validator.count({
    where: {
      provider: validator.provider,
      modelName: validator.modelName,
      active: true
    }
  });
  
  if (remaining === 0) {
    // Mark health metric as deprecated
    await prisma.lLMHealthMetric.updateMany({
      where: {
        providerName: validator.provider,
        modelName: validator.modelName
      },
      data: { status: 'deprecated' }
    });
  }
});
```

### Phase 3: Long-Term Architecture

#### 3.1 Unified Model Management Service
```typescript
interface UnifiedModelService {
  // Single source of truth for all model operations
  addModel(config: ModelConfig): Promise<Model>;
  updateModel(id: string, updates: Partial<ModelConfig>): Promise<Model>;
  deleteModel(id: string): Promise<void>;
  getActiveModels(): Promise<Model[]>;
  getHealthStatus(modelId: string): Promise<HealthStatus>;
}
```

#### 3.2 Database Schema Improvements
```prisma
// Add a Models table as single source of truth
model Model {
  id String @id @default(uuid())
  provider String
  modelName String
  active Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  validators Validator[]
  healthMetrics LLMHealthMetric[]
  
  @@unique([provider, modelName])
}

// Update existing tables to reference Model
model Validator {
  // ... existing fields
  modelId String?
  model Model? @relation(fields: [modelId], references: [id])
}

model LLMHealthMetric {
  // ... existing fields
  modelId String?
  model Model? @relation(fields: [modelId], references: [id])
}
```

## Implementation Timeline

### Week 1: Immediate Fixes
- [ ] Implement cleanup process in health checks
- [ ] Add validator existence filtering in dashboard
- [ ] Create and test synchronization script
- [ ] Document manual cleanup procedures

### Week 2-3: Testing and Monitoring
- [ ] Monitor for orphaned metrics
- [ ] Gather metrics on model lifecycle
- [ ] Test synchronization in staging
- [ ] Create alerts for data inconsistencies

### Month 2: Medium-Term Improvements
- [ ] Implement soft delete for health metrics
- [ ] Create model registry service
- [ ] Add event-based synchronization
- [ ] Update documentation

### Month 3+: Long-Term Architecture
- [ ] Design unified model management service
- [ ] Plan database migration strategy
- [ ] Implement in phases with feature flags
- [ ] Migrate existing data

## Risks and Mitigation

1. **Data Loss Risk**: 
   - Mitigation: Always soft-delete first, implement undo functionality

2. **Performance Impact**:
   - Mitigation: Add caching, run cleanup during off-peak hours

3. **Breaking Changes**:
   - Mitigation: Use feature flags, maintain backward compatibility

4. **Inconsistent State**:
   - Mitigation: Add validation checks, implement transaction boundaries

## Success Metrics

1. Zero orphaned health metrics after validator deletion
2. Health dashboard accuracy: 100% match with active validators
3. Model update propagation time: < 1 minute
4. No production incidents during migration

## Conclusion

This phased approach allows us to fix immediate issues without breaking production while building toward a more robust, unified system. The key is to start with non-invasive changes that add cleanup and validation, then gradually move toward a properly architected solution with single source of truth for model management.