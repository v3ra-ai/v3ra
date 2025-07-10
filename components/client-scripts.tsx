"use client";

import { useEffect } from 'react';
import { performanceMonitor } from '@/lib/utils/performance';

export function ClientScripts() {
  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('SW registered: ', registration);
        })
        .catch(function(registrationError) {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Performance Monitoring
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      if (loadTime > 3000) {
        console.warn('Slow page load:', loadTime + 'ms');
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
    gtag: (...args: any[]) => void;
  }
} 