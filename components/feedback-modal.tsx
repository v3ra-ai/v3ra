'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFeedbackStore } from '@/store/feedback-store';
import { useFeedback } from '@/hooks/useFeedback';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const feedbackOptions = [
  { id: 'slow_response', label: 'Slow response' },
  { id: 'error_response', label: 'Error response' },
  { id: 'bad_ui', label: 'Bad UI' },
];

export function FeedbackModal() {
  const { isModalOpen, selectedOptions, explanation, component, action, setModalOpen, setSelectedOptions, setExplanation, reset } = useFeedbackStore();
  const { submitThumbsDownDetails } = useFeedback({ component, action });
  const [includeBrowserInfo, setIncludeBrowserInfo] = useState(true);

  const handleSubmit = async () => {
    const result = await submitThumbsDownDetails(selectedOptions, explanation, includeBrowserInfo);
    if (result.success) {
      toast.success('Thank you for your feedback!');
      setModalOpen(false);
      reset();
    } else {
      toast.error(result.error || 'Failed to submit feedback');
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => {
      setModalOpen(open);
      if (!open) reset();
    }}>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="explanation">What went wrong?</Label>
              <Textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Please describe the issue..."
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Reasons (select all that apply)</Label>
              <div className="space-y-2">
                {feedbackOptions.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={(checked) => {
                        setSelectedOptions(
                          checked
                            ? [...selectedOptions, option.id]
                            : selectedOptions.filter((id) => id !== option.id)
                        );
                      }}
                    />
                    <Label htmlFor={option.id}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="includeBrowserInfo"
                checked={includeBrowserInfo}
                onCheckedChange={(checked) => setIncludeBrowserInfo(!!checked)}
              />
              <Label htmlFor="includeBrowserInfo">Include browser information</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}