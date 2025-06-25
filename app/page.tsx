"use client";

import { useState, useEffect } from "react";

interface Answer {
  id: string;
  text: string;
  modelId: string;
}

interface Question {
  id: string;
  question: string;
  answers: Answer[];
}

export default function Arena() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [points, setPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [consensus, setConsensus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Fetch daily question
  useEffect(() => {
    fetch('/api/query')
      .then(res => res.json())
      .then(data => {
        setQuestion(data);
        setLoading(false);
        
        // Check if already voted today
        const savedVote = localStorage.getItem(`v3ra_vote_${data.id}`);
        if (savedVote) {
          setHasVoted(true);
          setSelectedAnswer(savedVote);
          // Generate mock consensus
          const mockConsensus: Record<string, number> = {};
          data.answers.forEach((answer: Answer) => {
            mockConsensus[answer.id] = Math.floor(Math.random() * 30) + 10;
          });
          setConsensus(mockConsensus);
        }
      })
      .catch(() => setLoading(false));

    // Load saved points
    const savedPoints = localStorage.getItem("v3ra_points");
    if (savedPoints) setPoints(parseInt(savedPoints));
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!hasVoted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, hasVoted]);

  const handleVote = (answerId: string) => {
    if (hasVoted || timeLeft === 0) return;
    
    setSelectedAnswer(answerId);
    setHasVoted(true);
    
    // Save vote
    if (question) {
      localStorage.setItem(`v3ra_vote_${question.id}`, answerId);
    }
    
    // Award points (1 for participation, bonus if matches consensus)
    const earnedPoints = 1; // In real app, calculate based on consensus
    const newPoints = points + earnedPoints;
    setPoints(newPoints);
    localStorage.setItem("v3ra_points", newPoints.toString());
    
    // Generate mock consensus for all answers
    if (question) {
      const mockConsensus: Record<string, number> = {};
      question.answers.forEach((answer) => {
        mockConsensus[answer.id] = Math.floor(Math.random() * 30) + 10;
      });
      setConsensus(mockConsensus);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading today&apos;s question...</p>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl">No question available today. Check back tomorrow!</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">V3RA Arena</h1>
        <p className="text-gray-400">Proof of Human Work</p>
        <div className="mt-4 text-2xl font-mono">
          {points} points
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl w-full">
        <h2 className="text-2xl font-semibold mb-8 text-center">
          {question.question}
        </h2>

        {/* Timer */}
        {!hasVoted && (
          <div className="text-center mb-6">
            <span className="text-xl font-mono">
              {timeLeft}s
            </span>
          </div>
        )}

        {/* Answers */}
        <div className="space-y-4">
          {question.answers.map((answer) => {
            const votePercentage = consensus[answer.id] || 0;
            const isSelected = selectedAnswer === answer.id;
            const isWinner = hasVoted && Math.max(...Object.values(consensus)) === votePercentage;
            
            return (
              <button
                key={answer.id}
                onClick={() => handleVote(answer.id)}
                disabled={hasVoted || timeLeft === 0}
                className={`
                  w-full p-6 text-left rounded-lg border transition-all
                  ${!hasVoted ? "hover:border-white cursor-pointer" : "cursor-default"}
                  ${isSelected ? "border-blue-500 bg-blue-500/10" : "border-gray-700"}
                  ${isWinner && hasVoted ? "border-green-500 bg-green-500/10" : ""}
                `}
              >
                <p className="text-lg">{answer.text}</p>
                
                {hasVoted && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>{votePercentage}% chose this</span>
                      {isSelected && <span>Your choice</span>}
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${isWinner ? "bg-green-500" : "bg-gray-600"}`}
                        style={{ width: `${votePercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Results message */}
        {hasVoted && (
          <div className="text-center mt-8">
            <p className="text-lg">
              You earned <span className="font-bold">1 point</span> for participating!
            </p>
            <p className="text-gray-400 mt-2">
              Come back tomorrow for the next question
            </p>
          </div>
        )}

        {/* Timeout message */}
        {timeLeft === 0 && !hasVoted && (
          <div className="text-center mt-8 text-red-500">
            Time&apos;s up! Come back tomorrow.
          </div>
        )}
      </div>
    </main>
  );
}