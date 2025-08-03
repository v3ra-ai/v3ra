import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  trackEvent, 
  trackPageView, 
  trackInteraction, 
  trackConversion, 
  trackFeature,
  trackError 
} from '@/lib/analytics/tracking';

export function useAnalytics() {
  const pathname = usePathname();
  
  // Track page view when pathname changes
  const trackCurrentPage = useCallback(() => {
    trackPageView(pathname);
  }, [pathname]);
  
  // Track button clicks
  const trackClick = useCallback((buttonName: string, metadata?: Record<string, any>) => {
    trackInteraction('click', 'button', buttonName);
    if (metadata) {
      trackEvent({
        name: `button_click_${buttonName}`,
        properties: metadata,
      });
    }
  }, []);
  
  // Track form submissions
  const trackFormSubmit = useCallback((formName: string, success: boolean, metadata?: Record<string, any>) => {
    trackEvent({
      name: `form_${success ? 'submit_success' : 'submit_error'}`,
      properties: {
        form: formName,
        ...metadata,
      },
    });
  }, []);
  
  // Track search queries
  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    trackEvent({
      name: 'search',
      properties: {
        query,
        results_count: resultsCount,
        page: pathname,
      },
    });
  }, [pathname]);
  
  // Track AI model voting
  const trackVote = useCallback((winner: string, loser: string, category: string) => {
    trackEvent({
      name: 'ai_vote',
      properties: {
        winner,
        loser,
        category,
        page: pathname,
      },
    });
    
    // Also track as conversion
    trackConversion('vote', 1);
  }, [pathname]);
  
  // Track feature discovery
  const trackFeatureDiscovery = useCallback((feature: string) => {
    trackFeature(feature, 'view', { page: pathname });
  }, [pathname]);
  
  // Track feature usage
  const trackFeatureUse = useCallback((feature: string, metadata?: Record<string, any>) => {
    trackFeature(feature, 'use', { page: pathname, ...metadata });
  }, [pathname]);
  
  // Track errors with context
  const trackErrorWithContext = useCallback((error: Error, context?: Record<string, any>) => {
    trackError(error, {
      page: pathname,
      ...context,
    });
  }, [pathname]);
  
  return {
    trackCurrentPage,
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackVote,
    trackFeatureDiscovery,
    trackFeatureUse,
    trackError: trackErrorWithContext,
  };
}