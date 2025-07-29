// import * as Sentry from '@sentry/nextjs';

// Add polyfills for server-side rendering to prevent browser API errors
if (typeof self === 'undefined') {
  (global as any).self = {};
}

export async function register() {
  // Temporarily disable Sentry to debug 400 errors
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   await import('./sentry.server.config')
  // }

  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('./sentry.edge.config')
  // }
}

// export const onRequestError = Sentry.captureRequestError;
export const onRequestError = (error: any) => {
  console.error('[Request Error]', error);
};