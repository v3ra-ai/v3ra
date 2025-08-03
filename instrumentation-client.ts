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
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      maskAllInputs: true,
    }),
    Sentry.browserTracingIntegration(),
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
    // Chrome specific
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // React hydration warnings
    "Hydration failed",
    "There was an error while hydrating",
    // Extension errors
    "chrome-extension://",
    "moz-extension://",
  ],

  beforeSend(event, hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      return null;
    }

    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === "production") {
      // Don't send events for 404s
      if (event.request?.url?.includes("/404")) {
        return null;
      }
      
      // Filter out specific error messages
      const error = hint.originalException;
      if (error && error instanceof Error) {
        // Filter browser-specific errors
        if (error.message?.includes("ResizeObserver loop limit exceeded")) {
          return null;
        }
        
        // Filter extension-related errors
        if (error.stack?.includes("chrome-extension://") || 
            error.stack?.includes("moz-extension://")) {
          return null;
        }
      }
    }
    
    return event;
  },

  // Track user interactions
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === "console") {
      return null;
    }
    
    // Add more context to navigation breadcrumbs
    if (breadcrumb.category === "navigation") {
      breadcrumb.data = {
        ...breadcrumb.data,
        timestamp: new Date().toISOString(),
      };
    }
    
    return breadcrumb;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

// Export the router transition hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;