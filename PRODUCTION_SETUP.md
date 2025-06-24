# Production Setup Guide

## Environment Variables

Add these to your production environment (.env.production or hosting platform):

### Analytics & Monitoring

```env
# Hotjar (User behavior analytics)
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_site_id

# Sentry (Error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### Getting Started

1. **Hotjar Setup**:
   - Sign up at https://www.hotjar.com
   - Create a new site
   - Copy your Site ID to `NEXT_PUBLIC_HOTJAR_ID`
   - Hotjar will start tracking user sessions automatically

2. **Sentry Setup**:
   - Sign up at https://sentry.io
   - Create a new project (select Next.js)
   - Copy the DSN to `NEXT_PUBLIC_SENTRY_DSN`
   - Set up organization and project names
   - Generate an auth token for source map uploads

3. **Install Sentry package**:
   ```bash
   npm install @sentry/nextjs
   ```

### Email Notifications (Optional)

To receive email notifications for critical bugs:

1. Set up a webhook in your feedback API route
2. Use a service like SendGrid, Resend, or AWS SES
3. Add email configuration to your environment variables

### Monitoring Dashboard

- **Hotjar**: View user sessions, heatmaps, and recordings
- **Sentry**: Track errors, performance issues, and crashes
- **Feedback**: Check `/feedback` page regularly or set up notifications

### Production Checklist

- [ ] Set all required environment variables
- [ ] Test Hotjar tracking in production
- [ ] Verify Sentry error reporting works
- [ ] Test feedback submission flow
- [ ] Enable email notifications for critical bugs
- [ ] Set up monitoring alerts in Sentry
- [ ] Configure Hotjar feedback polls (optional)

### Security Notes

- Never commit `.env` files to version control
- Use environment-specific variables for each deployment
- Rotate API keys and tokens regularly
- Monitor for suspicious activity in analytics