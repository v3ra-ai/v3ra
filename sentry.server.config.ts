import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // Environment
  environment: process.env.NODE_ENV,

  // Integrations
  integrations: [
    // Automatically instrument Node.js libraries and frameworks
    Sentry.rewriteFramesIntegration(),
  ],

  // Filtering
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    // Random network errors
    "Network request failed",
    "NetworkError",
    "Failed to fetch",
    // User cancelled errors
    "AbortError",
    "Non-Error promise rejection captured",
  ],

  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === "production") {
      // Don't send events for 404s
      if (event.request?.url?.includes("/404")) {
        return null;
      }
      
      // Filter out specific error messages
      const error = hint.originalException;
      if (error && error instanceof Error) {
        if (error.message?.includes("ResizeObserver loop limit exceeded")) {
          return null;
        }
      }
    }
    
    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});