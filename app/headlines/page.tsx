"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Clock,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCSRFToken } from "@/lib/utils/csrf";
import { supabase } from "@/lib/supabase-client";
import { Navbar } from "@/components/shared/navbar";

interface Headline {
  id: string;
  statement: string;
  category: string;
  aiConsensus: number;
  expiresAt: Date;
}

export default function HeadlinesPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [predictions, setPredictions] = useState<Headline[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'YES' | 'NO'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Development helper to reset daily status
  const resetDailyStatus = useCallback(async () => {
    localStorage.removeItem('lastHeadlinesCompleted');
    setHasCompletedToday(false);
    setCurrentIndex(0);
    setUserVotes({});
    // Reload predictions
    await initializeUser();
  }, []);

  const initializeUser = useCallback(async () => {
    try {
      // Get current user session
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load user points
        await loadUserPoints(user.id);
      } else {
        // For development without auth, use demo user
        if (process.env.NODE_ENV === 'development') {
          setUserId('demo-user');
          await loadUserPoints('demo-user');
        }
      }
    } catch (error) {
      console.error('Failed to initialize user:', error);
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        setUserId('demo-user');
        await loadUserPoints('demo-user');
      }
    }
    
    // Load data in parallel with error resilience
    const results = await Promise.allSettled([
      loadDailyPredictions(),
      checkDailyCompletion(),
      loadStreak()
    ]);
    
    // Log any errors but don't fail the entire init
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const taskNames = ['loadDailyPredictions', 'checkDailyCompletion', 'loadStreak'];
        console.error(`Failed to ${taskNames[index]}:`, result.reason);
      }
    });
  }, []);

  useEffect(() => {
    // Initialize user session
    initializeUser();
  }, [initializeUser]);

  // Development keyboard shortcut
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (e: KeyboardEvent) => {
        // Press Ctrl/Cmd + Shift + R to reset
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
          e.preventDefault();
          resetDailyStatus();
          console.log('Headlines daily status reset!');
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [resetDailyStatus]);

  const loadUserPoints = async (userId: string) => {
    try {
      // Always use mock endpoint to avoid database issues
      const response = await fetch(`/api/dev/mock-points?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPoints(data.balance || 0);
        setStreak(data.streak || 0);
      } else {
        // Set defaults if endpoint fails
        setPoints(1000);
        setStreak(1);
      }
    } catch (error) {
      console.error('Failed to load user points:', error);
      // Set defaults on error
      setPoints(1000);
      setStreak(1);
    }
  };

  const loadDailyPredictions = async () => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = {};
      if (userId) {
        headers['x-user-id'] = userId;
      }
      
      const response = await fetch('/api/headlines/daily', { headers });
      const data = await response.json();
      
      console.log('Loaded headlines data:', data);
      
      if (data.alreadyCompleted) {
        setHasCompletedToday(true);
      } else if (data.headlines && data.headlines.length > 0) {
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

  // Development helper to add points
  const addDevPoints = async () => {
    try {
      const response = await fetch('/api/dev/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 5000 })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPoints(data.newBalance);
        alert(`Added ${data.awarded} V3RA! New balance: ${data.newBalance}`);
      }
    } catch (error) {
      console.error('Failed to add dev points:', error);
    }
  };

  const handleVote = async (vote: 'YES' | 'NO') => {
    const currentPrediction = predictions[currentIndex];
    if (!currentPrediction || isPlacingBet) return;

    setIsPlacingBet(true);
    
    try {
      // Place bet with fixed 10 V3RA
      const betAmount = 10;
      
      if (points < betAmount) {
        alert('Not enough V3RA points! You need at least 10 V3RA to make a prediction.');
        setIsPlacingBet(false);
        return;
      }
      
      setUserVotes(prev => ({
        ...prev,
        [currentPrediction.id]: vote
      }));

      // Animate to next card
      if (currentIndex < predictions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // All predictions completed
        await completeDaily();
      }
    } catch (error) {
      console.error('Failed to place bet:', error);
    } finally {
      setIsPlacingBet(false);
    }
  };

  const completeDaily = async () => {
    try {
      // Submit all bets to API
      const submissionData = {
        userId: userId || 'demo-user',
        predictions: Object.entries(userVotes).map(([id, vote]) => ({
          predictionId: id,
          vote
        }))
      };
      
      console.log('Submitting predictions:', submissionData);
      
      // Get CSRF token
      const csrfToken = await getCSRFToken();
      
      const response = await fetch('/api/headlines/daily', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
        body: JSON.stringify(submissionData),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update points with new balance from server
        setPoints(data.newBalance);
        
        // Update streak
        updateStreak();
        
        // Mark as completed for today
        const today = new Date().toDateString();
        localStorage.setItem('lastHeadlinesCompleted', today);
        setHasCompletedToday(true);
        
        // Show success message if bonus was awarded
        if (data.bonusAwarded > 0) {
          console.log(`Bonus awarded: ${data.bonusAwarded} V3RA`);
        }
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to submit predictions (${response.status})`);
      }
    } catch (error) {
      console.error('Failed to submit votes:', error);
      alert('Failed to submit your predictions. Please try again.');
      
      // Reset to allow retry
      setCurrentIndex(0);
      setUserVotes({});
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
          <p className="text-zinc-400">Loading today&apos;s headlines...</p>
        </div>
      </div>
    );
  }

  if (hasCompletedToday) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar 
          userPoints={points}
          canClaimBonus={false}
        />
        
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
              Today&apos;s Predictions Complete! 
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-black/50 rounded-lg p-4 border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-1">Daily Streak</p>
                <p className="text-2xl font-bold text-cyan-400">{streak} days 🔥</p>
              </div>
              
              <div className="bg-black/50 rounded-lg p-4 border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-1">Today&apos;s Results</p>
                <p className="text-sm font-medium text-zinc-300">Completion Bonus: <span className="text-yellow-400">+50 V3RA</span></p>
                <p className="text-sm font-medium text-zinc-300">Predictions Made: <span className="text-cyan-400">3</span></p>
                <p className="text-sm font-medium text-zinc-300">V3RA Wagered: <span className="text-zinc-400">30</span></p>
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
            
            {/* Development mode reset button */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <Button 
                  onClick={resetDailyStatus}
                  variant="outline" 
                  className="w-full text-xs opacity-50 hover:opacity-100"
                >
                  [Dev] Reset Daily Status
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar 
        userPoints={points}
        canClaimBonus={false}
      />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Streak Badge */}
          {streak > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-6"
            >
              <Badge className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30 px-4 py-2 flex items-center gap-2">
                <Flame className="w-5 h-5" />
                <span className="font-semibold text-lg">{streak} day streak</span>
              </Badge>
            </motion.div>
          )}
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">
              Tomorrow&apos;s Headlines
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base">
              <span className="hidden sm:inline">Swipe right if you think it&apos;ll happen, left if not</span>
              <span className="sm:hidden">Tap Yes or No below</span>
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
          <div className="relative h-[400px] sm:h-[400px] min-h-[350px]" style={{ height: "min(400px, calc(100vh - 300px))" }}>
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
                  <Card className="h-full backdrop-blur-sm bg-gradient-to-br from-zinc-900/95 to-black/95 border-2 border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.3)] p-4 sm:p-6 cursor-grab active:cursor-grabbing overflow-y-auto" data-swipe-card>
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

                      {/* Betting Info */}
                      <div className="bg-zinc-900/50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Cost per prediction:</span>
                          <span className="text-yellow-400 font-medium">10 V3RA</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-zinc-400">Win reward:</span>
                          <span className="text-green-400 font-medium">15 V3RA</span>
                        </div>
                      </div>

                      {/* Swipe Hints */}
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-2 text-red-400">
                          <ChevronLeft className="w-4 h-4" />
                          <span>Won&apos;t happen</span>
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

          {/* Not Enough Points Warning */}
          {points < 10 && currentPrediction && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">
                You need at least 10 V3RA to make predictions. Complete daily bonuses or win more predictions!
              </p>
              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={addDevPoints}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-xs"
                >
                  [Dev] Add 5000 V3RA for Testing
                </Button>
              )}
            </div>
          )}

          {/* Action Buttons (Alternative to swiping) */}
          <div className="flex gap-4 mt-8">
            <Button
              onClick={() => handleVote('NO')}
              variant="outline"
              size="lg"
              disabled={isPlacingBet || points < 10}
              className="flex-1 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ThumbsDown className="w-5 h-5 mr-2 text-red-400" />
              <span className="text-red-400">No (10 V3RA)</span>
            </Button>
            <Button
              onClick={() => handleVote('YES')}
              variant="outline"
              size="lg"
              disabled={isPlacingBet || points < 10}
              className="flex-1 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ThumbsUp className="w-5 h-5 mr-2 text-green-400" />
              <span className="text-green-400">Yes (10 V3RA)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}