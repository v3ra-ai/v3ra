"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

declare global {
  interface Window {
    hj: (command: string, ...args: unknown[]) => void;
    _hjSettings: {
      hjid: number;
      hjsv: number;
    };
  }
}

export function HotjarProvider() {
  useEffect(() => {
    // Only load in production
    if (process.env.NODE_ENV !== "production") return;
    
    // Check for Hotjar site ID
    const hjid = process.env.NEXT_PUBLIC_HOTJAR_ID;
    if (!hjid) return;

    // Hotjar Tracking Code
    (function(h: Window, o: Document, t: string, j: string, a?: HTMLElement, r?: HTMLScriptElement) {
      h.hj = h.hj || function(...args: unknown[]) {
        (h.hj.q = h.hj.q || []).push(args);
      };
      h._hjSettings = { hjid: parseInt(hjid), hjsv: 6 };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = true;
      r.src = t + h._hjSettings.hjid + j;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

    // Set up user identification when auth state changes
    const identifyUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && window.hj) {
        // Identify user in Hotjar
        window.hj('identify', user.id, {
          email: user.email,
          created_at: user.created_at,
        });
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
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return null;
}