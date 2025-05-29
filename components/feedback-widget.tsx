'use client';

import { ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeedback } from '@/hooks/useFeedback';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FeedbackWidgetProps {
  component: string;
  action: string;
  className?: string;
}

export function FeedbackWidget({ component, action, className }: FeedbackWidgetProps) {
  const { submitThumbsUp, submitThumbsDown, isAuthenticated } = useFeedback({ component, action });

  const handleThumbsUp = async () => {
    const result = await submitThumbsUp();
    if (result.success) {
      toast.success('Thank you for your feedback!');
    } else {
      toast.error(result.error || 'Failed to submit feedback');
    }
  };

  const handleThumbsDown = async () => {
    const result = await submitThumbsDown();
    if (!result.success) {
      toast.error(result.error || 'Failed to initiate feedback');
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={handleThumbsUp}
        disabled={!isAuthenticated}
        aria-label="Thumbs up"
        className="rounded-full"
      >
        <ThumbsUpIcon className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleThumbsDown}
        disabled={!isAuthenticated}
        aria-label="Thumbs down"
        className="rounded-full"
      >
        <ThumbsDownIcon className="size-4" />
      </Button>
    </div>
  );
}