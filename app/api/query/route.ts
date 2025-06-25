import { NextResponse } from "next/server";

// For MVP, we'll rotate through hardcoded questions
// In production, this would fetch from database
const QUESTIONS = [
  {
    id: "2025-01-25",
    question: "Should AI development be paused until safety measures are established?",
    answers: [
      {
        id: "a1",
        text: "Yes. The potential risks of uncontrolled AI development outweigh the benefits. We need comprehensive safety frameworks before proceeding.",
        modelId: "gpt-4",
      },
      {
        id: "a2", 
        text: "No. Innovation thrives in open environments. Pausing development would stifle progress and put us behind other nations.",
        modelId: "claude-3",
      },
      {
        id: "a3",
        text: "Yes. History shows that powerful technologies need regulation. We should learn from past mistakes with nuclear and biotech.",
        modelId: "gemini-pro",
      },
      {
        id: "a4",
        text: "No. Market forces and competition naturally create safety incentives. Government intervention would be counterproductive.",
        modelId: "llama-2",
      },
      {
        id: "a5",
        text: "Yes, but only partially. We need targeted regulations on high-risk applications while allowing research to continue.",
        modelId: "mistral",
      },
    ],
  },
  {
    id: "2025-01-26",
    question: "Is universal basic income necessary in an AI-driven economy?",
    answers: [
      {
        id: "b1",
        text: "Yes. As AI automates jobs, UBI ensures everyone can meet basic needs and participate in the economy.",
        modelId: "gpt-4",
      },
      {
        id: "b2",
        text: "No. UBI would discourage work and innovation. Better to invest in retraining and new job creation.",
        modelId: "claude-3",
      },
      {
        id: "b3",
        text: "Yes. It provides economic stability and frees people to pursue education, creativity, and entrepreneurship.",
        modelId: "gemini-pro",
      },
      {
        id: "b4",
        text: "No. History shows handouts create dependency. The free market will create new opportunities as it always has.",
        modelId: "llama-2",
      },
      {
        id: "b5",
        text: "Maybe. Start with pilot programs to test effectiveness before full implementation.",
        modelId: "mistral",
      },
    ],
  },
];

export async function GET() {
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // For MVP, cycle through questions based on day
  const dayIndex = new Date().getDate() % QUESTIONS.length;
  const todayQuestion = QUESTIONS[dayIndex];
  
  // Update the ID to today's date
  todayQuestion.id = today;
  
  // Shuffle answers to randomize order
  const shuffledAnswers = [...todayQuestion.answers].sort(() => Math.random() - 0.5);
  
  return NextResponse.json({
    ...todayQuestion,
    answers: shuffledAnswers,
  });
}

export async function POST(request: Request) {
  const { questionId: _questionId, answerId: _answerId, userId: _userId } = await request.json();
  
  // For MVP, just return success
  // In production, this would save to database
  return NextResponse.json({
    success: true,
    points: 1,
    message: "Vote recorded successfully",
  });
}