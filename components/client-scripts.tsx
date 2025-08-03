"use client";

import { useEffect } from 'react';
import { performanceMonitor } from '@/lib/utils/performance';
import { logger } from '@/lib/utils/client-logger';

export function ClientScripts() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && 'serviceWorker' in navigator) {
      // Ensure no stale SW interferes during development
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      // Also clear caches created by SW
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }

    // Service Worker Registration (only in production)
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          logger.info('Service worker registered', { registration });
        })
        .catch(function(registrationError) {
          logger.error('Service worker registration failed', registrationError);
        });
    }

    // Performance Monitoring
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      if (loadTime > 3000) {
        logger.warn('Slow page load detected', { loadTime: loadTime + 'ms' });
      }

      // Report performance metrics after a delay
      setTimeout(() => {
        performanceMonitor.reportMetrics();
      }, 2000);
    }

    // Track mobile users in Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        window.gtag('config', 'G-RFVVNY8TD0', {
          custom_map: { dimension2: 'mobile' }
        });
      }
    }
  }, []);

  return null; // This component doesn't render anything
}

// Extend window type for TypeScript
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void;
  }
} 