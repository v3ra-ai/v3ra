'use client';

import { useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useFeedbackStore } from '@/store/feedback-store';
// Placeholder for user store (uncomment if exists)
// import { useUserStore } from '@/store/user-store';
import { submitFeedback } from '@/app/api/feedback/actions';

export interface FeedbackOptions {
  component: string;
  action: string;
}

export const useFeedback = ({ component, action }: FeedbackOptions) => {
  const pathname = usePathname();
  const { setModalOpen, setContext, reset } = useFeedbackStore();
  // Placeholder for user store
  // const { username } = useUserStore();

  const submitThumbsUp = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const browserInfo = { userAgent: navigator.userAgent };
      const result = await submitFeedback({
        rating: 'thumbs_up',
        userId: user.id,
        // Use user_metadata.username or name, fallback to 'Anonymous'
        username: user.user_metadata?.username || user.user_metadata?.name || user.user_metadata?.full_name || 'Anonymous',
        // If using user store, uncomment:
        // username: username || user.user_metadata?.username || user.user_metadata?.name || user.user_metadata?.full_name || 'Anonymous',
        email: user.email || '',
        url: pathname,
        component,
        action,
        includeBrowserInfo: true,
        browserInfo,
      });

      if (result.error) {
        throw new Error(result.error);
      }
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useFeedback] Error submitting thumbs up:', errorMessage);
      return { error: errorMessage };
    }
  }, [pathname, component, action]);

  const submitThumbsDown = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      setContext(component, action);
      setModalOpen(true);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useFeedback] Error initiating thumbs down:', errorMessage);
      return { error: errorMessage };
    }
  }, [component, action, setContext, setModalOpen]);

  const submitThumbsDownDetails = useCallback(async (options: string[], explanation: string, includeBrowserInfo: boolean) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const browserInfo = includeBrowserInfo ? { userAgent: navigator.userAgent } : undefined;
      const result = await submitFeedback({
        rating: 'thumbs_down',
        userId: user.id,
        // Use user_metadata.username or name, fallback to 'Anonymous'
        username: user.user_metadata?.username || user.user_metadata?.name || user.user_metadata?.full_name || 'Anonymous',
        // If using user store, uncomment:
        // username: username || user.user_metadata?.username || user.user_metadata?.name || user.user_metadata?.full_name || 'Anonymous',
        email: user.email || '',
        url: pathname,
        component,
        action,
        explanation,
        options,
        includeBrowserInfo,
        browserInfo,
      });

      if (result.error) {
        throw new Error(result.error);
      }
      reset();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useFeedback] Error submitting thumbs down details:', errorMessage);
      return { error: errorMessage };
    }
  }, [pathname, component, action, reset]);

  return useMemo(() => ({
    submitThumbsUp,
    submitThumbsDown,
    submitThumbsDownDetails,
    isAuthenticated: !!supabase.auth.getUser(),
  }), [submitThumbsUp, submitThumbsDown, submitThumbsDownDetails]);
};