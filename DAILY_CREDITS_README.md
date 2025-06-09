# Daily Credit Allocation System

## Overview
Automated system that allocates 10 free credits to all users daily at midnight UTC.

## 🚀 Quick Setup

### 1. Environment Variables
```bash
# Generate secure secret
openssl rand -base64 32

# Add to .env and Vercel
CRON_SECRET=your-generated-secret-here
```

### 2. Database Migration
```bash
npx supabase db push
```

### 3. Deploy
The cron job starts automatically when deployed to Vercel.

## 📊 Monitoring

### Admin Dashboard
Import the monitoring component:
```tsx
import { CreditAllocationMonitor } from '@/components/admin/credit-allocation-monitor';

// In your admin page
<CreditAllocationMonitor />
```

### API Endpoints
- `GET /api/cron/daily-credits` - Cron endpoint (secured)
- `GET /api/admin/credits/allocations` - View allocation history
- `POST /api/admin/credits/allocations` - Check today's status
- `DELETE /api/admin/credits/allocations` - Manual trigger

## 🧪 Testing

### Development Testing
```bash
npm run script scripts/test-daily-credits.ts
```

### Manual API Test
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/daily-credits
```

## 🔧 Key Features

- ✅ Secure batch processing (handles 1000+ users)
- ✅ Duplicate prevention (tracks by date)
- ✅ Error recovery and logging
- ✅ Admin monitoring dashboard
- ✅ Manual trigger capability
- ✅ RLS security integration

## 📁 Files Created

1. `/supabase/migrations/20250109_daily_credit_allocations.sql`
2. `/app/api/cron/daily-credits/route.ts`
3. `/app/api/admin/credits/allocations/route.ts`
4. `/components/admin/credit-allocation-monitor.tsx`
5. `/vercel.json` (cron configuration)
6. `/__tests__/daily-credits.test.ts`
7. `/scripts/test-daily-credits.ts`

## 📅 Schedule
Runs daily at 00:00 UTC via Vercel Cron Jobs.

## 🛡️ Security
- Service role bypass for RLS
- CRON_SECRET protection
- Audit logging for all operations
- Admin-only monitoring access