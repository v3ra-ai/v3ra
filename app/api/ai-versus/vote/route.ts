import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-client'
import { creditUserPoints } from '@/lib/services/points'

export async function POST(request: NextRequest) {
  try {
    const { prompt, winnerId, loserId, userId } = await request.json()

    if (!prompt || !winnerId || !loserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Store the vote
    const { error: voteError } = await supabase
      .from('ai_versus_votes')
      .insert({
        user_id: userId || null,
        prompt,
        winner_model_id: winnerId,
        loser_model_id: loserId,
        created_at: new Date().toISOString()
      })

    if (voteError) {
      console.error('Error saving vote:', voteError)
      // Continue even if vote saving fails
    }

    // Award points if user is logged in
    if (userId) {
      try {
        // Base reward for voting
        await creditUserPoints(userId, 10, 'ai_versus_vote', {
          prompt,
          winner: winnerId
        })
      } catch (pointsError) {
        console.error('Error awarding points:', pointsError)
      }
    }

    // Update model statistics (win/loss counts)
    // This could be done in a background job for better performance
    await Promise.all([
      supabase.rpc('increment_model_wins', { model_id: winnerId }),
      supabase.rpc('increment_model_losses', { model_id: loserId })
    ]).catch(err => console.error('Error updating model stats:', err))

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Vote API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}