# LLM Selection Integration Plan

## Overview
This document tracks the implementation of LLM selection capabilities across the platform, allowing users to choose which AI models to query in various features.

## Current State (2025-01-06)
- ✅ Multi-AI consensus with LLM selection works on `/ask` page
- ✅ AI Hub (`/ai-hub`) allows model configuration
- ⚠️ Truth Market has API support but no UI
- ❌ Headlines feature has no LLM selection
- ❌ No dedicated model testing interface
- ❌ Health metrics not visible to users

## Implementation Phases

### Phase 1: Add LLM Selection to Truth Market ⏳ **IN PROGRESS**
**Priority:** High  
**Status:** Implementation complete, testing needed

#### Tasks:
- [x] Import QueryModelSelector component into truth market page
- [x] Add LLM selection UI above the query input
- [x] Pass selected LLM IDs to the API call
- [x] Show which models are being queried in the loading state
- [ ] Test with different model combinations

#### Files to modify:
- `/app/ask/truth-market-simple/page.tsx`
- `/components/truth-market/truth-result.tsx` (if needed)

---

### Phase 2: Enhance Headlines with Optional LLM Selection 📋 **PLANNED**
**Priority:** Medium  
**Status:** Not started

#### Tasks:
- [ ] Add collapsible "Advanced Options" section
- [ ] Include mini LLM selector (limit to 3-5 for performance)
- [ ] Update API to accept optional LLM IDs
- [ ] Default to current fast preset if none selected
- [ ] Test performance impact

#### Files to modify:
- `/app/headlines/page.tsx`
- `/app/api/headlines/daily/route.ts`

---

### Phase 3: Create Dedicated Model Testing Page 📋 **PLANNED**
**Priority:** High  
**Status:** Not started

#### Tasks:
- [ ] Create `/ai-hub/test` route
- [ ] Build side-by-side comparison interface
- [ ] Allow testing same query on multiple models
- [ ] Show response time, token usage, and quality metrics
- [ ] Save test results for later review

#### New files to create:
- `/app/ai-hub/test/page.tsx`
- `/components/ai-hub/model-tester.tsx`
- `/components/ai-hub/comparison-view.tsx`

---

### Phase 4: Surface Health Metrics in UI 📋 **PLANNED**
**Priority:** Medium  
**Status:** Not started

#### Tasks:
- [ ] Add health indicators to model cards in AI Hub
- [ ] Create public health dashboard at `/ai-hub/health`
- [ ] Show real-time status, average latency, success rates
- [ ] Add deprecation warnings on model selector
- [ ] Link from main AI Hub page

#### Files to modify:
- `/app/ai-hub/page.tsx`
- `/components/ai-hub/model-configuration.tsx`
- Create: `/app/ai-hub/health/page.tsx`

---

### Phase 5: Unified LLM Selection Component 📋 **PLANNED**
**Priority:** Low  
**Status:** Not started

#### Tasks:
- [ ] Extract common LLM selection logic
- [ ] Create reusable `<LLMSelector>` component
- [ ] Define component props interface
- [ ] Replace existing selectors with unified component
- [ ] Update documentation

#### Component props:
```typescript
interface LLMSelectorProps {
  maxSelections?: number;
  presets?: ('knowledge' | 'reasoning')[];
  onSelectionChange?: (selectedIds: string[]) => void;
  compact?: boolean;
  showHealthIndicators?: boolean;
}
```

---

## Progress Tracking

### Completed Features
- [x] Base infrastructure (LLM store, API support)
- [x] LLM selection on /ask page
- [x] AI Hub configuration page

### In Progress
- [ ] Phase 1: Truth Market LLM selection

### Upcoming
- [ ] Phase 2: Headlines LLM selection
- [ ] Phase 3: Model testing page
- [ ] Phase 4: Health metrics UI
- [ ] Phase 5: Unified component

## Notes
- All implementations should use the existing `llm-store` for state management
- Maintain backward compatibility with existing features
- Monitor performance impact, especially for features like Headlines
- Consider adding feature flags for gradual rollout

## Success Criteria
- Users can select LLMs in all major query features
- Consistent UX across the platform
- No performance degradation
- Increased user engagement with model selection