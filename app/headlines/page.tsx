"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  Home, 
  Clock,
  TrendingUp,
  Newspaper,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Headline {
  id: string;
  statement: string;
  category: string;
  aiConsensus: number;
  expiresAt: Date;
}

export default function HeadlinesPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [predictions, setPredictions] = useState<Headline[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'YES' | 'NO'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(1000);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);

  useEffect(() => {
    // Load today's predictions
    loadDailyPredictions();
    // Check if user already completed today
    checkDailyCompletion();
    // Load streak from localStorage
    loadStreak();
  }, []);

  const loadDailyPredictions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/headlines/daily');
      const data = await response.json();
      
      if (data.headlines && data.headlines.length > 0) {
        setPredictions(data.headlines.map((h: any) => ({
          ...h,
          expiresAt: new Date(h.expiresAt)
        })));
      }
    } catch (error) {
      console.error('Failed to load predictions:', error);
      // Could show an error state here
    } finally {
      setIsLoading(false);
    }
  };

  const checkDailyCompletion = () => {
    // Check localStorage for today's completion
    const today = new Date().toDateString();
    const lastCompleted = localStorage.getItem('lastHeadlinesCompleted');
    if (lastCompleted === today) {
      setHasCompletedToday(true);
    }
  };

  const loadStreak = () => {
    const savedStreak = localStorage.getItem('headlinesStreak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10));
    }
  };

  const updateStreak = () => {
    const lastCompleted = localStorage.getItem('lastHeadlinesCompleted');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastCompleted === yesterday.toDateString()) {
      // Consecutive day - increment streak
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('headlinesStreak', newStreak.toString());
    } else if (lastCompleted !== new Date().toDateString()) {
      // Streak broken - reset to 1
      setStreak(1);
      localStorage.setItem('headlinesStreak', '1');
    }
  };

  const handleVote = (vote: 'YES' | 'NO') => {
    const currentPrediction = predictions[currentIndex];
    if (!currentPrediction) return;

    setUserVotes(prev => ({
      ...prev,
      [currentPrediction.id]: vote
    }));

    // Animate to next card
    if (currentIndex < predictions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // All predictions completed
      completeDaily();
    }
  };

  const completeDaily = async () => {
    // Update streak
    updateStreak();
    
    // Mark as completed for today
    const today = new Date().toDateString();
    localStorage.setItem('lastHeadlinesCompleted', today);
    setHasCompletedToday(true);

    // Award daily completion bonus
    setPoints(prev => prev + 50);
    
    // Submit votes to API
    try {
      await fetch('/api/headlines/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictions: Object.entries(userVotes).map(([id, vote]) => ({
            predictionId: id,
            vote
          }))
        })
      });
    } catch (error) {
      console.error('Failed to submit votes:', error);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleVote('YES');
    } else if (info.offset.x < -threshold) {
      handleVote('NO');
    }
  };

  const currentPrediction = predictions[currentIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Newspaper className="w-12 h-12 text-cyan-400 animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">Loading today's headlines...</p>
        </div>
      </div>
    );
  }

  if (hasCompletedToday) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full backdrop-blur-sm bg-gradient-to-br from-zinc-900/80 to-black/90 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.25)] p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">
              Today's Predictions Complete! 
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-black/50 rounded-lg p-4 border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-1">Daily Streak</p>
                <p className="text-2xl font-bold text-cyan-400">{streak} days 🔥</p>
              </div>
              
              <div className="bg-black/50 rounded-lg p-4 border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-1">Points Earned</p>
                <p className="text-2xl font-bold text-yellow-400">+50 V3RA</p>
              </div>
            </div>
            
            <p className="text-zinc-400 mb-6">
              Come back tomorrow to see your results and make new predictions!
            </p>
            
            <div className="flex gap-3">
              <Link href="/predictions" className="flex-1">
                <Button variant="outline" className="w-full">
                  View All Predictions
                </Button>
              </Link>
              <Link href="/ask/truth-market-simple" className="flex-1">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500">
                  Ask a Question
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <div className="flex items-center gap-4">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {points.toLocaleString()} V3RA
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {streak} day streak 🔥
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">
              Tomorrow's Headlines
            </h1>
            <p className="text-zinc-400">
              Swipe right if you think it'll happen, left if not
            </p>
          </motion.div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>Prediction {currentIndex + 1} of {predictions.length}</span>
              <span>{predictions.length - currentIndex - 1} remaining</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / predictions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Card Stack */}
          <div className="relative h-[400px]">
            <AnimatePresence>
              {currentPrediction && (
                <motion.div
                  key={currentPrediction.id}
                  className="absolute inset-0"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={handleDragEnd}
                  whileDrag={{ scale: 1.05 }}
                >
                  <Card className="h-full backdrop-blur-sm bg-gradient-to-br from-zinc-900/95 to-black/95 border-2 border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.3)] p-6 cursor-grab active:cursor-grabbing">
                    <div className="flex flex-col h-full">
                      {/* Category Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {currentPrediction.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-zinc-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">24h</span>
                        </div>
                      </div>

                      {/* Prediction Text */}
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-lg text-zinc-100 text-center leading-relaxed">
                          {currentPrediction.statement}
                        </p>
                      </div>

                      {/* AI Consensus */}
                      <div className="mt-6">
                        <div className="flex justify-between text-sm text-zinc-400 mb-2">
                          <span>AI Consensus</span>
                          <span>{currentPrediction.aiConsensus}% likely</span>
                        </div>
                        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-300",
                              currentPrediction.aiConsensus > 60 
                                ? "bg-gradient-to-r from-green-500 to-green-600" 
                                : currentPrediction.aiConsensus > 40
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                : "bg-gradient-to-r from-red-500 to-red-600"
                            )}
                            style={{ width: `${currentPrediction.aiConsensus}%` }}
                          />
                        </div>
                      </div>

                      {/* Swipe Hints */}
                      <div className="flex justify-between mt-6 text-xs">
                        <div className="flex items-center gap-2 text-red-400">
                          <ChevronLeft className="w-4 h-4" />
                          <span>Won't happen</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-400">
                          <span>Will happen</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons (Alternative to swiping) */}
          <div className="flex gap-4 mt-8">
            <Button
              onClick={() => handleVote('NO')}
              variant="outline"
              size="lg"
              className="flex-1 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
            >
              <ThumbsDown className="w-5 h-5 mr-2 text-red-400" />
              <span className="text-red-400">No</span>
            </Button>
            <Button
              onClick={() => handleVote('YES')}
              variant="outline"
              size="lg"
              className="flex-1 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50"
            >
              <ThumbsUp className="w-5 h-5 mr-2 text-green-400" />
              <span className="text-green-400">Yes</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}