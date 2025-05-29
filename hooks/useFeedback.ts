import { useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useFeedbackStore } from '@/store/feedback-store';
import { submitFeedback } from '@/app/api/feedback/actions';

export interface FeedbackOptions {
  component: string;
  action: string;
}

export const useFeedback = ({ component, action }: FeedbackOptions) => {
  const pathname = usePathname();
  const { setModalOpen, setContext, reset } = useFeedbackStore();

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
        username: user.user_metadata?.name || 'Anonymous',
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
    } catch (error) {
      console.error('[useFeedback] Error submitting thumbs up:', error);
      return { error: (error as Error).message };
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
    } catch (error) {
      console.error('[useFeedback] Error initiating thumbs down:', error);
      return { error: (error as Error).message };
    }
  }, [component, action, setContext, setModalOpen]);

  const submitThumbsDownDetails = useCallback(async (options: string[], explanation: string, includeBrowserInfo: boolean) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const browserInfo = includeBrowserInfo ? { userAgent: navigator.userAgent } : undefined; // Use undefined instead of null
      const result = await submitFeedback({
        rating: 'thumbs_down',
        userId: user.id,
        username: user.user_metadata?.name || 'Anonymous',
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
    } catch (error) {
      console.error('[useFeedback] Error submitting thumbs down details:', error);
      return { error: (error as Error).message };
    }
  }, [pathname, component, action, reset]);

  return useMemo(() => ({
    submitThumbsUp,
    submitThumbsDown,
    submitThumbsDownDetails,
    isAuthenticated: !!supabase.auth.getUser(),
  }), [submitThumbsUp, submitThumbsDown, submitThumbsDownDetails]);
};