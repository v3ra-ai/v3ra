import * as Sentry from '@sentry/nextjs';

// Add polyfills for server-side rendering to prevent browser API errors
if (typeof self === 'undefined') {
  (global as any).self = {};
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError;