'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Brain, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
  };

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-blue-500" />,
      title: "Ask AI Models",
      description: "Query multiple AI models simultaneously and see their consensus on any topic."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      title: "Truth Market",
      description: "Bet on outcomes and test your prediction skills with V3RA points."
    },
    {
      icon: <Trophy className="w-8 h-8 text-yellow-500" />,
      title: "Tomorrow's Headlines",
      description: "Predict future events and compete on the leaderboard."
    },
    {
      icon: <Sparkles className="w-8 h-8 text-purple-500" />,
      title: "Earn Points Daily",
      description: "Claim your daily bonus and build your streak for extra rewards!"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to V3RA Beta! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {currentStep === 0 && (
            <div className="text-center space-y-4">
              <p className="text-lg">
                You've been granted <span className="font-bold text-primary">1,000 V3RA points</span> to get started!
              </p>
              <p className="text-muted-foreground">
                V3RA is an AI consensus platform where you can query multiple AI models, 
                make predictions, and compete with other users.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  🚀 This is a beta version. Your feedback helps us improve!
                </p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4">Key Features:</h3>
              <div className="grid gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    {feature.icon}
                    <div>
                      <h4 className="font-semibold">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-lg">Ready to Start?</h3>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Try your first query</p>
                  <p className="text-sm text-muted-foreground">
                    Ask any question to see AI consensus in action
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Make a prediction</p>
                  <p className="text-sm text-muted-foreground">
                    Test your forecasting skills on Tomorrow's Headlines
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Claim daily bonus</p>
                  <p className="text-sm text-muted-foreground">
                    Check back daily to grow your points balance
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4">
          <div className="flex gap-2">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${
                  step === currentStep ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
            )}
            {currentStep < 2 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleClose}>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}