# LLM Health Sync Setup

## Overview

The LLM health monitoring system now includes automatic synchronization to ensure health metrics stay aligned with active validators. This prevents orphaned metrics from appearing in the dashboard.

## Automatic Cleanup

### 1. During Health Checks
Every time health checks run (manually or scheduled), orphaned metrics are automatically cleaned up.

### 2. Dashboard Filtering
The health dashboard now filters metrics to only show those for active validators.

### 3. Periodic Sync Endpoint
A cron endpoint is available at `/api/cron/sync-llm-health` for periodic synchronization.

## Setting Up Periodic Sync

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-llm-health",
    "schedule": "0 */6 * * *"  // Every 6 hours
  }]
}
```

### Option 2: External Cron Service

Use services like cron-job.org, EasyCron, or Uptime Robot:

```bash
# Example with curl
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.com/api/cron/sync-llm-health
```

### Option 3: GitHub Actions

Create `.github/workflows/llm-health-sync.yml`:
```yaml
name: LLM Health Sync

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger LLM Health Sync
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.APP_URL }}/api/cron/sync-llm-health"
```

## Environment Variables

Add to your `.env`:
```bash
# Optional: Secure your cron endpoint
CRON_SECRET=your-secure-random-string
```

## Manual Operations

### Run Cleanup Script
```bash
# Dry run
npx ts-node scripts/cleanup-orphaned-health-metrics.ts

# Execute cleanup
DRY_RUN=false npx ts-node scripts/cleanup-orphaned-health-metrics.ts
```

### Trigger Manual Health Check
```bash
# From the admin dashboard
curl -X POST http://localhost:3000/api/admin/llm-health

# Or from the UI at /admin/llm-health
```

## Monitoring

The sync endpoint returns:
- `checksPerformed`: Number of health checks run
- `totalProviders`: Number of providers in the system
- `overallScore`: System health score (0-100)
- `orphanedMetricsCleaned`: Confirmation of cleanup

## Troubleshooting

### Orphaned Metrics Still Appearing
1. Clear the cache: Health data is cached for 30 seconds
2. Run manual health check from admin dashboard
3. Check validator status - only active validators are included

### Performance Considerations
- Health checks run for each unique provider/model combination
- Cleanup is lightweight and only deletes orphaned records
- Dashboard queries are optimized with proper indexes

## Future Improvements

The system is designed to eventually support:
1. Event-based synchronization when validators change
2. Soft-delete for historical tracking
3. Unified model registry as single source of truth

For now, the periodic sync ensures data consistency without requiring database schema changes.