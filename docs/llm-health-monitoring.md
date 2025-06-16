# LLM Health Monitoring System

## Overview
The LLM Health Monitoring System provides real-time monitoring and alerting for all LLM providers and models used in the application. It automatically detects deprecated models, performance degradation, and provider outages.

## Features

### 1. Real-time Health Dashboard
- **System Health Score**: Overall health percentage (0-100)
- **Provider Status**: Health summary for each LLM provider
- **Active Issues**: Deprecated models and critical alerts
- **Quick Actions**: Common administrative tasks

### 2. Automated Health Checks
- Periodic validation of all active models
- Response time monitoring
- Success rate tracking
- Error pattern detection

### 3. Deprecation Detection
- Automatic detection of deprecated models
- Suggested replacement models
- One-click migration for affected validators
- Alert management system

### 4. Performance Monitoring
- Average latency tracking
- Success/failure rates
- Historical probe data
- Performance trend analysis

## Architecture

### Database Schema
Three new tables support the monitoring system:

1. **LLMHealthMetric**: Stores aggregated health metrics for each model
2. **ModelDeprecationAlert**: Tracks deprecated models and migration status
3. **LLMHealthProbe**: Records individual health check results

### API Endpoints
- `GET /api/admin/llm-health` - Dashboard data
- `POST /api/admin/llm-health` - Trigger manual health check
- `GET /api/admin/llm-health/providers` - Provider-specific data
- `GET /api/admin/llm-health/models` - Model-specific data
- `GET /api/admin/llm-health/alerts` - Deprecation alerts
- `POST /api/admin/llm-health/resolve` - Resolve/migrate alerts
- `GET /api/cron/llm-health-check` - Cron job endpoint

### Components
- `LLMHealthDashboard`: Main dashboard component
- `LLMProviderCard`: Detailed provider/model view
- `LLMAlertPanel`: Alert management interface

## Usage

### Accessing the Dashboard
Navigate to `/admin/llm-health` in the admin interface.

### Manual Health Check
Click "Run Health Check" to trigger an immediate validation of all models.

### Handling Deprecated Models
1. Deprecated models appear in the "Active Issues" panel
2. Click "Auto-Migrate" to update all affected validators
3. Or click "Mark Resolved" to dismiss the alert

### Setting Up Automated Checks
For production environments, configure a cron job to call:
```
GET https://your-domain.com/api/cron/llm-health-check
Authorization: Bearer YOUR_CRON_SECRET
```

Recommended schedule: Every 30 minutes

## Model Replacement Mappings
The system includes pre-configured replacement suggestions:

### OpenAI
- `gpt-40` → `gpt-4o`
- `gpt-4-32k` → `gpt-4-turbo`
- `gpt-3.5-turbo-16k` → `gpt-3.5-turbo`

### Google
- `gemini-1.5-pro` → `gemini-1.5-flash`
- `gemini-pro` → `gemini-1.5-flash`
- `chat-bison-001` → `gemini-1.5-flash`

### Anthropic
- `claude-2` → `claude-3-sonnet-20240229`
- `claude-instant-1` → `claude-3-haiku-20240307`

## Monitoring Best Practices

1. **Regular Review**: Check the dashboard daily for new issues
2. **Prompt Migration**: Migrate deprecated models immediately
3. **Performance Monitoring**: Track latency trends over time
4. **Cost Optimization**: Use performance data to optimize model selection

## Troubleshooting

### Common Issues

1. **False Positive Deprecations**
   - Temporary API errors may trigger false alerts
   - Wait for 2-3 health check cycles before taking action

2. **Migration Failures**
   - Ensure replacement model is available
   - Check API key permissions for new model

3. **High Latency Alerts**
   - Consider provider's current status
   - May indicate network issues rather than model problems

## Future Enhancements

1. **Email/Slack Notifications**: Automated alerts for critical issues
2. **Cost Tracking**: Monitor API usage costs per model
3. **Performance Baselines**: Model-specific performance thresholds
4. **A/B Testing**: Compare model performance for optimization