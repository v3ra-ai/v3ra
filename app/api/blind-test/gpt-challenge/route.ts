import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { createLogger } from '@/lib/logger';
import { OpenAIValidator } from '@/lib/validators/providers/openai';
import { rateLimitModerate } from '@/lib/rate-limit/index';
import { ensureUserExists } from '@/lib/auth/ensure-user';
import { prisma } from '@/lib/db/client';
import { V3RAPointsService } from '@/lib/services/v3ra-points';
import { cache, getCacheKey } from '@/lib/cache/memory-cache';

const logger = createLogger('gpt-blind-test');

// Initialize validators for GPT-4o and GPT-5 comparison
const gpt4oValidator = new OpenAIValidator({
  name: 'GPT-4o',
  modelName: 'gpt-4o',
  active: true
});

// GPT-5 - OpenAI's latest model released August 2025
const gpt5Validator = new OpenAIValidator({
  name: 'GPT-5',
  modelName: 'gpt-5-chat-latest', // Using the chat-optimized GPT-5 model
  active: true
});

export const POST = rateLimitModerate(async (req: NextRequest) => {
  try {
    logger.info('Blind test endpoint called', {
      headers: Object.fromEntries(req.headers.entries()),
      cookies: req.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
    });

    // Get user from Supabase auth
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('Auth error:', authError);
    }
    
    if (!user) {
      logger.info('No user found in auth check');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userEmail = user.email || '';
    
    // Ensure user exists in database
    const { success: userExists } = await ensureUserExists(userId, userEmail);
    
    if (!userExists) {
      logger.error('Failed to ensure user exists');
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'start_session':
        return await startBlindTestSession(userId);
      
      case 'get_next_question':
        return await getNextQuestion(body.sessionId, body.questionNumber);
      
      case 'submit_vote':
        return await submitVote(userId, body);
      
      case 'complete_session':
        try {
          return await completeSession(userId, body.sessionId);
        } catch (error) {
          logger.error('Complete session error:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId,
            sessionId: body.sessionId
          });
          return NextResponse.json(
            { error: 'Failed to complete session', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Blind test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

async function startBlindTestSession(userId: string) {
  try {
    // Get the pre-selected questions first to ensure we have them
    const questions = await prisma.$queryRaw<Array<{
      id: string;
      question_text: string;
      category: string;
      difficulty: string;
    }>>`
      SELECT id, question_text, category, difficulty
      FROM blind_test_questions
      WHERE is_active = true
      ORDER BY RANDOM()
      LIMIT 5
    `;

    // Check if we have questions
    if (!questions || questions.length === 0) {
      logger.error('No questions found in blind_test_questions table');
      return NextResponse.json(
        { error: 'No questions available. Please contact support.' },
        { status: 500 }
      );
    }

    // Create a new blind test session
    const sessionId = uuidv4();
    await prisma.$executeRawUnsafe(`
      INSERT INTO blind_test_sessions (id, user_id, model_a_id, model_b_id, session_type)
      VALUES ($1::uuid, $2, $3, $4, 'gpt_comparison')
    `, sessionId, userId, 'gpt-4o', 'gpt-5');

    // Store the selected question IDs in order for this session
    const questionOrder = questions.map(q => q.id);
    await prisma.$executeRawUnsafe(`
      UPDATE blind_test_sessions
      SET question_order = $1::jsonb
      WHERE id = $2::uuid
    `, JSON.stringify(questionOrder), sessionId);

    logger.info('Blind test session started', { 
      sessionId, 
      userId, 
      questionCount: questions.length 
    });

    return NextResponse.json({
      sessionId: sessionId,
      totalQuestions: questions.length,
      questions: questions
    });
  } catch (error) {
    logger.error('Error starting session:', error);
    throw error;
  }
}

async function getNextQuestion(sessionId: string, questionNumber: number) {
  try {
    // Get the session's pre-selected questions
    const session = await prisma.$queryRaw<Array<{
      question_order: any;
    }>>`
      SELECT question_order
      FROM blind_test_sessions
      WHERE id = ${sessionId}::uuid
    `;

    if (!session[0] || !session[0].question_order) {
      // Fallback: get a random question
      const questions = await prisma.$queryRaw<Array<{
        id: string;
        question_text: string;
        category: string;
      }>>`
        SELECT id, question_text, category
        FROM blind_test_questions
        WHERE is_active = true
        ORDER BY RANDOM()
        LIMIT 1
      `;
      
      if (!questions[0]) {
        return NextResponse.json(
          { error: 'No more questions' },
          { status: 404 }
        );
      }
      
      const question = questions[0];
      const startTime = Date.now();
      const [response4o, response5] = await generateAIResponses(question.question_text);
      const endTime = Date.now();
      return await saveAndReturnResponse(sessionId, question, questionNumber, response4o, response5, startTime, endTime);
    }

    const questionIds = session[0].question_order;
    const questionId = questionIds[questionNumber - 1];

    if (!questionId) {
      return NextResponse.json(
        { error: 'No more questions' },
        { status: 404 }
      );
    }

    // Get the specific question
    const questions = await prisma.$queryRaw<Array<{
      id: string;
      question_text: string;
      category: string;
    }>>`
      SELECT id, question_text, category
      FROM blind_test_questions
      WHERE id = ${questionId}::uuid
    `;

    if (!questions[0]) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const question = questions[0];
    const startTime = Date.now();

    // Generate AI responses
    const [response4o, response5] = await generateAIResponses(question.question_text);
    const endTime = Date.now();

    return await saveAndReturnResponse(sessionId, question, questionNumber, response4o, response5, startTime, endTime);
  } catch (error) {
    logger.error('Error getting next question:', error);
    throw error;
  }
}

// Helper function to generate AI responses - let each model use its natural style
async function generateAIResponses(questionText: string) {
  return Promise.all([
    gpt4oValidator.validate({
      statement: questionText,
      context: 'Keep your response concise and under 100 words.'
    }),
    gpt5Validator.validate({
      statement: questionText,
      context: 'Keep your response concise and under 100 words.'
    })
  ]);
}

// Helper function to save response and return formatted data
async function saveAndReturnResponse(
  sessionId: string,
  question: any,
  questionNumber: number,
  response4o: any,
  response5: any,
  startTime: number,
  endTime: number
) {
  // Randomly assign positions
  const randomizePositions = Math.random() > 0.5;
  const modelA = randomizePositions ? 'gpt-4o' : 'gpt-5';
  const modelB = randomizePositions ? 'gpt-5' : 'gpt-4o';
  const responseA = randomizePositions ? response4o.rationale : response5.rationale;
  const responseB = randomizePositions ? response5.rationale : response4o.rationale;

  // Store the responses with model assignments
  const responseId = uuidv4();
  await prisma.$executeRawUnsafe(`
    INSERT INTO blind_test_responses (
      id, session_id, question_id, question_number,
      model_a_response, model_b_response,
      model_a_response_time, model_b_response_time,
      model_a_id, model_b_id
    )
    VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10)
  `, responseId, sessionId, question.id, questionNumber,
     responseA, responseB,
     response4o.latency || (endTime - startTime) / 2,
     response5.latency || (endTime - startTime) / 2,
     modelA, modelB
  );

  return NextResponse.json({
    questionId: question.id,
    questionNumber,
    questionText: question.question_text,
    category: question.category,
    responseId: responseId,
    responses: {
      A: responseA,
      B: responseB
    }
    // Model assignments are stored server-side only
  });
}

async function submitVote(userId: string, data: any) {
  const {
    sessionId,
    responseId,
    questionNumber,
    selectedPosition,
    voteReason,
    timeToDecide
  } = data;

  try {
    // Get the model assignments from the database
    const response = await prisma.$queryRaw<Array<{
      model_a_id: string;
      model_b_id: string;
    }>>`
      SELECT model_a_id, model_b_id
      FROM blind_test_responses
      WHERE id = ${responseId}::uuid
    `;
    
    if (!response[0]) {
      throw new Error('Response not found');
    }
    
    const selectedModel = selectedPosition === 'A' ? response[0].model_a_id : response[0].model_b_id;
    const notSelectedModel = selectedPosition === 'A' ? response[0].model_b_id : response[0].model_a_id;

    // Record the vote
    await prisma.$executeRawUnsafe(`
      INSERT INTO blind_test_votes (
        session_id, response_id, question_number,
        selected_position, selected_model_id, not_selected_model_id,
        vote_reason, time_to_decide
      )
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8)
    `, sessionId, responseId, questionNumber,
       selectedPosition, selectedModel, notSelectedModel,
       voteReason, timeToDecide
    );

    // Update session progress
    await prisma.$executeRawUnsafe(`
      UPDATE blind_test_sessions
      SET completed_questions = completed_questions + 1,
          updated_at = NOW()
      WHERE id = $1::uuid
    `, sessionId);

    // Update analytics
    await updateAnalytics(selectedModel, notSelectedModel, timeToDecide);

    return NextResponse.json({
      success: true,
      revealedModels: {
        selected: selectedModel,
        notSelected: notSelectedModel
      }
    });
  } catch (error) {
    logger.error('Error submitting vote:', error);
    throw error;
  }
}

async function completeSession(userId: string, sessionId: string) {
  try {
    logger.info('Starting session completion', { userId, sessionId });
    
    // Calculate points based on participation
    const basePoints = 100;
    const bonusPoints = Math.floor(Math.random() * 400) + 100; // 100-500 bonus
    const totalPoints = basePoints + bonusPoints;

    // Update session as completed
    await prisma.$executeRawUnsafe(`
      UPDATE blind_test_sessions
      SET status = 'completed',
          completed_at = NOW(),
          reward_points = $1,
          updated_at = NOW()
      WHERE id = $2::uuid AND user_id = $3
    `, totalPoints, sessionId, userId);
    
    logger.info('Session updated in database', { sessionId, totalPoints });

    // Get session results
    logger.info('Getting session results', { sessionId });
    
    const results = await prisma.$queryRaw<Array<{
      model: string;
      votes: bigint;
      avg_decision_time: number;
    }>>`
      SELECT 
        selected_model_id as model,
        COUNT(*) as votes,
        AVG(time_to_decide) as avg_decision_time
      FROM blind_test_votes
      WHERE session_id = ${sessionId}::uuid
      GROUP BY selected_model_id
    `;
    
    logger.info('Session results retrieved', { 
      sessionId, 
      resultCount: results?.length || 0,
      results: results?.map(r => ({ model: r.model, votes: Number(r.votes) }))
    });

    // Award points using the service for consistency
    try {
      await V3RAPointsService.awardPoints(
        userId,
        totalPoints,
        'VERIFICATION_REWARD', // Using existing transaction type
        `Completed GPT blind test challenge - ${totalPoints} points`
      );
      logger.info('Points awarded successfully', { userId, totalPoints });
    } catch (pointsError) {
      logger.error('Failed to award points but continuing', { 
        error: pointsError instanceof Error ? pointsError.message : String(pointsError),
        userId,
        totalPoints 
      });
      // Continue even if points awarding fails - user still completed the test
    }

    // Invalidate the points cache for this user
    try {
      const cacheKey = getCacheKey('points', userId);
      cache.delete('userPoints', cacheKey);
      logger.info('Points cache invalidated for user', { userId, cacheKey });
    } catch (cacheError) {
      logger.warn('Failed to invalidate cache', { error: cacheError });
    }

    // Handle the case where there might be no votes yet
    const processedResults = results || [];
    
    return NextResponse.json({
      completed: true,
      rewardPoints: totalPoints,
      scratchCardAvailable: true,
      results: processedResults.map(r => ({
        model: r.model,
        votes: Number(r.votes),
        avg_decision_time: r.avg_decision_time
      })),
      summary: {
        totalQuestions: 5,
        gpt4oVotes: Number(processedResults.find(r => r.model === 'gpt-4o')?.votes || 0),
        gpt5Votes: Number(processedResults.find(r => r.model === 'gpt-5')?.votes || 0)
      }
    });
  } catch (error) {
    logger.error('Error completing session:', error);
    throw error;
  }
}

async function updateAnalytics(selectedModel: string, notSelectedModel: string, timeToDecide: number) {
  try {
    // Update or insert analytics for the model pair
    await prisma.$executeRawUnsafe(`
      INSERT INTO blind_test_analytics (model_id, comparison_model_id, wins, total_comparisons, avg_time_to_decide, win_rate)
      VALUES ($1, $2, 1, 1, $3, 1.0)
      ON CONFLICT (model_id, comparison_model_id)
      DO UPDATE SET
        wins = blind_test_analytics.wins + 1,
        total_comparisons = blind_test_analytics.total_comparisons + 1,
        avg_time_to_decide = (
          (blind_test_analytics.avg_time_to_decide * blind_test_analytics.total_comparisons + $3) /
          (blind_test_analytics.total_comparisons + 1)
        ),
        win_rate = (blind_test_analytics.wins + 1.0) / (blind_test_analytics.total_comparisons + 1.0),
        last_updated = NOW()
    `, selectedModel, notSelectedModel, timeToDecide);

    // Update losses for the not selected model
    await prisma.$executeRawUnsafe(`
      INSERT INTO blind_test_analytics (model_id, comparison_model_id, losses, total_comparisons, win_rate)
      VALUES ($1, $2, 1, 1, 0.0)
      ON CONFLICT (model_id, comparison_model_id)
      DO UPDATE SET
        losses = blind_test_analytics.losses + 1,
        total_comparisons = blind_test_analytics.total_comparisons + 1,
        win_rate = (blind_test_analytics.wins + 0.0) / (blind_test_analytics.total_comparisons + 1.0),
        last_updated = NOW()
    `, notSelectedModel, selectedModel);
  } catch (error) {
    logger.error('Error updating analytics:', error);
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get overall statistics
    const stats = await prisma.$queryRaw`
      SELECT 
        model_id,
        SUM(wins) as total_wins,
        SUM(losses) as total_losses,
        AVG(win_rate) as overall_win_rate,
        AVG(avg_time_to_decide) as avg_decision_time
      FROM blind_test_analytics
      WHERE model_id IN ('gpt-4o', 'gpt-5')
      GROUP BY model_id
    `;

    return NextResponse.json({
      statistics: stats
    });
  } catch (error) {
    logger.error('Error getting statistics:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}
