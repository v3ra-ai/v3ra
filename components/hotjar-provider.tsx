"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/utils/client-logger";

declare global {
  interface Window {
    hj?: (command: string, ...args: any[]) => void;
    _hjSettings?: {
      hjid: number;
      hjsv: number;
    };
  }
}

export function HotjarProvider() {
  useEffect(() => {
    // Only load in production
    if (process.env.NODE_ENV !== "production") {
      logger.debug("Skipping Hotjar in development mode");
      return;
    }
    
    // Check for Hotjar site ID
    const hjid = process.env.NEXT_PUBLIC_HOTJAR_ID;
    if (!hjid) {
      logger.warn("NEXT_PUBLIC_HOTJAR_ID not set");
      return;
    }

    // Hotjar Tracking Code
    /* eslint-disable @typescript-eslint/no-explicit-any, prefer-rest-params */
    (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
      h.hj = h.hj || function() {
        (h.hj.q = h.hj.q || []).push(arguments);
      };
      h._hjSettings = { hjid: parseInt(hjid), hjsv: 6 };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
    /* eslint-enable @typescript-eslint/no-explicit-any, prefer-rest-params */

    // Set up user identification when auth state changes
    const identifyUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && window.hj) {
          // Identify user in Hotjar
          window.hj('identify', user.id, {
            email: user.email,
            created_at: user.created_at,
          });
          
          // Also set Sentry user context
          Sentry.setUser({
            id: user.id,
            email: user.email || undefined,
          });
        } else if (window.hj) {
          // Clear identification if no user
          window.hj('identify', null);
          Sentry.setUser(null);
        }
      } catch (error) {
        logger.error('Hotjar error identifying user', error);
        Sentry.captureException(error);
      }
    };

    // Initial identification
    identifyUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && window.hj) {
        window.hj('identify', session.user.id, {
          email: session.user.email,
          created_at: session.user.created_at,
        });
        
        // Update Sentry user context
        Sentry.setUser({
          id: session.user.id,
          email: session.user.email || undefined,
        });
        
        // Track auth events in Hotjar
        window.hj('event', `auth_${event}`);
      } else {
        // Clear user context on sign out
        if (window.hj) {
          window.hj('identify', null);
        }
        Sentry.setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return null;
}