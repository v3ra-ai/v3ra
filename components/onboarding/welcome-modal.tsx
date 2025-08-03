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
      icon: <Brain className="w-8 h-8 text-purple-400" />,
      title: "Blind AI Testing",
      description: "Compare AI models without bias - choose the best response without knowing which AI wrote it."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-pink-400" />,
      title: "Earn V3RA Points",
      description: "Get rewarded for every vote with scratch cards revealing 10-100 points."
    },
    {
      icon: <Trophy className="w-8 h-8 text-purple-400" />,
      title: "Compete & Climb",
      description: "Build your daily streak and climb the leaderboard rankings."
    },
    {
      icon: <Sparkles className="w-8 h-8 text-pink-400" />,
      title: "Shape AI Future",
      description: "Your choices help train better AI models through collective intelligence."
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-black/90 backdrop-blur-xl border-white/10">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome to V3RA Beta! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {currentStep === 0 && (
            <div className="text-center space-y-4">
              <p className="text-xl text-white/90">
                You've been granted <span className="font-bold text-2xl text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">1,000 V3RA points</span> to get started!
              </p>
              <p className="text-white/60 text-base leading-relaxed">
                V3RA is an AI consensus platform where you can query multiple AI models, 
                make predictions, and compete with other users.
              </p>
              <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg backdrop-blur">
                <p className="text-sm font-medium text-white/80">
                  🚀 This is a beta version. Your feedback helps us improve!
                </p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg mb-4 text-white">Key Features:</h3>
              <div className="grid gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-4 items-start p-3 rounded-lg bg-white/5 backdrop-blur border border-white/10 transition-all hover:bg-white/10">
                    {feature.icon}
                    <div>
                      <h4 className="font-semibold text-white">{feature.title}</h4>
                      <p className="text-sm text-white/60">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-lg text-white">Ready to Start?</h3>
              <div className="space-y-3">
                <div className="p-4 border border-white/10 rounded-lg bg-white/5 backdrop-blur hover:bg-white/10 transition-all">
                  <p className="font-medium text-white">Test Your AI Knowledge</p>
                  <p className="text-sm text-white/60">
                    Compare AI responses without knowing which model wrote them
                  </p>
                </div>
                <div className="p-4 border border-white/10 rounded-lg bg-white/5 backdrop-blur hover:bg-white/10 transition-all">
                  <p className="font-medium text-white">Earn Rewards</p>
                  <p className="text-sm text-white/60">
                    Scratch cards reveal 10-100 points for every vote
                  </p>
                </div>
                <div className="p-4 border border-white/10 rounded-lg bg-white/5 backdrop-blur hover:bg-white/10 transition-all">
                  <p className="font-medium text-white">Build Your Streak</p>
                  <p className="text-sm text-white/60">
                    Vote daily to maintain your streak and climb the leaderboard
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
                className={`w-2 h-2 rounded-full transition-all ${
                  step === currentStep 
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400 w-8' 
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
            )}
            {currentStep < 2 ? (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleClose}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}