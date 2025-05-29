'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeedback } from '@/hooks/useFeedback';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';

interface ResultsCardFeedbackProps {
  component: string;
  action: string;
}

export function ResultsCardFeedback({ component, action }: ResultsCardFeedbackProps) {
  const { submitThumbsUp, submitThumbsDown, isAuthenticated } = useFeedback({ component, action });
  const [feedbackState, setFeedbackState] = useState<'none' | 'thumbs_up' | 'thumbs_down'>('none');

  // Fetch existing feedback for this user and result card
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchFeedback() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const response = await fetch('/api/feedback/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, component, action }),
        });
        const { rating } = await response.json();
        setFeedbackState(rating || 'none');
      } catch (error: unknown) {
        console.error('[ResultsCardFeedback] Error fetching feedback:', error);
        if (error instanceof Error) {
          toast.error(error.message || 'Failed to fetch feedback');
        } else {
          toast.error('Failed to fetch feedback');
        }
      }
    }

    fetchFeedback();
  }, [isAuthenticated, component, action]);

  const handleThumbsUp = async () => {
    try {
      if (feedbackState === 'thumbs_up') {
        // Toggle off: Delete feedback
        const response = await fetch('/api/feedback/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ component, action }),
        });
        if (response.ok) {
          setFeedbackState('none');
          toast.success('Feedback removed');
        } else {
          throw new Error('Failed to remove feedback');
        }
      } else {
        const result = await submitThumbsUp();
        if (result.success) {
          setFeedbackState('thumbs_up');
          toast.success('Thank you for your feedback!');
        } else {
          throw new Error(result.error || 'Failed to submit feedback');
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to submit feedback');
      } else {
        toast.error('Failed to submit feedback');
      }
    }
  };

  const handleThumbsDown = async () => {
    if (feedbackState !== 'none') {
      toast.error('You have already provided feedback for this result');
      return;
    }
    try {
      const result = await submitThumbsDown();
      if (result.success) {
        setFeedbackState('thumbs_down');
      } else {
        throw new Error(result.error || 'Failed to initiate feedback');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to initiate feedback');
      } else {
        toast.error('Failed to initiate feedback');
      }
    }
  };

  // Hide component if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
      <span className="font-semibold">Feedback:</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleThumbsUp}
        disabled={!isAuthenticated}
        aria-label="Thumbs up feedback"
        className={`h-6 w-6 cursor-pointer text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 ${feedbackState === 'thumbs_up' ? 'bg-zinc-200 dark:bg-zinc-700' : ''}`}
      >
        <ThumbsUp className={`h-4 w-4 ${feedbackState === 'thumbs_up' ? 'fill-current' : ''}`} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleThumbsDown}
        disabled={!isAuthenticated}
        aria-label="Thumbs down feedback"
        className={`h-6 w-4 cursor-pointer text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 ${feedbackState === 'thumbs_down' ? 'bg-zinc-200 dark:bg-zinc-700' : ''}`}
      >
        <ThumbsDown className={`h-4 w-4 ${feedbackState === 'thumbs_down' ? 'fill-current' : ''}`} />
      </Button>
    </div>
  );
}